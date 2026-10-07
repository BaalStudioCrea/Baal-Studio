/* =========================================================
   BAAL STUDIO — VISOR DE PROYECTO
   visor.js
   ========================================================= */

(() => {

  "use strict";


  /* ---------------------------------------------------------
     CONFIGURACIÓN
     --------------------------------------------------------- */

  const GET_PROJECTS_FUNCTION =
    "https://hlyzyeatnbulyfiiwvsq.supabase.co/functions/v1/get-projects";


  /* ---------------------------------------------------------
     INICIO
     --------------------------------------------------------- */

  document.addEventListener(
    "DOMContentLoaded",
    loadProject
  );


  /* ---------------------------------------------------------
     CARGAR PROYECTO
     --------------------------------------------------------- */

  async function loadProject() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    const projectName =
      params.get("project") ||
      params.get("name") ||
      params.get("folder");


    if (!projectName) {

      showError(
        "No se ha indicado ningún proyecto."
      );

      return;

    }


    console.log(
      "[Baal Studio] Proyecto solicitado:",
      projectName
    );


    try {

      const project =
        await fetchProject(
          projectName
        );


      if (!project) {

        throw new Error(
          "No se encontró el proyecto solicitado."
        );

      }


      console.log(
        "[Baal Studio] Proyecto recibido:",
        project
      );


      renderProject(
        project
      );


    } catch (error) {

      console.error(
        "[Baal Studio] Error cargando proyecto:",
        error
      );


      showError(
        error.message
      );

    }

  }


  /* ---------------------------------------------------------
     CONSULTAR GET-PROJECTS
     --------------------------------------------------------- */

  async function fetchProject(
    projectName
  ) {

    const url =
      GET_PROJECTS_FUNCTION +
      "?project=" +
      encodeURIComponent(
        projectName
      );


    const response =
      await fetch(
        url,
        {
          method: "GET",

          headers: {
            "Accept":
              "application/json"
          },

          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `get-projects respondió con HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    console.log(
      "[Baal Studio] Respuesta get-projects:",
      data
    );


    return findRequestedProject(
      data,
      projectName
    );

  }


  /* ---------------------------------------------------------
     ENCONTRAR PROYECTO
     --------------------------------------------------------- */

  function findRequestedProject(
    data,
    requestedName
  ) {

    if (!data) {
      return null;
    }


    let projects = [];


    if (
      Array.isArray(data)
    ) {

      projects =
        data;

    } else if (
      Array.isArray(data.projects)
    ) {

      projects =
        data.projects;

    } else if (
      Array.isArray(data.data)
    ) {

      projects =
        data.data;

    } else if (
      Array.isArray(data.results)
    ) {

      projects =
        data.results;

    } else if (
      data.project &&
      typeof data.project === "object"
    ) {

      projects =
        [data.project];

    } else if (
      data.name ||
      data.folder ||
      data.folderName
    ) {

      projects =
        [data];

    }


    if (!projects.length) {
      return null;
    }


    const requested =
      normalizeName(
        requestedName
      );


    const exact =
      projects.find(
        project => {

          const names = [

            project?.name,

            project?.folder,

            project?.folderName,

            project?.projectName,

            project?.nombre,

            project?.titulo

          ];


          return names.some(
            name =>
              normalizeName(name) ===
              requested
          );

        }
      );


    if (exact) {
      return exact;
    }


    /*
       Si get-projects ya devuelve un único
       proyecto, lo aceptamos.
    */

    if (
      projects.length === 1
    ) {

      return projects[0];

    }


    return null;

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
     RENDERIZAR PROYECTO
     --------------------------------------------------------- */

  function renderProject(
    project
  ) {

    const metadata =
      getMetadata(
        project
      );


    const title =
      getFirstValue(
        project,
        metadata,
        [
          "titulo",
          "title",
          "nombre",
          "name"
        ]
      );


    const englishTitle =
      getFirstValue(
        project,
        metadata,
        [
          "titulo_en",
          "title_en",
          "englishTitle",
          "english_title",
          "nombre_en",
          "name_en"
        ]
      );


    const category =
      getFirstValue(
        project,
        metadata,
        [
          "categoria",
          "categoría",
          "category",
          "tipo",
          "type"
        ]
      );


    const techniques =
      getFirstValue(
        project,
        metadata,
        [
          "tecnicas",
          "técnicas",
          "techniques",
          "tecnica",
          "técnica",
          "technique"
        ]
      );


    const objective =
      getFirstValue(
        project,
        metadata,
        [
          "objetivo",
          "objective",
          "objectives"
        ]
      );


    const description =
      getFirstValue(
        project,
        metadata,
        [
          "descripcion",
          "descripción",
          "description"
        ]
      );


    renderHeader(
      title,
      englishTitle,
      category
    );


    renderMetadata(
      category,
      techniques,
      objective
    );


    renderDescription(
      description
    );


    renderResources(
      project
    );


    document.title =
      `${cleanTitle(title || project.name || "Proyecto")} — Baal Studio`;

  }


  /* ---------------------------------------------------------
     METADATA
     --------------------------------------------------------- */

  function getMetadata(
    project
  ) {

    let metadata =
      project?.metadata || {};


    if (
      typeof metadata === "string"
    ) {

      try {

        metadata =
          JSON.parse(
            metadata
          );

      } catch {

        metadata =
          {};

      }

    }


    return metadata;

  }


  /* ---------------------------------------------------------
     HEADER
     --------------------------------------------------------- */

  function renderHeader(
    title,
    englishTitle,
    category
  ) {

    const titleElement =
      document.getElementById(
        "viewer-title"
      );


    const titleEnElement =
      document.getElementById(
        "viewer-title-en"
      );


    const categoryElement =
      document.getElementById(
        "viewer-category"
      );


    if (titleElement) {

      titleElement.textContent =
        cleanTitle(
          title || "Proyecto"
        );

    }


    if (titleEnElement) {

      titleEnElement.textContent =
        cleanText(
          englishTitle
        );

    }


    if (categoryElement) {

      categoryElement.textContent =
        cleanText(
          category
        );

    }

  }


  /* ---------------------------------------------------------
     METADATA VISUAL
     --------------------------------------------------------- */

  function renderMetadata(
    category,
    techniques,
    objective
  ) {

    const container =
      document.getElementById(
        "viewer-metadata"
      );


    if (!container) {
      return;
    }


    container.innerHTML =
      "";


    addMetadata(
      container,
      "Categoría",
      "Category",
      category
    );


    addMetadata(
      container,
      "Técnicas",
      "Techniques",
      techniques
    );


    addMetadata(
      container,
      "Objetivo",
      "Objective",
      objective
    );

  }


  function addMetadata(
    container,
    spanish,
    english,
    value
  ) {

    if (!value) {
      return;
    }


    const item =
      document.createElement(
        "div"
      );


    item.className =
      "viewer-metadata-item";


    item.innerHTML = `

      <div class="viewer-metadata-label">

        <span>
          ${escapeHtml(spanish)}
        </span>

        <small>
          ${escapeHtml(english)}
        </small>

      </div>

      <div class="viewer-metadata-value"></div>

    `;


    item
      .querySelector(
        ".viewer-metadata-value"
      )
      .textContent =
        formatValue(value);


    container.appendChild(
      item
    );

  }


  /* ---------------------------------------------------------
     DESCRIPCIÓN
     --------------------------------------------------------- */

  function renderDescription(
    description
  ) {

    const container =
      document.getElementById(
        "viewer-description"
      );


    if (!container) {
      return;
    }


    container.innerHTML =
      "";


    if (!description) {
      return;
    }


    const paragraphs =
      splitParagraphs(
        description
      );


    paragraphs.forEach(
      paragraph => {

        const p =
          document.createElement(
            "p"
          );


        p.textContent =
          paragraph;


        container.appendChild(
          p
        );

      }
    );

  }


  /* ---------------------------------------------------------
     RECURSOS
     --------------------------------------------------------- */

  function renderResources(
    project
  ) {

    const container =
      document.getElementById(
        "viewer-resources"
      );


    if (!container) {
      return;
    }


    container.innerHTML =
      "";


    const blocks =
      Array.isArray(
        project?.blocks
      )
        ? project.blocks
        : [];


    let rendered =
      false;


    /*
       BLOQUES DEL PROYECTO
    */

    blocks.forEach(
      block => {

        if (
          !block ||
          typeof block !== "object"
        ) {

          return;

        }


        const result =
          renderBlock(
            block
          );


        if (result) {

          container.appendChild(
            result
          );

          rendered = true;

        }

      }
    );


    /*
       SKETCHFAB DIRECTO
    */

    if (
      !blocks.some(
        block =>
          block?.type ===
          "sketchfab"
      )
    ) {

      const sketchfab =
        project?.sketchfab;


      if (
        Array.isArray(sketchfab) &&
        sketchfab.length
      ) {

        const block =
          renderSketchfabBlock(
            sketchfab
          );


        if (block) {

          container.appendChild(
            block
          );

          rendered = true;

        }

      }

    }


    /*
       VÍDEO DIRECTO
    */

    if (
      !blocks.some(
        block =>
          block?.type ===
          "video"
      )
    ) {

      const video =
        project?.video;


      if (video) {

        const block =
          renderVideoBlock(
            video
          );


        if (block) {

          container.appendChild(
            block
          );

          rendered = true;

        }

      }

    }


    /*
       ARTÍCULOS
    */

    if (
      Array.isArray(
        project?.articles
      ) &&
      project.articles.length
    ) {

      const block =
        renderArticlesBlock(
          project.articles
        );


      if (block) {

        container.appendChild(
          block
        );

        rendered = true;

      }

    }


    if (!rendered) {

      const message =
        document.createElement(
          "div"
        );


      message.className =
        "viewer-loading";


      message.textContent =
        "No hay recursos adicionales disponibles.";


      container.appendChild(
        message
      );

    }

  }


  /* ---------------------------------------------------------
     RENDERIZAR BLOQUE
     --------------------------------------------------------- */

  function renderBlock(
    block
  ) {

    const type =
      String(
        block.type || ""
      )
        .trim()
        .toLowerCase();


    switch (type) {

      case "image":
        return renderImageBlock(
          block
        );


      case "carousel":
        return renderCarouselBlock(
          block
        );


      case "pdf":
        return renderPdfBlock(
          block
        );


      case "sketchfab":
        return renderSketchfabBlock(
          block.urls ||
          block.url ||
          []
        );


      case "video":
        return renderVideoBlock(
          block.value ||
          block.url
        );


      case "text":
        return renderTextBlock(
          block
        );


      default:
        return null;

    }

  }


  /* ---------------------------------------------------------
     IMAGEN
     --------------------------------------------------------- */

  function renderImageBlock(
    block
  ) {

    const url =
      getBlockUrl(
        block
      );


    if (!url) {
      return null;
    }


    const resource =
      createResource(
        "Imagen",
        "Image"
      );


    const image =
      document.createElement(
        "img"
      );


    image.className =
      "viewer-single-image protected-image";


    image.src =
      url;


    image.alt =
      cleanText(
        block.text ||
        block.file ||
        ""
      );


    image.draggable =
      false;


    resource
      .querySelector(
        ".viewer-resource-body"
      )
      .appendChild(
        image
      );


    return resource;

  }


  /* ---------------------------------------------------------
     CARRUSEL
     --------------------------------------------------------- */

  function renderCarouselBlock(
    block
  ) {

    const images =
      Array.isArray(
        block.images
      )
        ? block.images
        : [];


    if (!images.length) {
      return null;
    }


    const resource =
      createResource(
        block.text ||
        "Galería",
        "Gallery"
      );


    const carousel =
      document.createElement(
        "div"
      );


    carousel.className =
      "viewer-carousel";


    const track =
      document.createElement(
        "div"
      );


    track.className =
      "viewer-carousel-track";


    images.forEach(
      imageData => {

        const url =
          extractUrl(
            imageData
          );


        if (!url) {
          return;
        }


        const slide =
          document.createElement(
            "div"
          );


        slide.className =
          "viewer-carousel-slide";


        const image =
          document.createElement(
            "img"
          );


        image.src =
          url;


        image.alt =
          cleanText(
            imageData.reference ||
            imageData.file ||
            ""
          );


        image.className =
          "protected-image";


        image.draggable =
          false;


        slide.appendChild(
          image
        );


        track.appendChild(
          slide
        );

      }
    );


    carousel.appendChild(
      track
    );


    const prev =
      document.createElement(
        "button"
      );


    prev.className =
      "viewer-carousel-button prev";


    prev.type =
      "button";


    prev.textContent =
      "←";


    const next =
      document.createElement(
        "button"
      );


    next.className =
      "viewer-carousel-button next";


    next.type =
      "button";


    next.textContent =
      "→";


    carousel.appendChild(
      prev
    );


    carousel.appendChild(
      next
    );


    const counter =
      document.createElement(
        "div"
      );


    counter.className =
      "viewer-carousel-counter";


    resource
      .querySelector(
        ".viewer-resource-body"
      )
      .appendChild(
        carousel
      );


    resource
      .querySelector(
        ".viewer-resource-body"
      )
      .appendChild(
        counter
      );


    let current =
      0;


    const total =
      track.children.length;


    function update() {

      track.style.transform =
        `translateX(-${current * 100}%)`;


      counter.textContent =
        `${String(current + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

    }


    prev.addEventListener(
      "click",
      () => {

        current =
          current <= 0
            ? total - 1
            : current - 1;


        update();

      }
    );


    next.addEventListener(
      "click",
      () => {

        current =
          current >= total - 1
            ? 0
            : current + 1;


        update();

      }
    );


    update();


    return resource;

  }


  /* ---------------------------------------------------------
     PDF
     --------------------------------------------------------- */

  function renderPdfBlock(
    block
  ) {

    const url =
      getBlockUrl(
        block
      );


    if (!url) {
      return null;
    }


    const resource =
      createResource(
        block.file ||
        "Documento",
        "Document"
      );


    const iframe =
      document.createElement(
        "iframe"
      );


    iframe.className =
      "viewer-pdf";


    iframe.src =
      url;


    iframe.title =
      block.file ||
      "Documento PDF";


    iframe.loading =
      "lazy";


    resource
      .querySelector(
        ".viewer-resource-body"
      )
      .appendChild(
        iframe
      );


    return resource;

  }


  /* ---------------------------------------------------------
     SKETCHFAB
     --------------------------------------------------------- */

  function renderSketchfabBlock(
    urls
  ) {

    if (!Array.isArray(urls)) {

      urls =
        urls
          ? [urls]
          : [];

    }


    urls =
      urls.filter(Boolean);


    if (!urls.length) {
      return null;
    }


    const resource =
      createResource(
        "Modelos 3D",
        "3D Models"
      );


    const grid =
      document.createElement(
        "div"
      );


    grid.className =
      "viewer-sketchfab-grid";


    urls.forEach(
      url => {

        const iframe =
          document.createElement(
            "iframe"
          );


        iframe.className =
          "viewer-sketchfab";


        iframe.loading =
          "lazy";


        iframe.allowFullscreen =
          true;


        iframe.src =
          convertSketchfabUrl(
            url
          );


        grid.appendChild(
          iframe
        );

      }
    );


    resource
      .querySelector(
        ".viewer-resource-body"
      )
      .appendChild(
        grid
      );


    return resource;

  }


  /* ---------------------------------------------------------
     VÍDEO
     --------------------------------------------------------- */

  function renderVideoBlock(
    value
  ) {

    if (!value) {
      return null;
    }


    const url =
      String(value);


    const embed =
      convertYoutubeUrl(
        url
      );


    if (!embed) {
      return null;
    }


    const resource =
      createResource(
        "Vídeo",
        "Video"
      );


    const iframe =
      document.createElement(
        "iframe"
      );


    iframe.className =
      "viewer-video";


    iframe.src =
      embed;


    iframe.loading =
      "lazy";


    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";


    iframe.allowFullscreen =
      true;


    resource
      .querySelector(
        ".viewer-resource-body"
      )
      .appendChild(
        iframe
      );


    return resource;

  }


  /* ---------------------------------------------------------
     ARTÍCULOS
     --------------------------------------------------------- */

  function renderArticlesBlock(
    articles
  ) {

    const resource =
      createResource(
        "Publicaciones y documentación",
        "Publications & Documentation"
      );


    const list =
      document.createElement(
        "div"
      );


    list.className =
      "viewer-articles";


    articles.forEach(
      (url, index) => {

        const link =
          document.createElement(
            "a"
          );


        link.className =
          "viewer-article-link";


        link.href =
          url;


        link.target =
          "_blank";


        link.rel =
          "noopener noreferrer";


        const label =
          document.createElement(
            "span"
          );


        label.textContent =
          `Documento ${String(index + 1).padStart(2, "0")}`;


        const arrow =
          document.createElement(
            "small"
          );


        arrow.textContent =
          "↗";


        link.appendChild(
          label
        );


        link.appendChild(
          arrow
        );


        list.appendChild(
          link
        );

      }
    );


    resource
      .querySelector(
        ".viewer-resource-body"
      )
      .appendChild(
        list
      );


    return resource;

  }


  /* ---------------------------------------------------------
     TEXTO
     --------------------------------------------------------- */

  function renderTextBlock(
    block
  ) {

    const value =
      block.text ||
      block.value ||
      "";


    if (!value) {
      return null;
    }


    const resource =
      createResource(
        "Información",
        "Information"
      );


    const text =
      document.createElement(
        "div"
      );


    text.className =
      "viewer-block-text";


    splitParagraphs(
      value
    ).forEach(
      paragraph => {

        const p =
          document.createElement(
            "p"
          );


        p.textContent =
          paragraph;


        text.appendChild(
          p
        );

      }
    );


    resource
      .querySelector(
        ".viewer-resource-body"
      )
      .appendChild(
        text
      );


    return resource;

  }


  /* ---------------------------------------------------------
     CREAR RECURSO
     --------------------------------------------------------- */

  function createResource(
    title,
    titleEn
  ) {

    const resource =
      document.createElement(
        "article"
      );


    resource.className =
      "viewer-resource";


    resource.innerHTML = `

      <div class="viewer-resource-heading">

        <h2 class="viewer-resource-title">
          ${escapeHtml(
            cleanText(title)
          )}
        </h2>

        <span class="viewer-resource-title-en">
          ${escapeHtml(
            cleanText(titleEn)
          )}
        </span>

      </div>

      <div class="viewer-resource-body"></div>

    `;


    return resource;

  }


  /* ---------------------------------------------------------
     URL DEL BLOQUE
     --------------------------------------------------------- */

  function getBlockUrl(
    block
  ) {

    if (!block) {
      return "";
    }


    return (
      extractUrl(block.url) ||

      extractUrl(block.value) ||

      extractUrl(block.fileUrl) ||

      extractUrl(block.signedUrl) ||

      extractUrl(block)
    );

  }


  function extractUrl(
    value
  ) {

    if (!value) {
      return "";
    }


    if (
      typeof value === "string"
    ) {

      if (
        value.startsWith("http://") ||
        value.startsWith("https://")
      ) {

        return value;

      }


      return "";

    }


    if (
      typeof value !== "object"
    ) {

      return "";

    }


    return (
      value.url ||
      value.signedUrl ||
      value.signed_url ||
      value.publicUrl ||
      value.public_url ||
      value.src ||
      ""
    );

  }


  /* ---------------------------------------------------------
     CONVERTIR SKETCHFAB
     --------------------------------------------------------- */

  function convertSketchfabUrl(
    url
  ) {

    if (!url) {
      return "";
    }


    const clean =
      String(url)
        .trim();


    if (
      clean.includes(
        "sketchfab.com/models/"
      )
    ) {

      const parts =
        clean.split(
          "/models/"
        );


      if (parts[1]) {

        const id =
          parts[1]
            .split(/[/?#]/)[0];


        if (id) {

          return (
            "https://sketchfab.com/models/" +
            id +
            "/embed"
          );

        }

      }

    }


    /*
       URLs abreviadas skfb.ly no siempre
       permiten construir un embed directamente.
       En ese caso abrimos la URL original.
    */

    return clean;

  }


  /* ---------------------------------------------------------
     CONVERTIR YOUTUBE
     --------------------------------------------------------- */

  function convertYoutubeUrl(
    url
  ) {

    if (!url) {
      return "";
    }


    const clean =
      String(url)
        .trim();


    let videoId =
      "";


    const watchMatch =
      clean.match(
        /[?&]v=([^&#]+)/
      );


    if (watchMatch) {

      videoId =
        watchMatch[1];

    }


    const shortMatch =
      clean.match(
        /youtu\.be\/([^?&#]+)/
      );


    if (
      !videoId &&
      shortMatch
    ) {

      videoId =
        shortMatch[1];

    }


    const embedMatch =
      clean.match(
        /youtube\.com\/embed\/([^?&#]+)/
      );


    if (
      !videoId &&
      embedMatch
    ) {

      videoId =
        embedMatch[1];

    }


    if (!videoId) {
      return "";
    }


    return (
      "https://www.youtube.com/embed/" +
      videoId
    );

  }


  /* ---------------------------------------------------------
     OBTENER PRIMER VALOR
     --------------------------------------------------------- */

  function getFirstValue(
    project,
    metadata,
    keys
  ) {

    for (
      const key
      of keys
    ) {

      if (
        metadata &&
        Object.prototype.hasOwnProperty.call(
          metadata,
          key
        )
      ) {

        const value =
          metadata[key];


        if (
          value !== null &&
          value !== undefined
        ) {

          const text =
            formatValue(
              value
            );


          if (text) {
            return text;
          }

        }

      }

    }


    for (
      const key
      of keys
    ) {

      if (
        project &&
        Object.prototype.hasOwnProperty.call(
          project,
          key
        )
      ) {

        const value =
          project[key];


        if (
          value !== null &&
          value !== undefined
        ) {

          const text =
            formatValue(
              value
            );


          if (text) {
            return text;
          }

        }

      }

    }


    return "";

  }


  /* ---------------------------------------------------------
     FORMATEAR VALOR
     --------------------------------------------------------- */

  function formatValue(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }


    if (
      Array.isArray(value)
    ) {

      return value
        .map(
          item =>
            cleanText(item)
        )
        .filter(Boolean)
        .join(", ");

    }


    return cleanText(
      value
    );

  }


  /* ---------------------------------------------------------
     PÁRRAFOS
     --------------------------------------------------------- */

  function splitParagraphs(
    value
  ) {

    if (!value) {
      return [];
    }


    return String(value)

      .split(
        /\n\s*\n/
      )

      .map(
        text =>
          text
            .replace(
              /\s+/g,
              " "
            )
            .trim()
      )

      .filter(Boolean);

  }


  /* ---------------------------------------------------------
     LIMPIAR TÍTULO
     --------------------------------------------------------- */

  function cleanTitle(
    value
  ) {

    return String(
      value || ""
    )

      .replace(
        /\s*\(\d+\)\s*$/,
        ""
      )

      .replace(
        /\s*[.!?]+\s*$/,
        ""
      )

      .trim();

  }


  /* ---------------------------------------------------------
     TEXTO
     --------------------------------------------------------- */

  function cleanText(
    value
  ) {

    return String(
      value || ""
    )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  }


  /* ---------------------------------------------------------
     ESCAPAR HTML
     --------------------------------------------------------- */

  function escapeHtml(
    value
  ) {

    return String(
      value || ""
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

    const main =
      document.getElementById(
        "project-viewer"
      );


    const error =
      document.getElementById(
        "viewer-error"
      );


    if (main) {
      main.innerHTML = "";
    }


    if (error) {

      error.hidden =
        false;


      const paragraph =
        error.querySelector(
          "p"
        );


      if (paragraph) {

        paragraph.textContent =
          message ||
          "No se ha podido cargar el proyecto.";

      }

    }

  }


  /* ---------------------------------------------------------
     PROTECCIÓN DE IMÁGENES
     --------------------------------------------------------- */

  document.addEventListener(
    "contextmenu",
    event => {

      const image =
        event.target.closest(
          ".protected-image, .protected-media"
        );


      if (image) {
        event.preventDefault();
      }

    }
  );


})();
