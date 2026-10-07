/* =========================================================
   BAAL STUDIO
   proyecto.js
   PÁGINA INDIVIDUAL DE PROYECTO
   ========================================================= */

(() => {

  "use strict";


  /* ---------------------------------------------------------
     PROTECCIÓN CONTRA DOBLE CARGA
     --------------------------------------------------------- */

  if (window.__BAAL_PROYECTO_LOADED__) {
    console.warn("[Baal Studio] proyecto.js ya estaba cargado.");
    return;
  }

  window.__BAAL_PROYECTO_LOADED__ = true;


  /* ---------------------------------------------------------
     CONFIGURACIÓN
     --------------------------------------------------------- */

  const PROJECTS_FUNCTION =
    "https://hlyzyeatnbulyfiiwvsq.supabase.co/functions/v1/list-projects";


  /* ---------------------------------------------------------
     INICIO
     --------------------------------------------------------- */

  document.addEventListener(
    "DOMContentLoaded",
    loadProject
  );


  /* ---------------------------------------------------------
     CARGA DEL PROYECTO
     --------------------------------------------------------- */

  async function loadProject() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    const requestedProject =
      params.get("project");


    if (!requestedProject) {

      showError(
        "No se ha indicado ningún proyecto."
      );

      return;

    }


    try {

      console.log(
        "[Baal Studio] Cargando proyecto:",
        requestedProject
      );


      const response =
        await fetch(
          PROJECTS_FUNCTION,
          {
            method: "GET",
            headers: {
              "Accept": "application/json"
            },
            cache: "no-store"
          }
        );


      if (!response.ok) {

        throw new Error(
          `list-projects respondió con HTTP ${response.status}`
        );

      }


      const data =
        await response.json();


      const projects =
        normalizeResponse(data);


      const project =
        findProject(
          projects,
          requestedProject
        );


      if (!project) {

        showError(
          "No se ha encontrado el proyecto solicitado."
        );

        return;

      }


      renderProject(
        project
      );


      applyImageProtection();


    } catch (error) {

      console.error(
        "[Baal Studio] Error cargando proyecto:",
        error
      );


      showError(
        "No ha sido posible cargar este proyecto."
      );

    }

  }


  /* ---------------------------------------------------------
     NORMALIZACIÓN
     --------------------------------------------------------- */

  function normalizeResponse(data) {

    if (!data) {
      return [];
    }


    if (Array.isArray(data)) {
      return data;
    }


    if (Array.isArray(data.projects)) {
      return data.projects;
    }


    if (Array.isArray(data.data)) {
      return data.data;
    }


    return [];

  }


  /* ---------------------------------------------------------
     BUSCAR PROYECTO
     --------------------------------------------------------- */

  function findProject(
    projects,
    requestedProject
  ) {

    const normalized =
      normalizeName(
        requestedProject
      );


    return projects.find(
      (project) => {

        const candidates = [

          project.name,

          project.folder,

          project.folderName,

          project.projectName,

          project.nombre

        ];


        return candidates.some(
          (candidate) =>
            normalizeName(
              candidate
            ) === normalized
        );

      }
    );

  }


  /* ---------------------------------------------------------
     NORMALIZAR NOMBRE
     --------------------------------------------------------- */

  function normalizeName(
    value
  ) {

    return String(
      value || ""
    )

      .trim()

      .toLowerCase();

  }


  /* ---------------------------------------------------------
     RENDER PRINCIPAL
     --------------------------------------------------------- */

  function renderProject(
    project
  ) {

    const metadata =
      project.metadata &&
      typeof project.metadata === "object"
        ? project.metadata
        : {};


    const title =
      cleanTitle(
        metadata.titulo ||
        metadata.title ||
        project.titulo ||
        project.title ||
        project.name ||
        "Proyecto"
      );


    document.title =
      `${title} — Baal Studio`;


    /* -------------------------------------------------------
       HERO
       ------------------------------------------------------- */

    setText(
      "project-title",
      title
    );


    setText(
      "project-title-en",
      metadata.titulo_en ||
      metadata.title_en ||
      "Project"
    );


    setText(
      "project-category",
      metadata.categoria ||
      metadata.category ||
      "Proyecto"
    );


    renderHeroMeta(
      metadata,
      project
    );


    renderCover(
      project
    );


    /* -------------------------------------------------------
       INFORMACIÓN
       ------------------------------------------------------- */

    renderInformation(
      metadata
    );


    /* -------------------------------------------------------
       CONTENIDO
       ------------------------------------------------------- */

    renderBlocks(
      project.blocks || []
    );


    /* -------------------------------------------------------
       RECURSOS
       ------------------------------------------------------- */

    renderResources(
      project
    );

  }


  /* ---------------------------------------------------------
     HERO — METADATA
     --------------------------------------------------------- */

  function renderHeroMeta(
    metadata,
    project
  ) {

    const container =
      document.getElementById(
        "project-hero-meta"
      );


    if (!container) {
      return;
    }


    container.innerHTML = "";


    addHeroMeta(
      container,
      "Ubicación",
      "Location",
      metadata.localizacion ||
      metadata.location ||
      project.localizacion ||
      project.location
    );


    addHeroMeta(
      container,
      "Año",
      "Year",
      metadata.año ||
      metadata.year ||
      project.año ||
      project.year
    );


    addHeroMeta(
      container,
      "Categoría",
      "Category",
      metadata.categoria ||
      metadata.category
    );


    addHeroMeta(
      container,
      "Subcategoría",
      "Subcategory",
      metadata.subcategoria ||
      metadata.subcategory
    );

  }


  function addHeroMeta(
    container,
    label,
    english,
    value
  ) {

    if (
      value === undefined ||
      value === null ||
      !String(value).trim()
    ) {
      return;
    }


    const item =
      document.createElement(
        "div"
      );


    item.className =
      "project-hero-meta-item";


    item.innerHTML =
      `
        <span class="project-hero-meta-label">
          ${escapeHtml(label)}
          ·
          ${escapeHtml(english)}
        </span>

        <span class="project-hero-meta-value">
          ${escapeHtml(String(value))}
        </span>
      `;


    container.appendChild(
      item
    );

  }


  /* ---------------------------------------------------------
     PORTADA
     --------------------------------------------------------- */

  function renderCover(
    project
  ) {

    const image =
      document.getElementById(
        "project-cover"
      );


    if (!image) {
      return;
    }


    const cover =
      extractCover(
        project
      );


    if (!cover) {

      image.style.display =
        "none";

      return;

    }


    image.src =
      cover;


    image.alt =
      cleanTitle(
        project.metadata?.titulo ||
        project.metadata?.title ||
        project.name ||
        "Proyecto Baal Studio"
      );


    image.addEventListener(
      "error",
      () => {

        console.error(
          "[Baal Studio] Error cargando portada:",
          cover
        );

      }
    );

  }


  /* ---------------------------------------------------------
     INFORMACIÓN
     --------------------------------------------------------- */

  function renderInformation(
    metadata
  ) {

    const container =
      document.getElementById(
        "project-information-content"
      );


    if (!container) {
      return;
    }


    container.innerHTML = "";


    const description =
      metadata.descripcion ||
      metadata.description;


    if (description) {

      const paragraph =
        document.createElement(
          "p"
        );


      paragraph.className =
        "project-description";


      paragraph.textContent =
        String(description).trim();


      container.appendChild(
        paragraph
      );

    }


    const dataGrid =
      document.createElement(
        "div"
      );


    dataGrid.className =
      "project-data-grid";


    addData(
      dataGrid,
      "Técnicas",
      "Techniques",
      metadata.tecnicas ||
      metadata.techniques
    );


    addData(
      dataGrid,
      "Objetivo",
      "Objective",
      metadata.objetivo ||
      metadata.objective
    );


    addData(
      dataGrid,
      "Autoría",
      "Authorship",
      metadata.autoria ||
      metadata.authorship
    );


    addData(
      dataGrid,
      "Colaboración",
      "Collaboration",
      metadata.colaboracion ||
      metadata.collaboration
    );


    if (
      dataGrid.children.length
    ) {

      container.appendChild(
        dataGrid
      );

    }

  }


  function addData(
    container,
    label,
    english,
    value
  ) {

    if (
      value === undefined ||
      value === null ||
      !String(value).trim()
    ) {
      return;
    }


    const item =
      document.createElement(
        "div"
      );


    item.className =
      "project-data-item";


    item.innerHTML =
      `
        <span class="project-data-label">
          ${escapeHtml(label)}
          ·
          ${escapeHtml(english)}
        </span>

        <span class="project-data-value">
          ${escapeHtml(String(value))}
        </span>
      `;


    container.appendChild(
      item
    );

  }


  /* ---------------------------------------------------------
     BLOQUES
     --------------------------------------------------------- */

  function renderBlocks(
    blocks
  ) {

    const container =
      document.getElementById(
        "project-content"
      );


    if (!container) {
      return;
    }


    container.innerHTML = "";


    if (
      !Array.isArray(blocks) ||
      !blocks.length
    ) {

      document
        .getElementById(
          "project-content-section"
        )
        ?.remove();

      return;

    }


    blocks.forEach(
      (block, index) => {

        renderBlock(
          container,
          block,
          index
        );

      }
    );

  }


  /* ---------------------------------------------------------
     BLOQUE INDIVIDUAL
     --------------------------------------------------------- */

  function renderBlock(
    container,
    block,
    index
  ) {

    if (
      !block ||
      typeof block !== "object"
    ) {
      return;
    }


    const type =
      String(
        block.type ||
        ""
      ).toLowerCase();


    switch (type) {

      case "image":
        renderImageBlock(
          container,
          block,
          index
        );
        break;


      case "carousel":
        renderCarouselBlock(
          container,
          block,
          index
        );
        break;


      case "video":
        renderVideoBlock(
          container,
          block,
          index
        );
        break;


      case "pdf":
        renderPdfBlock(
          container,
          block,
          index
        );
        break;


      case "sketchfab":
        renderSketchfabBlock(
          container,
          block,
          index
        );
        break;


      case "text":
        renderTextBlock(
          container,
          block,
          index
        );
        break;


      default:

        console.warn(
          "[Baal Studio] Tipo de bloque no reconocido:",
          type,
          block
        );

        renderUnknownBlock(
          container,
          block,
          index
        );

        break;

    }

  }


  /* ---------------------------------------------------------
     IMAGEN
     --------------------------------------------------------- */

  function renderImageBlock(
    container,
    block,
    index
  ) {

    const url =
      block.url ||
      block.src;


    if (!url) {
      return;
    }


    const section =
      createBlockContainer();


    addBlockTitle(
      section,
      block.title ||
      block.text
    );


    const frame =
      document.createElement(
        "div"
      );


    frame.className =
      "project-image-frame protected-media";


    const image =
      document.createElement(
        "img"
      );


    image.className =
      "protected-image";


    image.src =
      url;


    image.alt =
      block.file ||
      block.reference ||
      `Imagen ${index + 1}`;


    image.loading =
      "lazy";


    image.draggable =
      false;


    frame.appendChild(
      image
    );


    section.appendChild(
      frame
    );


    container.appendChild(
      section
    );

  }


  /* ---------------------------------------------------------
     CARRUSEL
     --------------------------------------------------------- */

  function renderCarouselBlock(
    container,
    block,
    index
  ) {

    const images =
      Array.isArray(block.images)
        ? block.images
        : [];


    const validImages =
      images.filter(
        image =>
          image &&
          (
            image.url ||
            image.src
          )
      );


    if (!validImages.length) {
      return;
    }


    const section =
      createBlockContainer();


    addBlockTitle(
      section,
      block.text ||
      block.title
    );


    const carousel =
      document.createElement(
        "div"
      );


    carousel.className =
      "project-carousel";


    const stage =
      document.createElement(
        "div"
      );


    stage.className =
      "project-carousel-stage";


    const image =
      document.createElement(
        "img"
      );


    image.className =
      "project-carousel-image protected-image";


    image.draggable =
      false;


    stage.appendChild(
      image
    );


    const previous =
      document.createElement(
        "button"
      );


    previous.type =
      "button";


    previous.className =
      "project-carousel-button prev";


    previous.innerHTML =
      "←";


    previous.setAttribute(
      "aria-label",
      "Imagen anterior"
    );


    const next =
      document.createElement(
        "button"
      );


    next.type =
      "button";


    next.className =
      "project-carousel-button next";


    next.innerHTML =
      "→";


    next.setAttribute(
      "aria-label",
      "Imagen siguiente"
    );


    stage.appendChild(
      previous
    );


    stage.appendChild(
      next
    );


    carousel.appendChild(
      stage
    );


    const counter =
      document.createElement(
        "div"
      );


    counter.className =
      "project-carousel-counter";


    carousel.appendChild(
      counter
    );


    if (block.text) {

      const caption =
        document.createElement(
          "div"
        );


      caption.className =
        "project-carousel-caption";


      caption.textContent =
        block.text;


      carousel.appendChild(
        caption
      );

    }


    let current =
      0;


    function updateCarousel() {

      const currentImage =
        validImages[current];


      image.src =
        currentImage.url ||
        currentImage.src;


      image.alt =
        currentImage.file ||
        currentImage.reference ||
        "";


      counter.textContent =
        `${String(current + 1).padStart(2, "0")} / ${String(validImages.length).padStart(2, "0")}`;

    }


    previous.addEventListener(
      "click",
      () => {

        current--;

        if (
          current < 0
        ) {
          current =
            validImages.length - 1;
        }

        updateCarousel();

      }
    );


    next.addEventListener(
      "click",
      () => {

        current++;

        if (
          current >=
          validImages.length
        ) {
          current = 0;
        }

        updateCarousel();

      }
    );


    updateCarousel();


    section.appendChild(
      carousel
    );


    container.appendChild(
      section
    );

  }


  /* ---------------------------------------------------------
     VÍDEO
     --------------------------------------------------------- */

  function renderVideoBlock(
    container,
    block,
    index
  ) {

    const value =
      block.value ||
      block.url ||
      block.src;


    if (!value) {
      return;
    }


    const embed =
      convertVideoToEmbed(
        value
      );


    if (!embed) {
      return;
    }


    const section =
      createBlockContainer();


    addBlockTitle(
      section,
      block.title
    );


    const frame =
      document.createElement(
        "div"
      );


    frame.className =
      "project-video-frame";


    const iframe =
      document.createElement(
        "iframe"
      );


    iframe.src =
      embed;


    iframe.loading =
      "lazy";


    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";


    iframe.allowFullscreen =
      true;


    frame.appendChild(
      iframe
    );


    section.appendChild(
      frame
    );


    container.appendChild(
      section
    );

  }


  /* ---------------------------------------------------------
     PDF
     --------------------------------------------------------- */

  function renderPdfBlock(
    container,
    block,
    index
  ) {

    const url =
      block.url;


    if (!url) {
      return;
    }


    const section =
      createBlockContainer();


    addBlockTitle(
      section,
      block.title ||
      block.file
    );


    const frame =
      document.createElement(
        "div"
      );


    frame.className =
      "project-pdf-frame";


    const iframe =
      document.createElement(
        "iframe"
      );


    iframe.src =
      url;


    iframe.loading =
      "lazy";


    iframe.title =
      block.file ||
      "Documento PDF";


    frame.appendChild(
      iframe
    );


    section.appendChild(
      frame
    );


    container.appendChild(
      section
    );

  }


  /* ---------------------------------------------------------
     SKETCHFAB
     --------------------------------------------------------- */

  function renderSketchfabBlock(
    container,
    block,
    index
  ) {

    const urls =
      Array.isArray(block.urls)
        ? block.urls
        : [];


    if (!urls.length) {
      return;
    }


    urls.forEach(
      (url, modelIndex) => {

        const section =
          createBlockContainer();


        if (urls.length > 1) {

          addBlockTitle(
            section,
            `Modelo 3D ${modelIndex + 1}`
          );

        } else {

          addBlockTitle(
            section,
            block.title ||
            "Modelo 3D"
          );

        }


        const frame =
          document.createElement(
            "div"
          );


        frame.className =
          "project-model-frame";


        const iframe =
          document.createElement(
            "iframe"
          );


        iframe.src =
          url;


        iframe.loading =
          "lazy";


        iframe.allowFullscreen =
          true;


        iframe.allow =
          "autoplay; fullscreen; xr-spatial-tracking";


        frame.appendChild(
          iframe
        );


        section.appendChild(
          frame
        );


        const link =
          document.createElement(
            "a"
          );


        link.className =
          "project-model-link";


        link.href =
          url;


        link.target =
          "_blank";


        link.rel =
          "noopener noreferrer";


        link.textContent =
          "Abrir modelo 3D";


        section.appendChild(
          link
        );


        container.appendChild(
          section
        );

      }
    );

  }


  /* ---------------------------------------------------------
     TEXTO
     --------------------------------------------------------- */

  function renderTextBlock(
    container,
    block,
    index
  ) {

    const text =
      block.text ||
      block.value;


    if (!text) {
      return;
    }


    const section =
      createBlockContainer();


    addBlockTitle(
      section,
      block.title
    );


    const paragraph =
      document.createElement(
        "p"
      );


    paragraph.className =
      "project-description";


    paragraph.textContent =
      text;


    section.appendChild(
      paragraph
    );


    container.appendChild(
      section
    );

  }


  /* ---------------------------------------------------------
     BLOQUE DESCONOCIDO
     --------------------------------------------------------- */

  function renderUnknownBlock(
    container,
    block,
    index
  ) {

    if (!block.url) {
      return;
    }


    if (
      isImageUrl(
        block.url
      )
    ) {

      renderImageBlock(
        container,
        block,
        index
      );

    }

  }


  /* ---------------------------------------------------------
     CONTENEDOR DE BLOQUE
     --------------------------------------------------------- */

  function createBlockContainer() {

    const section =
      document.createElement(
        "article"
      );


    section.className =
      "project-block";


    return section;

  }


  /* ---------------------------------------------------------
     TÍTULO DE BLOQUE
     --------------------------------------------------------- */

  function addBlockTitle(
    section,
    title
  ) {

    if (
      !title ||
      !String(title).trim()
    ) {
      return;
    }


    const heading =
      document.createElement(
        "h2"
      );


    heading.className =
      "project-block-title";


    heading.textContent =
      title;


    section.appendChild(
      heading
    );

  }


  /* ---------------------------------------------------------
     RECURSOS EXTERNOS
     --------------------------------------------------------- */

  function renderResources(
    project
  ) {

    const container =
      document.getElementById(
        "project-resources"
      );


    const section =
      document.getElementById(
        "project-resources-section"
      );


    if (
      !container ||
      !section
    ) {
      return;
    }


    container.innerHTML =
      "";


    let hasResources =
      false;


    const articles =
      Array.isArray(project.articles)
        ? project.articles
        : [];


    articles.forEach(
      (url, index) => {

        if (!url) {
          return;
        }


        hasResources =
          true;


        container.appendChild(
          createResourceLink(
            url,
            `Artículo ${index + 1}`,
            "Article"
          )
        );

      }
    );


    if (
      project.video &&
      !hasVideoBlock(
        project
      )
    ) {

      hasResources =
        true;


      container.appendChild(
        createResourceLink(
          project.video,
          "Vídeo",
          "Video"
        )
      );

    }


    if (
      !hasResources
    ) {

      section.remove();

    }

  }


  function createResourceLink(
    url,
    spanish,
    english
  ) {

    const link =
      document.createElement(
        "a"
      );


    link.className =
      "project-resource-link";


    link.href =
      url;


    link.target =
      "_blank";


    link.rel =
      "noopener noreferrer";


    link.innerHTML =
      `
        <span class="project-resource-link-main">
          ${escapeHtml(spanish)}
        </span>

        <span class="project-resource-link-en">
          ${escapeHtml(english)}
        </span>
      `;


    return link;

  }


  /* ---------------------------------------------------------
     VÍDEO
     --------------------------------------------------------- */

  function convertVideoToEmbed(
    url
  ) {

    try {

      const parsed =
        new URL(url);


      if (
        parsed.hostname.includes(
          "youtu.be"
        )
      ) {

        const id =
          parsed.pathname
            .replace(
              /^\/+/,
              ""
            )
            .split("/")[0];


        return id
          ? `https://www.youtube.com/embed/${id}`
          : "";

      }


      if (
        parsed.hostname.includes(
          "youtube.com"
        )
      ) {

        const id =
          parsed.searchParams.get(
            "v"
          );


        if (id) {

          return (
            `https://www.youtube.com/embed/${id}`
          );

        }


        if (
          parsed.pathname.startsWith(
            "/embed/"
          )
        ) {

          return url;

        }

      }


      return "";

    } catch {

      return "";

    }

  }


  /* ---------------------------------------------------------
     DETECTAR VÍDEO YA REPRESENTADO
     --------------------------------------------------------- */

  function hasVideoBlock(
    project
  ) {

    return Array.isArray(
      project.blocks
    ) &&
    project.blocks.some(
      block =>
        String(
          block?.type ||
          ""
        ).toLowerCase() ===
        "video"
    );

  }


  /* ---------------------------------------------------------
     PORTADA
     --------------------------------------------------------- */

  function extractCover(
    project
  ) {

    if (
      project.cover &&
      typeof project.cover === "object"
    ) {

      return (
        project.cover.url ||
        project.cover.signedUrl ||
        ""
      );

    }


    if (
      typeof project.cover === "string"
    ) {

      return project.cover;

    }


    return (
      project.coverUrl ||
      project.cover_url ||
      project.imageUrl ||
      project.image_url ||
      ""
    );

  }


  /* ---------------------------------------------------------
     IMAGEN
     --------------------------------------------------------- */

  function isImageUrl(
    value
  ) {

    if (
      typeof value !== "string"
    ) {
      return false;
    }


    const url =
      value
        .split("?")[0]
        .toLowerCase();


    return (
      url.endsWith(".jpg") ||
      url.endsWith(".jpeg") ||
      url.endsWith(".png") ||
      url.endsWith(".webp") ||
      url.endsWith(".avif") ||
      url.endsWith(".gif") ||
      url.includes("/storage/")
    );

  }


  /* ---------------------------------------------------------
     TEXTO
     --------------------------------------------------------- */

  function cleanTitle(
    value
  ) {

    return String(
      value || ""
    )

      .replace(
        /\s*[.!?]+\s*$/,
        ""
      )

      .replace(
        /\s+/g,
        " "
      )

      .trim();

  }


  function setText(
    id,
    value
  ) {

    const element =
      document.getElementById(
        id
      );


    if (element) {
      element.textContent =
        value || "";
    }

  }


  /* ---------------------------------------------------------
     ESCAPADO
     --------------------------------------------------------- */

  function escapeHtml(
    value
  ) {

    return String(
      value
    )

      .replace(
        /&/g,
        "&amp;"
      )

      .replace(
        /</g,
        "&lt;"
      )

      .replace(
        />/g,
        "&gt;"
      )

      .replace(
        /"/g,
        "&quot;"
      )

      .replace(
        /'/g,
        "&#039;"
      );

  }


  /* ---------------------------------------------------------
     ERROR
     --------------------------------------------------------- */

  function showError(
    message
  ) {

    const page =
      document.getElementById(
        "project-page"
      );


    if (!page) {
      return;
    }


    page.innerHTML =
      `
        <section class="project-error">
          <div class="section-container">
            ${escapeHtml(message)}
          </div>
        </section>
      `;

  }


  /* ---------------------------------------------------------
     PROTECCIÓN DE IMÁGENES
     --------------------------------------------------------- */

  function applyImageProtection() {

    const images =
      document.querySelectorAll(
        ".protected-image"
      );


    images.forEach(
      (image) => {

        image.draggable =
          false;


        image.setAttribute(
          "draggable",
          "false"
        );


        image.addEventListener(
          "dragstart",
          (event) => {

            event.preventDefault();

          }
        );


        image.addEventListener(
          "contextmenu",
          (event) => {

            event.preventDefault();

          }
        );

      }
    );


    const media =
      document.querySelectorAll(
        ".protected-media"
      );


    media.forEach(
      (element) => {

        element.addEventListener(
          "contextmenu",
          (event) => {

            event.preventDefault();

          }
        );

      }
    );

  }

})();
