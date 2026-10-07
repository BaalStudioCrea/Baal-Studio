/* =========================================================
   BAAL STUDIO — PROYECTOS
   proyectos.js
   ========================================================= */

(() => {
  "use strict";

  /* ---------------------------------------------------------
     PROTECCIÓN CONTRA DOBLE CARGA DEL SCRIPT
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

  document.addEventListener("DOMContentLoaded", () => {
    loadProjectsPage();
  });


  /* ---------------------------------------------------------
     CARGA PRINCIPAL
     --------------------------------------------------------- */

  async function loadProjectsPage() {
    const grid = document.getElementById("projects-grid");
    const loading = document.getElementById("projects-loading");
    const emptyState = document.getElementById("projects-empty-state");

    if (!grid) {
      console.error(
        "[Baal Studio] No se encontró #projects-grid."
      );
      return;
    }

    if (loading) {
      loading.style.display = "block";
    }

    if (emptyState) {
      emptyState.style.display = "none";
    }

    try {
      console.log(
        "[Baal Studio] Consultando list-projects..."
      );

      const response = await fetch(PROJECTS_FUNCTION, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },
        cache: "no-store"
      });

      console.log(
        "[Baal Studio] list-projects HTTP:",
        response.status
      );

      if (!response.ok) {
        throw new Error(
          `list-projects respondió con HTTP ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "[Baal Studio] Respuesta completa de list-projects:",
        data
      );

      const projects = normalizeProjectsResponse(data);

      console.log(
        "[Baal Studio] Proyectos normalizados:",
        projects
      );

      const orderedProjects = sortProjects(projects);

      console.log(
        "[Baal Studio] Orden final:",
        orderedProjects
      );

      grid.innerHTML = "";

      if (!orderedProjects.length) {
        if (loading) {
          loading.style.display = "none";
        }

        if (emptyState) {
          emptyState.style.display = "block";
        }

        console.warn(
          "[Baal Studio] No se encontraron proyectos."
        );

        return;
      }

      orderedProjects.forEach((project, index) => {
        const card = createProjectCard(project, index);
        grid.appendChild(card);
      });

      if (loading) {
        loading.style.display = "none";
      }

      console.log(
        `[Baal Studio] ${orderedProjects.length} proyectos cargados correctamente.`
      );

      applyImageProtection();

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

        const message = emptyState.querySelector(
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
     NORMALIZACIÓN DE RESPUESTA
     --------------------------------------------------------- */

  function normalizeProjectsResponse(data) {
    if (!data) {
      return [];
    }

    if (Array.isArray(data)) {
      return data
        .map(normalizeProject)
        .filter(Boolean);
    }

    if (Array.isArray(data.projects)) {
      return data.projects
        .map(normalizeProject)
        .filter(Boolean);
    }

    if (Array.isArray(data.data)) {
      return data.data
        .map(normalizeProject)
        .filter(Boolean);
    }

    if (data.project) {
      const project = normalizeProject(data.project);

      return project ? [project] : [];
    }

    return [];
  }


  /* ---------------------------------------------------------
     NORMALIZACIÓN DE CADA PROYECTO
     --------------------------------------------------------- */

  function normalizeProject(project) {
    if (!project || typeof project !== "object") {
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

    const metadata =
      project.metadata &&
      typeof project.metadata === "object"
        ? project.metadata
        : {};

    const displayName = extractProjectTitle(
      project,
      metadata,
      rawName
    );

    const titleEn = extractFirstValue(
      project,
      metadata,
      [
        "title_en",
        "titulo_en",
        "name_en",
        "nombre_en",
        "english_title"
      ]
    );

    const order = extractProjectOrder(
      project,
      rawName
    );

    const cover = extractCover(project);

    const category = extractFirstValue(
      project,
      metadata,
      [
        "category",
        "categoria",
        "categoría",
        "tipo",
        "type"
      ]
    );

    const techniques = extractFirstValue(
      project,
      metadata,
      [
        "techniques",
        "tecnicas",
        "técnicas",
        "tecnica",
        "técnica",
        "tools",
        "herramientas"
      ]
    );

    const objective = extractFirstValue(
      project,
      metadata,
      [
        "objective",
        "objetivo",
        "purpose",
        "finalidad",
        "meta",
        "objetivos"
      ]
    );

    const location = extractFirstValue(
      project,
      metadata,
      [
        "location",
        "ubicacion",
        "ubicación",
        "lugar",
        "place"
      ]
    );

    const year = extractFirstValue(
      project,
      metadata,
      [
        "year",
        "año",
        "ano",
        "fecha"
      ]
    );

    return {
      ...project,

      rawName,
      name: rawName,

      displayName,
      titleEn: cleanText(titleEn),

      order,

      cover,

      category: cleanText(category),
      techniques: cleanText(techniques),
      objective: cleanText(objective),
      location: cleanText(location),
      year: cleanText(year),

      metadata
    };
  }


  /* ---------------------------------------------------------
     TÍTULO DEL PROYECTO
     --------------------------------------------------------- */

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

    for (const candidate of candidates) {
      if (
        typeof candidate === "string" &&
        candidate.trim()
      ) {
        return cleanProjectTitle(candidate);
      }
    }

    return cleanProjectTitle(rawName);
  }


  /* ---------------------------------------------------------
     LIMPIEZA DEL TÍTULO
     --------------------------------------------------------- */

  function cleanProjectTitle(value) {
    return String(value)
      .replace(/\s*[.!?]+\s*$/, "")
      .replace(/\s+/g, " ")
      .trim();
  }


  /* ---------------------------------------------------------
     ORDEN DEL PROYECTO
     --------------------------------------------------------- */

  function extractProjectOrder(project, rawName) {
    const directCandidates = [
      project.order,
      project.orden,
      project.position,
      project.priority
    ];

    for (const value of directCandidates) {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }

    const match = String(rawName).match(
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

    /* Prioridad máxima: objeto cover */

    if (
      project.cover &&
      typeof project.cover === "object"
    ) {
      const coverUrl = extractUrlFromValue(
        project.cover
      );

      if (coverUrl) {
        return coverUrl;
      }
    }

    /* Si cover ya es una URL */

    if (
      typeof project.cover === "string" &&
      isImageUrl(project.cover)
    ) {
      return project.cover;
    }

    /* Campos directos */

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

    for (const candidate of candidates) {
      const url = extractUrlFromValue(candidate);

      if (url && isImageUrl(url)) {
        return url;
      }
    }

    /* Búsqueda recursiva */

    const recursiveUrl = findImageUrl(
      project,
      new Set()
    );

    return recursiveUrl || "";
  }


  /* ---------------------------------------------------------
     EXTRACCIÓN DE URL
     --------------------------------------------------------- */

  function extractUrlFromValue(value) {
    if (!value) {
      return "";
    }

    if (typeof value === "string") {
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

    for (const candidate of candidates) {
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

  function findImageUrl(value, visited) {
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

    if (visited.has(value)) {
      return "";
    }

    visited.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = findImageUrl(
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

    for (const key of preferredKeys) {
      if (
        Object.prototype.hasOwnProperty.call(
          value,
          key
        )
      ) {
        const result = findImageUrl(
          value[key],
          visited
        );

        if (result) {
          return result;
        }
      }
    }

    for (const key of Object.keys(value)) {
      if (
        preferredKeys.includes(key)
      ) {
        continue;
      }

      const result = findImageUrl(
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
     RECONOCIMIENTO DE IMÁGENES
     --------------------------------------------------------- */

  function isImageUrl(value) {
    if (
      typeof value !== "string" ||
      !value.trim()
    ) {
      return false;
    }

    const normalized = value
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
      normalized.includes("/image/") ||
      normalized.includes("/images/") ||
      normalized.includes("/storage/")
    );
  }


  /* ---------------------------------------------------------
     EXTRACCIÓN DE CAMPOS
     --------------------------------------------------------- */

  function extractFirstValue(
    project,
    metadata,
    keys
  ) {
    for (const key of keys) {
      if (
        metadata &&
        Object.prototype.hasOwnProperty.call(
          metadata,
          key
        )
      ) {
        const value = metadata[key];

        if (
          value !== null &&
          value !== undefined &&
          String(value).trim()
        ) {
          return value;
        }
      }
    }

    for (const key of keys) {
      if (
        project &&
        Object.prototype.hasOwnProperty.call(
          project,
          key
        )
      ) {
        const value = project[key];

        if (
          value !== null &&
          value !== undefined &&
          String(value).trim()
        ) {
          return value;
        }
      }
    }

    return "";
  }


  /* ---------------------------------------------------------
     LIMPIEZA GENERAL DE TEXTO
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
     ORDENACIÓN FINAL
     --------------------------------------------------------- */

  function sortProjects(projects) {
    return [...projects].sort(
      (a, b) => {
        const orderA =
          Number.isFinite(a.order)
            ? a.order
            : 999999;

        const orderB =
          Number.isFinite(b.order)
            ? b.order
            : 999999;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return String(
          a.displayName || a.name || ""
        ).localeCompare(
          String(
            b.displayName || b.name || ""
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
     CREACIÓN DE TARJETA
     --------------------------------------------------------- */

  function createProjectCard(
    project,
    index
  ) {
    const article =
      document.createElement("article");

    article.className =
      "project-page-card";

    article.dataset.projectName =
      project.rawName || project.name || "";

    article.dataset.projectOrder =
      String(project.order);

    /* -------------------------------------------------------
       MEDIA
       ------------------------------------------------------- */

    const media =
      document.createElement("div");

    media.className =
      "project-page-card-media protected-media";


    const image =
      document.createElement("img");

    image.className =
      "project-page-card-image protected-image";

    image.alt =
      project.displayName ||
      "Proyecto Baal Studio";

    image.loading =
      index < 2
        ? "eager"
        : "lazy";

    image.decoding =
      "async";

    image.draggable = false;


    if (
      project.cover &&
      typeof project.cover === "string"
    ) {
      image.src =
        project.cover;

      image.dataset.source =
        "supabase-cover";

      console.log(
        `[Baal Studio] Cover asignado: ${project.displayName}`,
        project.cover
      );
    }


    image.addEventListener(
      "load",
      () => {
        console.log(
          `[Baal Studio] Cover cargado: ${project.displayName}`,
          {
            width: image.naturalWidth,
            height: image.naturalHeight
          }
        );
      }
    );


    image.addEventListener(
      "error",
      (event) => {
        console.error(
          `[Baal Studio] ERROR cargando cover: ${project.displayName}`,
          {
            url: image.src,
            event
          }
        );
      }
    );


    media.appendChild(image);


    /* -------------------------------------------------------
       INFORMACIÓN
       ------------------------------------------------------- */

    const info =
      document.createElement("div");

    info.className =
      "project-page-card-info";


    /* Cabecera de la tarjeta */

    const header =
      document.createElement("div");

    header.className =
      "project-page-card-header";


    /* Kicker fijo */

    const kicker =
      document.createElement("p");

    kicker.className =
      "project-page-card-kicker";

    kicker.textContent =
      "Selección de proyectos";

    header.appendChild(kicker);


    /* Título */

    const title =
      document.createElement("h2");

    title.className =
      "project-page-card-title";

    title.textContent =
      project.displayName ||
      project.name ||
      "";

    header.appendChild(title);


    /* Título en Inglés (si existe) */

    if (project.titleEn) {
      const titleEn =
        document.createElement("p");

      titleEn.className =
        "project-page-card-title-en";

      titleEn.textContent =
        project.titleEn;

      header.appendChild(titleEn);
    }

    info.appendChild(header);


    /* Metadatos (Categoría, Técnicas, Objetivo) */

    const metadata =
      document.createElement("div");

    metadata.className =
      "project-page-card-meta";


    if (project.category) {
      metadata.appendChild(
        createMetaItem(
          "Categoría",
          project.category
        )
      );
    }

    if (project.techniques) {
      metadata.appendChild(
        createMetaItem(
          "Técnicas",
          project.techniques
        )
      );
    }

    if (project.objective) {
      metadata.appendChild(
        createMetaItem(
          "Objetivo",
          project.objective
        )
      );
    }

    /* Fallbacks si no existen Técnicas u Objetivo */

    if (!project.techniques && project.location) {
      metadata.appendChild(
        createMetaItem(
          "Ubicación",
          project.location
        )
      );
    }

    if (!project.objective && project.year) {
      metadata.appendChild(
        createMetaItem(
          "Año",
          project.year
        )
      );
    }

    info.appendChild(metadata);


    /* Pie de la tarjeta (Índice y Enlace) */

    const footer =
      document.createElement("div");

    footer.className =
      "project-page-card-footer";


    const indexSpan =
      document.createElement("span");

    indexSpan.className =
      "project-page-card-index";

    indexSpan.textContent =
      String(index + 1).padStart(2, "0");

    footer.appendChild(indexSpan);


    const link =
      document.createElement("a");

    link.className =
      "project-page-card-link";

    link.href =
      createProjectUrl(
        project
      );

    link.setAttribute(
      "aria-label",
      `Ver proyecto ${project.displayName || ""}`
    );


    const linkMain =
      document.createElement("span");

    linkMain.className =
      "project-page-card-link-main";

    linkMain.textContent =
      "Ver proyecto";

    link.appendChild(linkMain);


    const linkEn =
      document.createElement("span");

    linkEn.className =
      "project-page-card-link-en";

    linkEn.textContent =
      "View project";

    link.appendChild(linkEn);


    footer.appendChild(link);
    info.appendChild(footer);


    /* -------------------------------------------------------
       MONTAJE
       ------------------------------------------------------- */

    article.appendChild(media);
    article.appendChild(info);


    return article;
  }


  /* ---------------------------------------------------------
     ITEM DE METADATA
     --------------------------------------------------------- */

  function createMetaItem(
    label,
    value
  ) {
    const item =
      document.createElement("div");

    item.className =
      "project-page-card-meta-item";


    const labelSpan =
      document.createElement("span");

    labelSpan.className =
      "project-page-card-meta-label";

    labelSpan.textContent =
      label;

    item.appendChild(labelSpan);


    const valueSpan =
      document.createElement("span");

    valueSpan.className =
      "project-page-card-meta-value";

    valueSpan.textContent =
      value;

    item.appendChild(valueSpan);


    return item;
  }


  /* ---------------------------------------------------------
     URL DEL PROYECTO
     --------------------------------------------------------- */

  function createProjectUrl(project) {
    const rawName =
      project.rawName ||
      project.name ||
      "";

    return (
      "./proyecto.html?project=" +
      encodeURIComponent(rawName)
    );
  }


  /* ---------------------------------------------------------
     PROTECCIÓN DE IMÁGENES
     --------------------------------------------------------- */

  function applyImageProtection() {
    const images =
      document.querySelectorAll(
        ".protected-image"
      );

    images.forEach((image) => {
      image.draggable = false;

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
    });


    const protectedMedia =
      document.querySelectorAll(
        ".protected-media"
      );

    protectedMedia.forEach((media) => {
      media.addEventListener(
        "contextmenu",
        (event) => {
          event.preventDefault();
        }
      );
    });
  }

})();
