(() => {

  "use strict";


  /* =========================================================
     PROTECCIÓN CONTRA DOBLE CARGA
     ========================================================= */

  if (window.__BAAL_PROYECTOS_LOADED__) {
    return;
  }

  window.__BAAL_PROYECTOS_LOADED__ = true;


  /* =========================================================
     SUPABASE
     ========================================================= */

  const PROJECTS_FUNCTION =
    "https://hlyzyeatnbulyfiiwvsq.supabase.co/functions/v1/list-projects";


  /* =========================================================
     INICIO
     ========================================================= */

  document.addEventListener(
    "DOMContentLoaded",
    loadProjectsPage
  );


  /* =========================================================
     CARGAR PROYECTOS
     ========================================================= */

  async function loadProjectsPage() {

    const grid =
      document.getElementById(
        "projects-grid"
      );

    const loading =
      document.getElementById(
        "projects-loading"
      );

    const emptyState =
      document.getElementById(
        "projects-empty-state"
      );


    if (!grid) {
      return;
    }


    try {

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
          `list-projects respondió con HTTP ${response.status}`
        );

      }


      const data =
        await response.json();


      const projects =
        normalizeProjectsResponse(
          data
        );


      const orderedProjects =
        sortProjects(
          projects
        );


      grid.innerHTML = "";


      if (loading) {

        loading.style.display =
          "none";

      }


      if (
        !orderedProjects.length
      ) {

        if (emptyState) {

          emptyState.classList.add(
            "visible"
          );

        }

        return;

      }


      if (emptyState) {

        emptyState.classList.remove(
          "visible"
        );

      }


      orderedProjects.forEach(
        (
          project,
          index
        ) => {

          grid.appendChild(
            createProjectCard(
              project,
              index
            )
          );

        }
      );


      applyImageProtection();


    } catch (error) {

      console.error(
        "[Baal Studio] Error cargando proyectos:",
        error
      );


      if (loading) {

        loading.style.display =
          "none";

      }


      if (emptyState) {

        emptyState.classList.add(
          "visible"
        );


        const message =
          emptyState.querySelector(
            ".projects-empty-message"
          );


        if (message) {

          message.textContent =
            "No ha sido posible cargar los proyectos en este momento.";

        }

      }

    }

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

      return data
        .map(normalizeProject)
        .filter(Boolean);

    }


    if (
      Array.isArray(
        data.projects
      )
    ) {

      return data.projects
        .map(normalizeProject)
        .filter(Boolean);

    }


    if (
      Array.isArray(
        data.data
      )
    ) {

      return data.data
        .map(normalizeProject)
        .filter(Boolean);

    }


    if (
      Array.isArray(
        data.results
      )
    ) {

      return data.results
        .map(normalizeProject)
        .filter(Boolean);

    }


    if (data.project) {

      const project =
        normalizeProject(
          data.project
        );


      return project
        ? [project]
        : [];

    }


    return [];

  }


  /* =========================================================
     NORMALIZAR PROYECTO
     ========================================================= */

  function normalizeProject(
    project
  ) {

    if (
      !project ||
      typeof project !== "object"
    ) {

      return null;

    }


    const rawName =
      String(
        project.name ||
        project.folder ||
        project.folderName ||
        project.projectName ||
        project.nombre ||
        ""
      ).trim();


    if (!rawName) {

      return null;

    }


    const metadata =
      project.metadata &&
      typeof project.metadata === "object"
        ? project.metadata
        : {};


    return {

      ...project,

      rawName,

      name:
        rawName,

      displayName:
        extractProjectTitle(
          project,
          metadata,
          rawName
        ),

      englishTitle:
        cleanText(
          firstValue(
            project,
            metadata,
            [
              "titulo_en",
              "title_en",
              "nombre_en",
              "englishTitle",
              "english_title"
            ]
          )
        ),

      order:
        extractProjectOrder(
          project,
          rawName
        ),

      cover:
        extractCover(
          project
        ),

      category:
        cleanText(
          firstValue(
            project,
            metadata,
            [
              "categoria",
              "categoría",
              "category",
              "tipo",
              "type"
            ]
          )
        ),

      techniques:
        cleanText(
          firstValue(
            project,
            metadata,
            [
              "tecnicas",
              "técnicas",
              "techniques",
              "technique"
            ]
          )
        ),

      objective:
        cleanText(
          firstValue(
            project,
            metadata,
            [
              "objetivo",
              "objective"
            ]
          )
        ),

      metadata

    };

  }


  /* =========================================================
     TÍTULO
     ========================================================= */

  function extractProjectTitle(
    project,
    metadata,
    rawName
  ) {

    const candidates = [

      metadata.titulo,

      metadata.title,

      metadata.nombre,

      metadata.name,

      project.titulo,

      project.title,

      project.nombre,

      project.title_es,

      project.name_es

    ];


    for (
      const candidate
      of candidates
    ) {

      if (
        typeof candidate ===
          "string" &&
        candidate.trim()
      ) {

        return cleanProjectTitle(
          candidate
        );

      }

    }


    return cleanProjectTitle(
      rawName
    );

  }


  function cleanProjectTitle(
    value
  ) {

    return String(value)

      .replace(
        /\s*\(\d+\)\s*$/,
        ""
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


  /* =========================================================
     ORDEN
     ========================================================= */

  function extractProjectOrder(
    project,
    rawName
  ) {

    const candidates = [

      project.order,

      project.orden,

      project.position,

      project.priority

    ];


    for (
      const value
      of candidates
    ) {

      const number =
        Number(value);


      if (
        Number.isFinite(
          number
        )
      ) {

        return number;

      }

    }


    const match =
      rawName.match(
        /\((\d+)\)\s*$/
      );


    if (match) {

      return Number(
        match[1]
      );

    }


    return 999999;

  }


  /* =========================================================
     COVER
     ========================================================= */

  function extractCover(
    project
  ) {

    const direct = [

      project.cover,

      project.coverUrl,

      project.cover_url,

      project.imageUrl,

      project.image_url,

      project.thumbnail,

      project.thumbnailUrl,

      project.thumbnail_url,

      project.preview,

      project.previewUrl,

      project.preview_url

    ];


    for (
      const candidate
      of direct
    ) {

      const url =
        extractUrl(
          candidate
        );


      if (
        url &&
        isImageUrl(url)
      ) {

        return url;

      }

    }


    return findImageUrl(
      project,
      new Set()
    );

  }


  function extractUrl(
    value
  ) {

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

      "src"

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


  function findImageUrl(
    value,
    visited
  ) {

    if (!value) {
      return "";
    }


    if (
      typeof value ===
      "string"
    ) {

      return isImageUrl(
        value
      )
        ? value
        : "";

    }


    if (
      typeof value !==
        "object" ||
      visited.has(value)
    ) {

      return "";

    }


    visited.add(
      value
    );


    if (
      Array.isArray(value)
    ) {

      for (
        const item
        of value
      ) {

        const found =
          findImageUrl(
            item,
            visited
          );


        if (found) {

          return found;

        }

      }


      return "";

    }


    const preferredKeys = [

      "cover",

      "coverUrl",

      "cover_url",

      "image",

      "imageUrl",

      "image_url",

      "thumbnail",

      "thumbnailUrl",

      "thumbnail_url",

      "preview",

      "previewUrl",

      "preview_url",

      "url",

      "signedUrl",

      "signed_url",

      "src"

    ];


    for (
      const key
      of preferredKeys
    ) {

      if (
        Object.prototype.hasOwnProperty.call(
          value,
          key
        )
      ) {

        const found =
          findImageUrl(
            value[key],
            visited
          );


        if (found) {

          return found;

        }

      }

    }


    for (
      const key
      of Object.keys(value)
    ) {

      if (
        preferredKeys.includes(
          key
        )
      ) {

        continue;

      }


      const found =
        findImageUrl(
          value[key],
          visited
        );


      if (found) {

        return found;

      }

    }


    return "";

  }


  function isImageUrl(
    value
  ) {

    if (
      typeof value !==
        "string" ||
      !value.trim()
    ) {

      return false;

    }


    const normalized =
      value
        .split("?")[0]
        .split("#")[0]
        .toLowerCase();


    return (

      normalized.endsWith(".jpg") ||

      normalized.endsWith(".jpeg") ||

      normalized.endsWith(".png") ||

      normalized.endsWith(".webp") ||

      normalized.endsWith(".avif") ||

      normalized.endsWith(".gif") ||

      normalized.includes(
        "/storage/"
      ) ||

      normalized.includes(
        "/image/"
      ) ||

      normalized.includes(
        "/images/"
      )

    );

  }


  /* =========================================================
     CAMPOS
     ========================================================= */

  function firstValue(
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
          hasValue(value)
        ) {

          return value;

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
          hasValue(value)
        ) {

          return value;

        }

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


  /* =========================================================
     ORDENACIÓN
     ========================================================= */

  function sortProjects(
    projects
  ) {

    return [
      ...projects
    ].sort(
      (
        a,
        b
      ) => {

        const orderA =
          Number.isFinite(
            a.order
          )
            ? a.order
            : 999999;


        const orderB =
          Number.isFinite(
            b.order
          )
            ? b.order
            : 999999;


        if (
          orderA !==
          orderB
        ) {

          return (
            orderA -
            orderB
          );

        }


        return String(
          a.displayName ||
          a.name
        ).localeCompare(
          String(
            b.displayName ||
            b.name
          ),
          "es",
          {
            sensitivity:
              "base"
          }
        );

      }
    );

  }


  /* =========================================================
     CREAR TARJETA
     ========================================================= */

  function createProjectCard(
    project,
    index
  ) {

    const article =
      document.createElement(
        "article"
      );


    article.className =
      "project-page-card";


    article.dataset.projectName =
      project.rawName;


    article.tabIndex =
      0;


    article.setAttribute(
      "role",
      "link"
    );


    article.setAttribute(
      "aria-label",
      `Ver proyecto ${project.displayName}`
    );


    /* -------------------------------------------------------
       PORTADA
       ------------------------------------------------------- */

    const media =
      document.createElement(
        "div"
      );


    media.className =
      "project-page-card-media protected-media";


    const image =
      document.createElement(
        "img"
      );


    image.className =
      "project-page-card-image protected-image";


    image.alt =
      project.displayName;


    image.loading =
      index < 2
        ? "eager"
        : "lazy";


    image.decoding =
      "async";


    image.draggable =
      false;


    if (
      project.cover
    ) {

      image.src =
        project.cover;

    }


    media.appendChild(
      image
    );


    article.appendChild(
      media
    );


    /* -------------------------------------------------------
       INFORMACIÓN
       ------------------------------------------------------- */

    const info =
      document.createElement(
        "div"
      );


    info.className =
      "project-page-card-info";


    /* TÍTULO */

    const title =
      document.createElement(
        "h2"
      );


    title.className =
      "project-page-card-title";


    title.textContent =
      project.displayName ||
      "Proyecto";


    info.appendChild(
      title
    );


    /* TÍTULO / SUBTÍTULO INGLÉS */

    if (
      project.englishTitle
    ) {

      const englishTitle =
        document.createElement(
          "p"
        );


      englishTitle.className =
        "project-page-card-title-en";


      englishTitle.textContent =
        project.englishTitle;


      info.appendChild(
        englishTitle
      );

    }


    /* -------------------------------------------------------
       METADATOS

       SOLO:
       Categoría
       Técnicas
       Objetivo
       ------------------------------------------------------- */

    const metadata =
      document.createElement(
        "div"
      );


    metadata.className =
      "project-page-card-meta";


    appendMetaRow(
      metadata,
      "Categoría",
      "Category",
      project.category
    );


    appendMetaRow(
      metadata,
      "Técnicas",
      "Techniques",
      project.techniques
    );


    appendMetaRow(
      metadata,
      "Objetivo",
      "Objective",
      project.objective
    );


    info.appendChild(
      metadata
    );


    /* -------------------------------------------------------
       ENLACE
       ------------------------------------------------------- */

    const footer =
      document.createElement(
        "div"
      );


    footer.className =
      "project-page-card-footer";


    const link =
      document.createElement(
        "a"
      );


    link.className =
      "project-page-card-link";


    link.href =
      createProjectUrl(
        project
      );


    link.innerHTML = `
      <span>Ver proyecto</span>
      <small>View project</small>
    `;


    footer.appendChild(
      link
    );


    info.appendChild(
      footer
    );


    article.appendChild(
      info
    );


    /* -------------------------------------------------------
       TARJETA CLICABLE
       ------------------------------------------------------- */

    const openProject =
      event => {

        if (
          event.target.closest(
            "a"
          )
        ) {

          return;

        }


        window.location.href =
          createProjectUrl(
            project
          );

      };


    article.addEventListener(
      "click",
      openProject
    );


    article.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
            "Enter" ||
          event.key ===
            " "
        ) {

          event.preventDefault();


          window.location.href =
            createProjectUrl(
              project
            );

        }

      }
    );


    return article;

  }


  /* =========================================================
     FILA DE METADATA
     ========================================================= */

  function appendMetaRow(
    container,
    spanishLabel,
    englishLabel,
    value
  ) {

    if (!value) {
      return;
    }


    const row =
      document.createElement(
        "div"
      );


    row.className =
      "project-page-card-meta-row";


    const label =
      document.createElement(
        "div"
      );


    label.className =
      "project-page-card-meta-label";


    label.innerHTML =
      `${escapeHtml(spanishLabel)}
       <span>
         ${escapeHtml(englishLabel)}
       </span>`;


    const content =
      document.createElement(
        "div"
      );


    content.className =
      "project-page-card-meta-value";


    content.textContent =
      value;


    row.appendChild(
      label
    );


    row.appendChild(
      content
    );


    container.appendChild(
      row
    );

  }


  /* =========================================================
     URL DEL VISOR
     ========================================================= */

  function createProjectUrl(
    project
  ) {

    const rawName =
      project.rawName ||
      project.name ||
      "";


    return (
      "./visor.html?project=" +
      encodeURIComponent(
        rawName
      )
    );

  }


  /* =========================================================
     ESCAPADO
     ========================================================= */

  function escapeHtml(
    value
  ) {

    return String(value)

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


    document
      .querySelectorAll(
        ".protected-media"
      )
      .forEach(
        media => {

          media.addEventListener(
            "contextmenu",
            event =>
              event.preventDefault()
          );

        }
      );

  }


})();
