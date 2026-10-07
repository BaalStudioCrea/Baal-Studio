/* =========================================================
   BAAL STUDIO — PROYECTOS
   proyectos.js
   ========================================================= */

(() => {
  "use strict";

  /* ---------------------------------------------------------
     PROTECCIÓN CONTRA DOBLE CARGA
     --------------------------------------------------------- */

  if (window.__BAAL_PROYECTOS_LOADED__) {
    console.warn("[Baal Studio] proyectos.js ya estaba cargado.");
    return;
  }

  window.__BAAL_PROYECTOS_LOADED__ = true;


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
    loadProjectsPage
  );


  /* ---------------------------------------------------------
     CARGA PRINCIPAL
     --------------------------------------------------------- */

  async function loadProjectsPage() {

    const grid =
      document.getElementById("projects-grid");

    const loading =
      document.getElementById("projects-loading");

    const emptyState =
      document.getElementById("projects-empty-state");


    if (!grid) {
      console.error(
        "[Baal Studio] No se encontró #projects-grid."
      );
      return;
    }


    try {

      if (loading) {
        loading.style.display = "block";
      }

      if (emptyState) {
        emptyState.style.display = "none";
      }


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


      console.log(
        "[Baal Studio] Respuesta de list-projects:",
        data
      );


      const projects =
        normalizeProjectsResponse(data);


      const orderedProjects =
        sortProjects(projects);


      grid.innerHTML = "";


      if (!orderedProjects.length) {

        if (loading) {
          loading.style.display = "none";
        }

        if (emptyState) {
          emptyState.style.display = "block";
        }

        return;
      }


      orderedProjects.forEach(
        (project) => {

          const card =
            createProjectCard(project);

          grid.appendChild(card);

        }
      );


      if (loading) {
        loading.style.display = "none";
      }


      applyImageProtection();


      console.log(
        `[Baal Studio] ${orderedProjects.length} proyectos cargados.`
      );

    } catch (error) {

      console.error(
        "[Baal Studio] Error cargando proyectos:",
        error
      );


      if (loading) {
        loading.style.display = "none";
      }


      if (emptyState) {

        emptyState.style.display = "block";

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


  /* ---------------------------------------------------------
     NORMALIZAR RESPUESTA
     --------------------------------------------------------- */

  function normalizeProjectsResponse(data) {

    if (!data) {
      return [];
    }


    let projects = [];


    if (Array.isArray(data)) {

      projects = data;

    } else if (
      Array.isArray(data.projects)
    ) {

      projects = data.projects;

    } else if (
      Array.isArray(data.data)
    ) {

      projects = data.data;

    } else if (
      Array.isArray(data.results)
    ) {

      projects = data.results;

    } else if (
      data.project &&
      typeof data.project === "object"
    ) {

      projects = [data.project];

    }


    return projects
      .map(normalizeProject)
      .filter(Boolean);

  }


  /* ---------------------------------------------------------
     NORMALIZAR PROYECTO
     --------------------------------------------------------- */

  function normalizeProject(project) {

    if (
      !project ||
      typeof project !== "object"
    ) {
      return null;
    }


    const rawName =
      project.name ||
      project.folder ||
      project.folderName ||
      project.projectName ||
      project.nombre ||
      "";


    if (!rawName) {
      return null;
    }


    let metadata =
      project.metadata || {};


    if (
      typeof metadata === "string"
    ) {

      try {
        metadata =
          JSON.parse(metadata);
      } catch {
        metadata = {};
      }

    }


    const displayName =
      extractProjectTitle(
        project,
        metadata,
        rawName
      );


    const englishTitle =
      extractFirstValue(
        project,
        metadata,
        [
          "title_en",
          "titulo_en",
          "englishTitle",
          "english_title",
          "nombre_en",
          "name_en"
        ]
      );


    const category =
      extractFirstValue(
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
      extractFirstValue(
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
      extractFirstValue(
        project,
        metadata,
        [
          "objetivo",
          "objective",
          "objectives"
        ]
      );


    const order =
      extractProjectOrder(
        project,
        rawName
      );


    const cover =
      extractCover(project);


    return {

      ...project,

      rawName,

      name:
        rawName,

      displayName,

      englishTitle:
        cleanText(englishTitle),

      category:
        cleanText(category),

      techniques:
        cleanText(techniques),

      objective:
        cleanText(objective),

      order,

      cover,

      metadata

    };

  }


  /* ---------------------------------------------------------
     TÍTULO
     --------------------------------------------------------- */

  function extractProjectTitle(
    project,
    metadata,
    rawName
  ) {

    const candidates = [

      metadata?.titulo,

      metadata?.title,

      metadata?.nombre,

      metadata?.name,

      project?.titulo,

      project?.title,

      project?.nombre,

      project?.title_es,

      project?.name_es

    ];


    for (
      const candidate
      of candidates
    ) {

      if (
        candidate !== null &&
        candidate !== undefined &&
        String(candidate).trim()
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


  /* ---------------------------------------------------------
     LIMPIAR TÍTULO
     --------------------------------------------------------- */

  function cleanProjectTitle(value) {

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


  /* ---------------------------------------------------------
     ORDEN
     --------------------------------------------------------- */

  function extractProjectOrder(
    project,
    rawName
  ) {

    const directValues = [

      project?.order,

      project?.orden,

      project?.position,

      project?.priority

    ];


    for (
      const value
      of directValues
    ) {

      const number =
        Number(value);


      if (
        Number.isFinite(number)
      ) {

        return number;

      }

    }


    const match =
      String(rawName).match(
        /\((\d+)\)\s*$/
      );


    if (match) {
      return Number(match[1]);
    }


    return 999999;

  }


  /* ---------------------------------------------------------
     PORTADA
     --------------------------------------------------------- */

  function extractCover(project) {

    if (!project) {
      return "";
    }


    if (
      project.cover &&
      typeof project.cover === "object"
    ) {

      const url =
        extractUrlFromValue(
          project.cover
        );

      if (url) {
        return url;
      }

    }


    if (
      typeof project.cover === "string" &&
      isImageUrl(project.cover)
    ) {

      return project.cover;

    }


    const candidates = [

      project.coverUrl,

      project.cover_url,

      project.imageUrl,

      project.image_url,

      project.thumbnail,

      project.thumbnailUrl,

      project.thumbnail_url,

      project.image,

      project.preview,

      project.previewUrl,

      project.preview_url

    ];


    for (
      const candidate
      of candidates
    ) {

      const url =
        extractUrlFromValue(
          candidate
        );


      if (
        url &&
        isImageUrl(url)
      ) {

        return url;

      }

    }


    return (
      findImageUrl(
        project,
        new Set()
      ) || ""
    );

  }


  /* ---------------------------------------------------------
     EXTRAER URL
     --------------------------------------------------------- */

  function extractUrlFromValue(value) {

    if (!value) {
      return "";
    }


    if (
      typeof value === "string"
    ) {

      return value.trim();

    }


    if (
      typeof value !== "object"
    ) {

      return "";

    }


    const candidates = [

      value.url,

      value.signedUrl,

      value.signed_url,

      value.publicUrl,

      value.public_url,

      value.href,

      value.src

    ];


    for (
      const candidate
      of candidates
    ) {

      if (
        typeof candidate === "string" &&
        candidate.trim()
      ) {

        return candidate.trim();

      }

    }


    return "";

  }


  /* ---------------------------------------------------------
     BÚSQUEDA RECURSIVA DE IMAGEN
     --------------------------------------------------------- */

  function findImageUrl(
    value,
    visited
  ) {

    if (!value) {
      return "";
    }


    if (
      typeof value === "string"
    ) {

      return isImageUrl(value)
        ? value
        : "";

    }


    if (
      typeof value !== "object"
    ) {

      return "";

    }


    if (
      visited.has(value)
    ) {

      return "";

    }


    visited.add(value);


    if (
      Array.isArray(value)
    ) {

      for (
        const item
        of value
      ) {

        const result =
          findImageUrl(
            item,
            visited
          );


        if (result) {
          return result;
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

        const result =
          findImageUrl(
            value[key],
            visited
          );


        if (result) {
          return result;
        }

      }

    }


    for (
      const key
      of Object.keys(value)
    ) {

      if (
        preferredKeys.includes(key)
      ) {
        continue;
      }


      const result =
        findImageUrl(
          value[key],
          visited
        );


      if (result) {
        return result;
      }

    }


    return "";

  }


  /* ---------------------------------------------------------
     RECONOCER IMAGEN
     --------------------------------------------------------- */

  function isImageUrl(value) {

    if (
      typeof value !== "string" ||
      !value.trim()
    ) {

      return false;

    }


    const clean =
      value
        .split("?")[0]
        .split("#")[0]
        .toLowerCase();


    return (

      clean.endsWith(".jpg") ||

      clean.endsWith(".jpeg") ||

      clean.endsWith(".png") ||

      clean.endsWith(".webp") ||

      clean.endsWith(".avif") ||

      clean.endsWith(".gif") ||

      clean.includes("/storage/")

    );

  }


  /* ---------------------------------------------------------
     EXTRAER CAMPO
     --------------------------------------------------------- */

  function extractFirstValue(
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

          if (
            Array.isArray(value)
          ) {

            const text =
              value
                .map(item => cleanText(item))
                .filter(Boolean)
                .join(", ");

            if (text) {
              return text;
            }

          } else {

            const text =
              cleanText(value);

            if (text) {
              return text;
            }

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

          if (
            Array.isArray(value)
          ) {

            const text =
              value
                .map(item => cleanText(item))
                .filter(Boolean)
                .join(", ");

            if (text) {
              return text;
            }

          } else {

            const text =
              cleanText(value);

            if (text) {
              return text;
            }

          }

        }

      }

    }


    return "";

  }


  /* ---------------------------------------------------------
     LIMPIEZA
     --------------------------------------------------------- */

  function cleanText(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }


    return String(value)
      .replace(/\s+/g, " ")
      .trim();

  }


  /* ---------------------------------------------------------
     ORDENACIÓN
     --------------------------------------------------------- */

  function sortProjects(
    projects
  ) {

    return [...projects].sort(
      (a, b) => {

        if (
          a.order !== b.order
        ) {

          return (
            a.order -
            b.order
          );

        }


        return String(
          a.displayName ||
          a.name ||
          ""
        ).localeCompare(
          String(
            b.displayName ||
            b.name ||
            ""
          ),
          "es",
          {
            sensitivity: "base"
          }
        );

      }
    );

  }


  /* ---------------------------------------------------------
     CREAR TARJETA
     --------------------------------------------------------- */

  function createProjectCard(
    project
  ) {

    const article =
      document.createElement(
        "article"
      );


    article.className =
      "project-page-card";


    article.dataset.projectName =
      project.rawName;


    const projectUrl =
      createProjectUrl(
        project
      );


    article.addEventListener(
      "click",
      event => {

        if (
          event.target.closest(
            "a"
          )
        ) {

          return;

        }


        window.location.href =
          projectUrl;

      }
    );


    article.setAttribute(
      "tabindex",
      "0"
    );


    article.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          window.location.href =
            projectUrl;

        }

      }
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
      project.displayName ||
      "Proyecto Baal Studio";


    image.loading =
      "lazy";


    image.decoding =
      "async";


    image.draggable =
      false;


    if (project.cover) {

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
      project.displayName;


    info.appendChild(
      title
    );


    /* SUBTÍTULO INGLÉS */

    if (
      project.englishTitle
    ) {

      const titleEn =
        document.createElement(
          "p"
        );


      titleEn.className =
        "project-page-card-title-en";


      titleEn.textContent =
        project.englishTitle;


      info.appendChild(
        titleEn
      );

    }


    /* METADATA */

    const metadata =
      document.createElement(
        "div"
      );


    metadata.className =
      "project-page-card-meta";


    addMetadataRow(
      metadata,
      "Categoría",
      "Category",
      project.category
    );


    addMetadataRow(
      metadata,
      "Técnicas",
      "Techniques",
      project.techniques
    );


    addMetadataRow(
      metadata,
      "Objetivo",
      "Objective",
      project.objective
    );


    info.appendChild(
      metadata
    );


    /* ENLACE */

    const link =
      document.createElement(
        "a"
      );


    link.className =
      "project-page-card-link";


    link.href =
      projectUrl;


    link.innerHTML = `
      <span class="project-page-card-link-main">
        Ver proyecto
      </span>
      <span class="project-page-card-link-en">
        View project
      </span>
    `;


    link.setAttribute(
      "aria-label",
      `Ver proyecto ${project.displayName}`
    );


    info.appendChild(
      link
    );


    article.appendChild(
      info
    );


    return article;

  }


  /* ---------------------------------------------------------
     FILA DE METADATA
     --------------------------------------------------------- */

  function addMetadataRow(
    container,
    spanish,
    english,
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


    label.innerHTML = `
      <span>${escapeHtml(spanish)}</span>
      <small>${escapeHtml(english)}</small>
    `;


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


  /* ---------------------------------------------------------
     URL DEL VISOR
     --------------------------------------------------------- */

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


  /* ---------------------------------------------------------
     ESCAPAR HTML
     --------------------------------------------------------- */

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


  /* ---------------------------------------------------------
     PROTECCIÓN DE IMÁGENES
     --------------------------------------------------------- */

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
            event => {
              event.preventDefault();
            }
          );


          image.addEventListener(
            "contextmenu",
            event => {
              event.preventDefault();
            }
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
            event => {
              event.preventDefault();
            }
          );

        }
      );

  }


})();
