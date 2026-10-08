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

    const requestedProject =
      getProjectParameter();


    const state =
      document.getElementById(
        "project-viewer-state"
      );


    const content =
      document.getElementById(
        "project-viewer-content"
      );


    console.log(
      "[Baal Studio] Parámetro recibido:",
      requestedProject
    );


    if (!content) {

      console.error(
        "[Baal Studio] No existe #project-viewer-content en visor.html"
      );

      showState(
        state,
        "No se ha encontrado el contenedor del proyecto."
      );

      return;

    }


    if (!requestedProject) {

      showState(
        state,
        "No se ha indicado ningún proyecto."
      );

      return;

    }


    try {

      const project =
        await loadProject(
          requestedProject
        );


      if (!project) {

        throw new Error(
          `No se encontró el proyecto solicitado: ${requestedProject}`
        );

      }


      console.log(
        "[Baal Studio] Proyecto seleccionado:",
        project
      );


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


    const value =
      params.get("project") ||
      params.get("proyecto") ||
      params.get("folder") ||
      "";


    try {

      return decodeURIComponent(
        value
      ).trim();

    } catch (_) {

      return String(
        value
      ).trim();

    }

  }


  /* =========================================================
     CARGAR PROYECTOS
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
            "Accept": "application/json"
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
      "[Baal Studio] Respuesta completa de get-projects:",
      data
    );


    const projects =
      normalizeProjectsResponse(
        data
      );


    console.log(
      "[Baal Studio] Proyectos normalizados:",
      projects
    );


    console.log(
      "[Baal Studio] Proyecto solicitado:",
      requestedName
    );


    if (!projects.length) {

      throw new Error(
        "get-projects no devolvió ningún proyecto reconocible."
      );

    }


    const project =
      findRequestedProject(
        projects,
        requestedName
      );


    if (project) {

      return project;

    }


    /*
       Si no encontramos coincidencia exacta,
       mostramos información útil en consola.
    */

    console.error(
      "[Baal Studio] No se encontró coincidencia.",
      {
        solicitado: requestedName,
        disponibles: projects.map(
          item =>
            getRawProjectName(item)
        )
      }
    );


    return null;

  }


  /* =========================================================
     NORMALIZAR RESPUESTA DE SUPABASE
     ========================================================= */

  function normalizeProjectsResponse(
    data
  ) {

    if (!data) {
      return [];
    }


    /*
       Caso habitual:

       {
         success: true,
         projects: [...]
       }
    */

    if (
      Array.isArray(
        data.projects
      )
    ) {

      return data.projects
        .filter(isObject);

    }


    /*
       Respuesta directamente como array.
    */

    if (
      Array.isArray(data)
    ) {

      return data
        .filter(isObject);

    }


    /*
       Algunas funciones pueden devolver:

       {
         data: {
           projects: [...]
         }
       }
    */

    if (
      data.data &&
      typeof data.data === "object"
    ) {

      if (
        Array.isArray(
          data.data.projects
        )
      ) {

        return data.data.projects
          .filter(isObject);

      }


      if (
        Array.isArray(
          data.data
        )
      ) {

        return data.data
          .filter(isObject);

      }

    }


    /*
       Respuesta:

       {
         results: [...]
       }
    */

    if (
      Array.isArray(
        data.results
      )
    ) {

      return data.results
        .filter(isObject);

    }


    /*
       Respuesta de un solo proyecto.
    */

    if (
      data.project &&
      isObject(data.project)
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
      String(
        requestedName || ""
      ).trim();


    const requestedKey =
      normalizeKey(
        requested
      );


    /*
       1. COINCIDENCIA EXACTA CON NOMBRE DE CARPETA
    */

    let project =
      projects.find(
        item => {

          const rawName =
            getRawProjectName(
              item
            );


          return (
            rawName ===
            requested
          );

        }
      );


    if (project) {

      return project;

    }


    /*
       2. COINCIDENCIA NORMALIZADA CON NOMBRE DE CARPETA
    */

    project =
      projects.find(
        item => {

          const rawName =
            getRawProjectName(
              item
            );


          return (
            normalizeKey(
              rawName
            ) ===
            requestedKey
          );

        }
      );


    if (project) {

      return project;

    }


    /*
       3. COINCIDENCIA POR TÍTULO

       Esto es solo un respaldo.
       El título NO se utilizará como identificador
       principal del proyecto.
    */

    project =
      projects.find(
        item => {

          const metadata =
            getMetadata(
              item
            );


          const title =
            getFirstValue(
              metadata,
              [
                "title",
                "titulo",
                "nombre"
              ]
            );


          return (
            normalizeKey(
              title
            ) ===
            requestedKey
          );

        }
      );


    if (project) {

      return project;

    }


    return null;

  }


  /* =========================================================
     NOMBRE REAL DE CARPETA
     ========================================================= */

  function getRawProjectName(
    project
  ) {

    if (
      !project ||
      typeof project !== "object"
    ) {

      return "";

    }


    return String(

      project.name ||

      project.folder ||

      project.folderName ||

      project.projectName ||

      project.project ||

      ""

    ).trim();

  }


  /* =========================================================
     METADATA
     ========================================================= */

  function getMetadata(
    project
  ) {

    if (
      !project ||
      typeof project !== "object"
    ) {

      return {};

    }


    let metadata =
      project.metadata;


    /*
       Si por alguna razón metadata llega
       serializada como JSON.
    */

    if (
      typeof metadata === "string"
    ) {

      try {

        metadata =
          JSON.parse(
            metadata
          );

      } catch (_) {

        metadata = {};

      }

    }


    if (
      metadata &&
      typeof metadata === "object" &&
      !Array.isArray(metadata)
    ) {

      return metadata;

    }


    return {};

  }


  /* =========================================================
     RENDERIZAR PROYECTO
     ========================================================= */

  function renderProject(
    project,
    container
  ) {

    /*
       Limpiamos cualquier contenido previo.
       Esto evita que el nombre de la carpeta
       procedente del HTML quede duplicado.
    */

    container.innerHTML = "";


    const metadata =
      getMetadata(
        project
      );


    /*
       IMPORTANTE:

       El nombre de la carpeta NO es el título.

       El título visible procede de metadata.
    */

    const title =
      cleanTitle(
        getFirstValue(
          metadata,
          [
            "title",
            "titulo",
            "nombre"
          ]
        )
      );


    const finalTitle =
      title ||
      "Proyecto";


    const englishTitle =
      cleanText(
        getFirstValue(
          metadata,
          [
            "title_en",
            "titulo_en",
            "nombre_en",
            "englishTitle",
            "english_title"
          ]
        )
      );


    const category =
      cleanText(
        getFirstValue(
          metadata,
          [
            "category",
            "categoria",
            "categoría",
            "tipo",
            "type"
          ]
        )
      );


    const techniques =
      cleanText(
        getFirstValue(
          metadata,
          [
            "techniques",
            "tecnicas",
            "técnicas",
            "technique"
          ]
        )
      );


    const objective =
      cleanText(
        getFirstValue(
          metadata,
          [
            "objective",
            "objetivo"
          ]
        )
      );


    const location =
      cleanText(
        getFirstValue(
          metadata,
          [
            "location",
            "localizacion",
            "localización",
            "ubicacion",
            "ubicación",
            "place"
          ]
        )
      );


    const year =
      cleanText(
        getFirstValue(
          metadata,
          [
            "year",
            "año",
            "ano",
            "fecha"
          ]
        )
      );


    const description =
      normalizeDescription(
        getFirstValue(
          metadata,
          [
            "description",
            "descripcion",
            "descripción"
          ]
        )
      );


    document.title =
      `${finalTitle} — Baal Studio`;


    console.log(
      "[Baal Studio] Título visible:",
      finalTitle
    );


    console.log(
      "[Baal Studio] Metadata:",
      metadata
    );


    /*
       ========================================================
       CABECERA DEL PROYECTO
       ========================================================
    */

    const intro =
      document.createElement(
        "section"
      );


    intro.className =
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
      finalTitle;


    titleBlock.appendChild(
      heading
    );


    if (englishTitle) {

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


    /*
       ========================================================
       RESUMEN
       ========================================================
    */

    const summary =
      document.createElement(
        "div"
      );


    summary.className =
      "project-viewer-summary";


    appendSummary(
      summary,
      "Categoría",
      "Category",
      category
    );


    appendSummary(
      summary,
      "Técnicas",
      "Techniques",
      techniques
    );


    appendSummary(
      summary,
      "Objetivo",
      "Objective",
      objective
    );


    appendSummary(
      summary,
      "Ubicación",
      "Location",
      location
    );


    appendSummary(
      summary,
      "Año",
      "Year",
      year
    );


    introInner.appendChild(
      summary
    );


    intro.appendChild(
      introInner
    );


    container.appendChild(
      intro
    );


    /*
       ========================================================
       CUERPO
       ========================================================
    */

    const body =
      document.createElement(
        "div"
      );


    body.className =
      "project-viewer-body";


    /*
       ========================================================
       DESCRIPCIÓN
       ========================================================
    */

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


      description.forEach(
        paragraph => {

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
      );


      body.appendChild(
        descriptionSection
      );

    }


    /*
       ========================================================
       BLOQUES DEL PROYECTO
       ========================================================
    */

    const blocks =
      collectBlocks(
        project
      );


    console.log(
      "[Baal Studio] Bloques encontrados:",
      blocks.length,
      blocks
    );


    const resources =
      document.createElement(
        "section"
      );


    resources.className =
      "project-viewer-resources";


    let renderedResources =
      0;


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

          const before =
            resources.children.length;


          renderBlock(
            block,
            resources,
            index
          );


          if (
            resources.children.length >
            before
          ) {

            renderedResources++;

          }

        }
      );

    }


    /*
       ========================================================
       RECURSOS DIRECTOS
       ========================================================
    */

    const articles =
      extractUrls(
        project.articles
      );


    const sketchfab =
      extractUrls(
        project.sketchfab
      );


    const video =
      extractFirstUrl(
        project.video
      );


    console.log(
      "[Baal Studio] Recursos directos:",
      {
        articles,
        sketchfab,
        video
      }
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
            ["sketchfab", "3d"]
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

        renderedResources++;

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

            renderedResources++;

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

            renderedResources++;

          }
        );

      }

    }


    /*
       ========================================================
       AÑADIR RECURSOS AL CUERPO
       ========================================================
    */

    if (
      renderedResources > 0
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


    /*
       ========================================================
       VOLVER
       ========================================================
    */

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
     OBTENER BLOQUES
     ========================================================= */

  function collectBlocks(
    project
  ) {

    const result =
      [];


    /*
       Estructura conocida de get-projects:

       project.blocks
    */

    if (
      Array.isArray(
        project?.blocks
      )
    ) {

      result.push(
        ...project.blocks
      );

    }


    /*
       Estructuras alternativas
    */

    if (
      !result.length &&
      Array.isArray(
        project?.contentBlocks
      )
    ) {

      result.push(
        ...project.contentBlocks
      );

    }


    if (
      !result.length &&
      Array.isArray(
        project?.resources
      )
    ) {

      result.push(
        ...project.resources
      );

    }


    /*
       Si existe una propiedad content
       con bloques.
    */

    if (
      !result.length &&
      Array.isArray(
        project?.content
      )
    ) {

      result.push(
        ...project.content
      );

    }


    /*
       Si content es un objeto con blocks.
    */

    if (
      !result.length &&
      project?.content &&
      typeof project.content === "object"
    ) {

      if (
        Array.isArray(
          project.content.blocks
        )
      ) {

        result.push(
          ...project.content.blocks
        );

      }

    }


    /*
       Si no existen bloques pero hay imágenes
       directamente en el proyecto.
    */

    if (
      !result.length &&
      Array.isArray(
        project?.images
      )
    ) {

      result.push(
        {
          type: "gallery",
          images: project.images
        }
      );

    }


    return result.filter(
      Boolean
    );

  }


  /* =========================================================
     RENDERIZAR BLOQUE
     ========================================================= */

  function renderBlock(
    block,
    container,
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
        block.kind ||
        block.blockType ||
        ""
      )
        .trim()
        .toLowerCase();


    console.log(
      `[Baal Studio] Renderizando bloque ${index + 1}:`,
      type,
      block
    );


    /*
       ========================================================
       IMAGEN
       ========================================================
    */

    if (
      [
        "image",
        "photo",
        "fotografia",
        "fotografía"
      ].includes(type)
    ) {

      const url =
        extractFirstUrl(
          block.url ||
          block.signedUrl ||
          block.signed_url ||
          block.src ||
          block.image ||
          block.value
        );


      if (url) {

        container.appendChild(
          createImageBlock(
            url,
            block.file ||
            block.caption ||
            block.title ||
            "",
            index
          )
        );

      }


      return;

    }


    /*
       ========================================================
       GALERÍA
       ========================================================
    */

    if (
      [
        "images",
        "gallery",
        "galeria",
        "galería"
      ].includes(type)
    ) {

      const images =
        Array.isArray(
          block.images
        )
          ? block.images
          : Array.isArray(block.items)
            ? block.items
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


    /*
       ========================================================
       PDF
       ========================================================
    */

    if (
      [
        "pdf",
        "document",
        "documento"
      ].includes(type)
    ) {

      const url =
        extractFirstUrl(
          block.url ||
          block.signedUrl ||
          block.signed_url ||
          block.href ||
          block.src
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


    /*
       ========================================================
       VÍDEO
       ========================================================
    */

    if (
      type === "video"
    ) {

      const url =
        extractFirstUrl(
          block.value ||
          block.url ||
          block.src ||
          block.href
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


    /*
       ========================================================
       SKETCHFAB / 3D
       ========================================================
    */

    if (
      [
        "sketchfab",
        "3d",
        "modelo3d",
        "modelo_3d"
      ].includes(type)
    ) {

      const urls =
        extractUrls(
          block.urls ||
          block.url ||
          block.value ||
          block.models
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


    /*
       ========================================================
       TEXTO
       ========================================================
    */

    if (
      [
        "text",
        "texto",
        "paragraph",
        "article"
      ].includes(type)
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
      `
        ${escapeHtml(spanish)}
        <span>
          ${escapeHtml(english)}
        </span>
      `;


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
     ETIQUETA DE SECCIÓN
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


        let caption =
          "";


        if (
          source &&
          typeof source === "object"
        ) {

          caption =
            source.reference ||
            source.file ||
            source.caption ||
            source.title ||
            "";

        }


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
     OBTENER PRIMER VALOR
     ========================================================= */

  function getFirstValue(
    object,
    keys
  ) {

    if (
      !object ||
      typeof object !== "object"
    ) {

      return "";

    }


    for (
      const key
      of keys
    ) {

      if (
        Object.prototype.hasOwnProperty.call(
          object,
          key
        )
      ) {

        const value =
          object[key];


        if (
          hasValue(
            value
          )
        ) {

          return value;

        }

      }

    }


    return "";

  }


  /* =========================================================
     VALOR EXISTENTE
     ========================================================= */

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


  /* =========================================================
     LIMPIAR TEXTO
     ========================================================= */

  function cleanText(
    value
  ) {

    if (
      Array.isArray(value)
    ) {

      return value
        .map(
          cleanText
        )
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


  /* =========================================================
     LIMPIAR TÍTULO
     ========================================================= */

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
     NORMALIZAR CLAVE
     ========================================================= */

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
     URLS
     ========================================================= */

  function extractFirstUrl(
    value
  ) {

    if (
      Array.isArray(value)
    ) {

      for (
        const item
        of value
      ) {

        const url =
          extractFirstUrl(
            item
          );


        if (url) {
          return url;
        }

      }


      return "";

    }


    if (
      typeof value === "string"
    ) {

      return value.trim();

    }


    if (
      !value ||
      typeof value !== "object"
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
        typeof value[key] === "string" &&
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
          item =>
            extractUrls(
              item
            )
        )
        .filter(Boolean);

    }


    if (
      typeof value === "string"
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
     TIPO DE BLOQUE
     ========================================================= */

  function isBlockType(
    block,
    types
  ) {

    if (
      !block ||
      typeof block !== "object"
    ) {

      return false;

    }


    const type =
      String(
        block.type ||
        block.kind ||
        block.blockType ||
        ""
      )
        .trim()
        .toLowerCase();


    return types.includes(
      type
    );

  }


  /* =========================================================
     OBJETO
     ========================================================= */

  function isObject(
    value
  ) {

    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );

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

    } else {

      element.textContent =
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
            event.target === modal ||
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


    const image =
      modal.querySelector(
        "img"
      );


    image.src =
      url;


    image.alt =
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


    applyImageProtection();

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
     PROTECCIÓN DE IMÁGENES
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


          if (
            image.dataset.protected ===
            "true"
          ) {

            return;

          }


          image.dataset.protected =
            "true";


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


  /* =========================================================
     ESCAPE HTML
     ========================================================= */

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


})();
