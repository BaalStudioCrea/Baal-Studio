(() => {

  "use strict";


  /* =========================================================
     PROTECCIÓN CONTRA DOBLE CARGA
     ========================================================= */

  if (window.__BAAL_VISOR_LOADED__) {
    return;
  }

  window.__BAAL_VISOR_LOADED__ = true;


  /* =========================================================
     SUPABASE
     ========================================================= */

  const PROJECTS_FUNCTION =
    "https://hlyzyeatnbulyfiiwvsq.supabase.co/functions/v1/get-projects";


  /* =========================================================
     INICIO
     ========================================================= */

  document.addEventListener(
    "DOMContentLoaded",
    initViewer
  );


  async function initViewer() {

    const projectName =
      getProjectParameter();


    const state =
      document.getElementById(
        "project-viewer-state"
      );


    const content =
      document.getElementById(
        "project-viewer-content"
      );


    if (!projectName) {

      showState(
        state,
        "No se ha indicado ningún proyecto."
      );

      return;

    }


    try {

      const project =
        await loadProject(
          projectName
        );


      if (!project) {

        throw new Error(
          `No se encontró el proyecto solicitado: ${projectName}`
        );

      }


      renderProject(
        project,
        content
      );


      if (state) {

        state.remove();

      }


      applyImageProtection();


    } catch (error) {

      console.error(
        "[Baal Studio] Error en visor:",
        error
      );


      showState(
        state,
        "No ha sido posible cargar este proyecto en este momento."
      );

    }

  }


  /* =========================================================
     OBTENER PARÁMETRO
     ========================================================= */

  function getProjectParameter() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    return String(

      params.get("project") ||

      params.get("proyecto") ||

      params.get("folder") ||

      ""

    ).trim();

  }


  /* =========================================================
     CARGAR PROYECTOS DESDE get-projects
     ========================================================= */

  async function loadProject(
    requestedName
  ) {

    const response =
      await fetch(
        PROJECTS_FUNCTION,
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


    const projects =
      normalizeProjectsResponse(
        data
      );


    console.log(
      "[Baal Studio] Proyectos recibidos por el visor:",
      projects
    );


    console.log(
      "[Baal Studio] Proyecto solicitado:",
      requestedName
    );


    return findRequestedProject(
      projects,
      requestedName
    );

  }


  /* =========================================================
     NORMALIZAR RESPUESTA
     ========================================================= */

  function normalizeProjectsResponse(
    data
  ) {

    if (!data) {
      return [];
    }


    if (
      Array.isArray(data)
    ) {

      return data;

    }


    if (
      Array.isArray(
        data.projects
      )
    ) {

      return data.projects;

    }


    if (
      Array.isArray(
        data.data
      )
    ) {

      return data.data;

    }


    if (
      Array.isArray(
        data.results
      )
    ) {

      return data.results;

    }


    if (
      data.project &&
      typeof data.project ===
        "object"
    ) {

      return [
        data.project
      ];

    }


    return [];

  }


  /* =========================================================
     LOCALIZAR PROYECTO
     ========================================================= */

  function findRequestedProject(
    projects,
    requestedName
  ) {

    const requested =
      decodeURIComponentSafe(
        requestedName
      );


    const requestedNormalized =
      normalizeKey(
        requested
      );


    /* Coincidencia exacta */

    let project =
      projects.find(
        item => {

          const name =
            item?.name ||
            item?.folder ||
            item?.folderName ||
            item?.projectName ||
            "";


          return (
            String(name) ===
            requested
          );

        }
      );


    if (project) {

      return project;

    }


    /* Coincidencia normalizada */

    project =
      projects.find(
        item => {

          const name =
            item?.name ||
            item?.folder ||
            item?.folderName ||
            item?.projectName ||
            "";


          return (
            normalizeKey(
              name
            ) ===
            requestedNormalized
          );

        }
      );


    if (project) {

      return project;

    }


    /* Último recurso:
       buscar por título */

    project =
      projects.find(
        item => {

          const metadata =
            item?.metadata &&
            typeof item.metadata ===
              "object"
              ? item.metadata
              : {};


          const title =
            metadata.titulo ||
            metadata.title ||
            metadata.nombre ||
            item?.titulo ||
            item?.title ||
            "";


          return (
            normalizeKey(
              title
            ) ===
            requestedNormalized
          );

        }
      );


    return project || null;

  }


  function decodeURIComponentSafe(
    value
  ) {

    try {

      return decodeURIComponent(
        value
      );

    } catch (_) {

      return value;

    }

  }


  function normalizeKey(
    value
  ) {

    return String(
      value || ""
    )

      .normalize("NFD")

      .replace(
        /[\u0300-\u036f]/g,
        ""
      )

      .replace(
        /\s*\(\d+\)\s*$/,
        ""
      )

      .replace(
        /\s+/g,
        " "
      )

      .trim()

      .toLowerCase();

  }


  /* =========================================================
     RENDERIZAR PROYECTO
     ========================================================= */

  function renderProject(
    project,
    container
  ) {

    const metadata =
      project?.metadata &&
      typeof project.metadata ===
        "object"
        ? project.metadata
        : {};


    const title =
      cleanTitle(

        metadata.titulo ||

        metadata.title ||

        metadata.nombre ||

        project.titulo ||

        project.title ||

        project.name ||

        "Proyecto"

      );


    const englishTitle =
      cleanText(

        metadata.titulo_en ||

        metadata.title_en ||

        metadata.nombre_en ||

        metadata.englishTitle ||

        metadata.english_title ||

        project.titulo_en ||

        project.title_en ||

        ""

      );


    const category =
      cleanText(
        firstValue(
          metadata,
          project,
          [
            "categoria",
            "categoría",
            "category",
            "tipo",
            "type"
          ]
        )
      );


    const techniques =
      cleanText(
        firstValue(
          metadata,
          project,
          [
            "tecnicas",
            "técnicas",
            "techniques",
            "technique"
          ]
        )
      );


    const objective =
      cleanText(
        firstValue(
          metadata,
          project,
          [
            "objetivo",
            "objective"
          ]
        )
      );


    const location =
      cleanText(
        firstValue(
          metadata,
          project,
          [
            "localizacion",
            "localización",
            "location",
            "ubicacion",
            "ubicación",
            "place"
          ]
        )
      );


    const year =
      cleanText(
        firstValue(
          metadata,
          project,
          [
            "año",
            "ano",
            "year",
            "fecha"
          ]
        )
      );


    const description =
      normalizeDescription(
        firstValue(
          metadata,
          project,
          [
            "descripcion",
            "descripción",
            "description"
          ]
        )
      );


    document.title =
      `${title} — Baal Studio`;


    /* -------------------------------------------------------
       CABECERA
       ------------------------------------------------------- */

    const header =
      document.createElement(
        "section"
      );


    header.className =
      "project-viewer-intro";


    const introInner =
      document.createElement(
        "div"
      );


    introInner.className =
      "project-viewer-intro-inner";


    const titleBlock =
      document.createElement(
        "div"
      );


    titleBlock.className =
      "project-viewer-title-block";


    const heading =
      document.createElement(
        "h1"
      );


    heading.className =
      "project-viewer-title";


    heading.textContent =
      title;


    titleBlock.appendChild(
      heading
    );


    if (
      englishTitle
    ) {

      const headingEn =
        document.createElement(
          "p"
        );


      headingEn.className =
        "project-viewer-title-en";


      headingEn.textContent =
        englishTitle;


      titleBlock.appendChild(
        headingEn
      );

    }


    introInner.appendChild(
      titleBlock
    );


    /* -------------------------------------------------------
       RESUMEN
       ------------------------------------------------------- */

    const meta =
      document.createElement(
        "div"
      );


    meta.className =
      "project-viewer-summary";


    appendSummary(
      meta,
      "Categoría",
      "Category",
      category
    );


    appendSummary(
      meta,
      "Técnicas",
      "Techniques",
      techniques
    );


    appendSummary(
      meta,
      "Objetivo",
      "Objective",
      objective
    );


    appendSummary(
      meta,
      "Ubicación",
      "Location",
      location
    );


    appendSummary(
      meta,
      "Año",
      "Year",
      year
    );


    introInner.appendChild(
      meta
    );


    header.appendChild(
      introInner
    );


    container.appendChild(
      header
    );


    /* -------------------------------------------------------
       CUERPO
       ------------------------------------------------------- */

    const body =
      document.createElement(
        "div"
      );


    body.className =
      "project-viewer-body";


    /* -------------------------------------------------------
       DESCRIPCIÓN
       ------------------------------------------------------- */

    if (
      description.length
    ) {

      const descriptionSection =
        document.createElement(
          "section"
        );


      descriptionSection.className =
        "project-viewer-description";


      descriptionSection.appendChild(
        createSectionLabel(
          "Descripción",
          "Description"
        )
      );


      for (
        const paragraph
        of description
      ) {

        const p =
          document.createElement(
            "p"
          );


        p.textContent =
          paragraph;


        descriptionSection.appendChild(
          p
        );

      }


      body.appendChild(
        descriptionSection
      );

    }


    /* -------------------------------------------------------
       BLOQUES
       ------------------------------------------------------- */

    const blocks =
      collectBlocks(
        project
      );


    const resources =
      document.createElement(
        "section"
      );


    resources.className =
      "project-viewer-resources";


    if (
      blocks.length
    ) {

      resources.appendChild(
        createSectionLabel(
          "Documentación del proyecto",
          "Project documentation"
        )
      );


      blocks.forEach(
        (
          block,
          index
        ) => {

          renderBlock(
            block,
            resources,
            index
          );

        }
      );

    }


    /* -------------------------------------------------------
       RECURSOS DIRECTOS
       ------------------------------------------------------- */

    const articles =
      extractUrls(
        project.articles ||
        metadata.articles
      );


    const sketchfab =
      extractUrls(
        project.sketchfab ||
        metadata.sketchfab
      );


    const video =
      extractFirstUrl(
        project.video ||
        metadata.video
      );


    const hasVideoBlock =
      blocks.some(
        block =>
          isBlockType(
            block,
            ["video"]
          )
      );


    const hasSketchfabBlock =
      blocks.some(
        block =>
          isBlockType(
            block,
            [
              "sketchfab",
              "3d"
            ]
          )
      );


    if (
      articles.length ||
      sketchfab.length ||
      video
    ) {

      resources.appendChild(
        createSectionLabel(
          "Recursos",
          "Resources"
        )
      );


      if (
        video &&
        !hasVideoBlock
      ) {

        resources.appendChild(
          createVideoBlock(
            video
          )
        );

      }


      if (
        sketchfab.length &&
        !hasSketchfabBlock
      ) {

        sketchfab.forEach(
          (
            url,
            index
          ) => {

            resources.appendChild(
              createExternalResource(
                "Modelo 3D",
                `3D model ${index + 1}`,
                url
              )
            );

          }
        );

      }


      if (
        articles.length
      ) {

        articles.forEach(
          (
            url,
            index
          ) => {

            resources.appendChild(
              createExternalResource(
                "Documento / artículo",
                `Paper / document ${index + 1}`,
                url
              )
            );

          }
        );

      }

    }


    /* -------------------------------------------------------
       SI REALMENTE NO HAY NADA
       ------------------------------------------------------- */

    if (
      resources.children.length >
      1
    ) {

      body.appendChild(
        resources
      );

    } else {

      const empty =
        document.createElement(
          "p"
        );


      empty.className =
        "project-viewer-no-resources";


      empty.textContent =
        "No hay recursos adicionales disponibles.";


      body.appendChild(
        empty
      );

    }


    container.appendChild(
      body
    );


    /* -------------------------------------------------------
       VOLVER
       ------------------------------------------------------- */

    const back =
      document.createElement(
        "div"
      );


    back.className =
      "project-viewer-back-wrap";


    back.innerHTML = `
      <a
        class="project-viewer-back"
        href="./proyectos.html"
      >
        <span>←</span>
        <span>Volver a proyectos</span>
        <small>Back to projects</small>
      </a>
    `;


    container.appendChild(
      back
    );

  }


  /* =========================================================
     RESUMEN
     ========================================================= */

  function appendSummary(
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
      "project-viewer-summary-item";


    const label =
      document.createElement(
        "div"
      );


    label.className =
      "project-viewer-summary-label";


    label.innerHTML =
      `${escapeHtml(spanish)}
       <span>
         ${escapeHtml(english)}
       </span>`;


    const valueElement =
      document.createElement(
        "div"
      );


    valueElement.className =
      "project-viewer-summary-value";


    valueElement.textContent =
      value;


    item.appendChild(
      label
    );


    item.appendChild(
      valueElement
    );


    container.appendChild(
      item
    );

  }


  /* =========================================================
     ETIQUETAS
     ========================================================= */

  function createSectionLabel(
    spanish,
    english
  ) {

    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      "project-viewer-section-label";


    wrapper.innerHTML =
      `
        <span>
          ${escapeHtml(spanish)}
        </span>

        <small>
          ${escapeHtml(english)}
        </small>
      `;


    return wrapper;

  }


  /* =========================================================
     BLOQUES
     ========================================================= */

  function collectBlocks(
    project
  ) {

    const result =
      [];


    if (
      Array.isArray(
        project?.blocks
      )
    ) {

      result.push(
        ...project.blocks
      );

    }


    if (
      Array.isArray(
        project?.contentBlocks
      )
    ) {

      result.push(
        ...project.contentBlocks
      );

    }


    if (
      Array.isArray(
        project?.resources
      )
    ) {

      result.push(
        ...project.resources
      );

    }


    if (
      !result.length &&
      Array.isArray(
        project?.images
      )
    ) {

      result.push(
        {
          type:
            "gallery",

          images:
            project.images
        }
      );

    }


    return result.filter(
      Boolean
    );

  }


  function isBlockType(
    block,
    types
  ) {

    if (
      !block ||
      typeof block !==
        "object"
    ) {

      return false;

    }


    const type =
      String(
        block.type ||
        block.kind ||
        ""
      ).toLowerCase();


    return types.includes(
      type
    );

  }


  function renderBlock(
    block,
    container,
    index
  ) {

    if (
      !block ||
      typeof block !==
        "object"
    ) {

      return;

    }


    const type =
      String(
        block.type ||
        block.kind ||
        ""
      ).toLowerCase();


    /* IMAGEN */

    if (
      type === "image" ||
      type === "photo" ||
      type === "fotografia"
    ) {

      const url =
        extractFirstUrl(
          block.url ||
          block.signedUrl ||
          block.src ||
          block.image
        );


      if (url) {

        container.appendChild(
          createImageBlock(
            url,
            block.file ||
            block.caption ||
            "",
            index
          )
        );

      }


      return;

    }


    /* GALERÍA */

    if (
      type === "images" ||
      type === "gallery" ||
      type === "galeria"
    ) {

      const images =
        Array.isArray(
          block.images
        )
          ? block.images
          : [];


      const urls =
        images
          .map(
            extractFirstUrl
          )
          .filter(Boolean);


      if (
        urls.length
      ) {

        container.appendChild(
          createGalleryBlock(
            urls,
            images
          )
        );

      }


      return;

    }


    /* PDF */

    if (
      type === "pdf" ||
      type === "document" ||
      type === "documento"
    ) {

      const url =
        extractFirstUrl(
          block.url ||
          block.signedUrl ||
          block.href
        );


      if (url) {

        container.appendChild(
          createPdfBlock(
            url,
            block.file ||
            block.title ||
            "Documento"
          )
        );

      }


      return;

    }


    /* VÍDEO */

    if (
      type === "video"
    ) {

      const url =
        extractFirstUrl(
          block.value ||
          block.url ||
          block.src
        );


      if (url) {

        container.appendChild(
          createVideoBlock(
            url
          )
        );

      }


      return;

    }


    /* SKETCHFAB */

    if (
      type === "sketchfab" ||
      type === "3d"
    ) {

      const urls =
        extractUrls(
          block.urls ||
          block.url ||
          block.value
        );


      urls.forEach(
        (
          url,
          i
        ) => {

          container.appendChild(
            createExternalResource(
              "Modelo 3D",
              `3D model ${i + 1}`,
              url
            )
          );

        }
      );


      return;

    }


    /* TEXTO */

    if (
      type === "text" ||
      type === "texto" ||
      type === "paragraph" ||
      type === "article"
    ) {

      const text =
        normalizeDescription(
          block.text ||
          block.content ||
          block.value ||
          block.description
        );


      if (
        text.length
      ) {

        const section =
          document.createElement(
            "div"
          );


        section.className =
          "project-viewer-text-block";


        text.forEach(
          paragraph => {

            const p =
              document.createElement(
                "p"
              );


            p.textContent =
              paragraph;


            section.appendChild(
              p
            );

          }
        );


        container.appendChild(
          section
        );

      }

    }

  }


  /* =========================================================
     IMAGEN
     ========================================================= */

  function createImageBlock(
    url,
    caption,
    index
  ) {

    const figure =
      document.createElement(
        "figure"
      );


    figure.className =
      "project-viewer-image-block";


    const img =
      document.createElement(
        "img"
      );


    img.className =
      "protected-image";


    img.src =
      url;


    img.alt =
      caption ||
      `Documentación del proyecto ${index + 1}`;


    img.loading =
      index < 2
        ? "eager"
        : "lazy";


    img.draggable =
      false;


    figure.appendChild(
      img
    );


    if (caption) {

      const figcaption =
        document.createElement(
          "figcaption"
        );


      figcaption.textContent =
        caption;


      figure.appendChild(
        figcaption
      );

    }


    img.addEventListener(
      "click",
      () =>
        openLightbox(
          url,
          caption
        )
    );


    return figure;

  }


  /* =========================================================
     GALERÍA
     ========================================================= */

  function createGalleryBlock(
    urls,
    sourceItems
  ) {

    const gallery =
      document.createElement(
        "div"
      );


    gallery.className =
      "project-viewer-gallery";


    urls.forEach(
      (
        url,
        index
      ) => {

        const source =
          sourceItems?.[index];


        const caption =
          typeof source ===
            "object"

            ? source.reference ||
              source.file ||
              source.caption ||
              ""

            : "";


        gallery.appendChild(
          createImageBlock(
            url,
            caption,
            index
          )
        );

      }
    );


    return gallery;

  }


  /* =========================================================
     PDF
     ========================================================= */

  function createPdfBlock(
    url,
    title
  ) {

    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      "project-viewer-pdf-block";


    const heading =
      document.createElement(
        "div"
      );


    heading.className =
      "project-viewer-resource-heading";


    heading.textContent =
      title;


    wrapper.appendChild(
      heading
    );


    const frame =
      document.createElement(
        "iframe"
      );


    frame.src =
      url;


    frame.title =
      title;


    frame.loading =
      "lazy";


    frame.setAttribute(
      "allow",
      "fullscreen"
    );


    wrapper.appendChild(
      frame
    );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;


    link.target =
      "_blank";


    link.rel =
      "noopener noreferrer";


    link.textContent =
      "Abrir documento / Open document";


    wrapper.appendChild(
      link
    );


    return wrapper;

  }


  /* =========================================================
     VÍDEO
     ========================================================= */

  function createVideoBlock(
    url
  ) {

    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      "project-viewer-video-block";


    const embed =
      getYoutubeEmbedUrl(
        url
      );


    if (embed) {

      const frame =
        document.createElement(
          "iframe"
        );


      frame.src =
        embed;


      frame.title =
        "Vídeo del proyecto";


      frame.loading =
        "lazy";


      frame.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";


      frame.allowFullscreen =
        true;


      wrapper.appendChild(
        frame
      );

    } else {

      wrapper.appendChild(
        createExternalResource(
          "Vídeo",
          "Video",
          url
        )
      );

    }


    return wrapper;

  }


  /* =========================================================
     RECURSO EXTERNO
     ========================================================= */

  function createExternalResource(
    label,
    english,
    url
  ) {

    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      "project-viewer-external-resource";


    const text =
      document.createElement(
        "div"
      );


    text.innerHTML =
      `
        <strong>
          ${escapeHtml(label)}
        </strong>

        <small>
          ${escapeHtml(english)}
        </small>
      `;


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;


    link.target =
      "_blank";


    link.rel =
      "noopener noreferrer";


    link.textContent =
      "Abrir recurso →";


    wrapper.appendChild(
      text
    );


    wrapper.appendChild(
      link
    );


    return wrapper;

  }


  /* =========================================================
     YOUTUBE
     ========================================================= */

  function getYoutubeEmbedUrl(
    url
  ) {

    try {

      const parsed =
        new URL(
          url
        );


      if (
        parsed.hostname.includes(
          "youtu.be"
        )
      ) {

        const id =
          parsed.pathname.replace(
            /^\//,
            ""
          );


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

    } catch (_) {}


    return "";

  }


  /* =========================================================
     CAMPOS
     ========================================================= */

  function firstValue(
    metadata,
    project,
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
        ) &&
        hasValue(
          metadata[key]
        )
      ) {

        return metadata[key];

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
        ) &&
        hasValue(
          project[key]
        )
      ) {

        return project[key];

      }

    }


    return "";

  }


  function hasValue(
    value
  ) {

    if (
      Array.isArray(value)
    ) {

      return value.some(
        hasValue
      );

    }


    return (

      value !== null &&

      value !== undefined &&

      String(value).trim() !== ""

    );

  }


  /* =========================================================
     DESCRIPCIÓN
     ========================================================= */

  function normalizeDescription(
    value
  ) {

    if (
      Array.isArray(value)
    ) {

      return value
        .flatMap(
          item =>
            normalizeDescription(
              item
            )
        )
        .filter(Boolean);

    }


    if (
      value === null ||
      value === undefined
    ) {

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


  function cleanText(
    value
  ) {

    if (
      Array.isArray(value)
    ) {

      return value
        .map(cleanText)
        .filter(Boolean)
        .join(" ");

    }


    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }


    return String(value)
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  }


  function cleanTitle(
    value
  ) {

    return cleanText(
      value
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


  /* =========================================================
     URLS
     ========================================================= */

  function extractFirstUrl(
    value
  ) {

    if (
      Array.isArray(value)
    ) {

      return extractFirstUrl(
        value[0]
      );

    }


    if (
      typeof value ===
      "string"
    ) {

      return value.trim();

    }


    if (
      !value ||
      typeof value !==
        "object"
    ) {

      return "";

    }


    const keys = [

      "url",

      "signedUrl",

      "signed_url",

      "publicUrl",

      "public_url",

      "href",

      "src",

      "value"

    ];


    for (
      const key
      of keys
    ) {

      if (
        typeof value[key] ===
          "string" &&
        value[key].trim()
      ) {

        return value[key].trim();

      }

    }


    return "";

  }


  function extractUrls(
    value
  ) {

    if (!value) {

      return [];

    }


    if (
      Array.isArray(value)
    ) {

      return value
        .flatMap(
          extractUrls
        )
        .filter(Boolean);

    }


    if (
      typeof value ===
      "string"
    ) {

      return value.trim()
        ? [value.trim()]
        : [];

    }


    const url =
      extractFirstUrl(
        value
      );


    return url
      ? [url]
      : [];

  }


  /* =========================================================
     ESTADO
     ========================================================= */

  function showState(
    element,
    message
  ) {

    if (!element) {
      return;
    }


    const strong =
      element.querySelector(
        "strong"
      );


    if (strong) {

      strong.textContent =
        message;

    }

  }


  /* =========================================================
     LIGHTBOX
     ========================================================= */

  function openLightbox(
    url,
    caption
  ) {

    let modal =
      document.getElementById(
        "project-lightbox"
      );


    if (!modal) {

      modal =
        document.createElement(
          "div"
        );


      modal.id =
        "project-lightbox";


      modal.className =
        "project-lightbox";


      modal.innerHTML = `

        <button
          type="button"
          class="project-lightbox-close"
          aria-label="Cerrar"
        >
          ×
        </button>

        <div
          class="project-lightbox-inner"
        >

          <img
            class="protected-image"
            src=""
            alt=""
          >

          <p></p>

        </div>

      `;


      document.body.appendChild(
        modal
      );


      modal.addEventListener(
        "click",
        event => {

          if (
            event.target ===
              modal ||
            event.target.classList.contains(
              "project-lightbox-inner"
            )
          ) {

            closeLightbox();

          }

        }
      );


      modal
        .querySelector(
          ".project-lightbox-close"
        )
        .addEventListener(
          "click",
          closeLightbox
        );

    }


    modal
      .querySelector(
        "img"
      )
      .src =
      url;


    modal
      .querySelector(
        "img"
      )
      .alt =
      caption || "";


    modal
      .querySelector(
        "p"
      )
      .textContent =
      caption || "";


    modal.classList.add(
      "is-open"
    );


    document.body.classList.add(
      "lightbox-open"
    );

  }


  function closeLightbox() {

    const modal =
      document.getElementById(
        "project-lightbox"
      );


    if (!modal) {
      return;
    }


    modal.classList.remove(
      "is-open"
    );


    document.body.classList.remove(
      "lightbox-open"
    );

  }


  /* =========================================================
     PROTECCIÓN
     ========================================================= */

  function applyImageProtection() {

    document
      .querySelectorAll(
        ".protected-image"
      )
      .forEach(
        image => {

          image.draggable =
            false;


          image.addEventListener(
            "dragstart",
            event =>
              event.preventDefault()
          );


          image.addEventListener(
            "contextmenu",
            event =>
              event.preventDefault()
          );

        }
      );

  }


})();
