/* ============================================================
   BAAL STUDIO
   PROYECTOS.JS
   LISTADO DINÁMICO DE PROYECTOS
   ============================================================ */

(() => {

  "use strict";

  /* ----------------------------------------------------------
     PROTECCIÓN CONTRA DOBLE CARGA
     ---------------------------------------------------------- */

  if (window.__BAAL_PROYECTOS_JS_LOADED__) {
    return;
  }

  window.__BAAL_PROYECTOS_JS_LOADED__ = true;


  /* ----------------------------------------------------------
     CONFIGURACIÓN
     ---------------------------------------------------------- */

  const SUPABASE_URL =
    "https://hlyzyeatnbulyfiiwvsq.supabase.co";

  const PROJECTS_FUNCTION =
    `${SUPABASE_URL}/functions/v1/list-projects`;


  /* ----------------------------------------------------------
     INICIO
     ---------------------------------------------------------- */

  document.addEventListener("DOMContentLoaded", () => {
    loadProjectsPage();
  });


  /* ----------------------------------------------------------
     CARGAR PROYECTOS
     ---------------------------------------------------------- */

  async function loadProjectsPage() {

    const grid =
      document.getElementById("projects-grid");

    const loading =
      document.getElementById("projects-loading");

    const empty =
      document.getElementById("projects-empty-state");

    if (!grid) {
      console.error(
        "[Baal Studio] No se encontró #projects-grid."
      );
      return;
    }

    try {

      console.log(
        "[Baal Studio] Consultando list-projects..."
      );

      const response =
        await fetch(PROJECTS_FUNCTION, {
          method: "GET",
          cache: "no-store"
        });

      console.log(
        "[Baal Studio] list-projects HTTP:",
        response.status
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      console.log(
        "[Baal Studio] Respuesta completa:",
        data
      );

      const projects =
        normalizeProjectsResponse(data);

      if (!projects.length) {

        if (loading) {
          loading.style.display = "none";
        }

        if (empty) {
          empty.classList.add("visible");
        }

        console.warn(
          "[Baal Studio] No se encontraron proyectos."
        );

        return;
      }

      const normalizedProjects =
        projects
          .map(normalizeProject)
          .filter(Boolean)
          .sort(sortProjects);

      console.log(
        "[Baal Studio] Proyectos normalizados:",
        normalizedProjects
      );

      grid.innerHTML = "";

      normalizedProjects.forEach(
        (project, index) => {

          const card =
            createProjectCard(
              project,
              index
            );

          grid.appendChild(card);
        }
      );

      if (loading) {
        loading.style.display = "none";
      }

      if (empty) {
        empty.classList.remove("visible");
      }

      /*
       * Aplicamos la protección existente de Baal Studio
       * si script.js la proporciona.
       */
      if (
        typeof window.applyProtectionToImages ===
        "function"
      ) {
        window.applyProtectionToImages(grid);
      }

      console.log(
        `[Baal Studio] ${normalizedProjects.length} proyectos cargados correctamente.`
      );

    } catch (error) {

      console.error(
        "[Baal Studio] Error cargando proyectos:",
        error
      );

      if (loading) {
        loading.style.display = "none";
      }

      if (empty) {
        empty.classList.add("visible");
      }
    }
  }


  /* ----------------------------------------------------------
     NORMALIZAR RESPUESTA
     ---------------------------------------------------------- */

  function normalizeProjectsResponse(data) {

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

    if (
      data.data &&
      Array.isArray(data.data.projects)
    ) {
      return data.data.projects;
    }

    return [];
  }


  /* ----------------------------------------------------------
     NORMALIZAR PROYECTO
     ---------------------------------------------------------- */

  function normalizeProject(project) {

    if (!project || typeof project !== "object") {
      return null;
    }

    const rawName =
      String(
        project.name ||
        project.folder ||
        project.project ||
        project.slug ||
        ""
      ).trim();

    if (!rawName) {
      return null;
    }


    /*
     * METADATA PROCEDENTE DE list-projects
     * list-projects debe obtenerla desde proyecto.txt.
     */

    const metadata =
      project.metadata &&
      typeof project.metadata === "object"
        ? project.metadata
        : {};


    /* --------------------------------------------------------
       TÍTULO
       -------------------------------------------------------- */

    const title =
      cleanDisplayText(
        metadata.titulo ||
        metadata.title ||
        metadata.nombre ||
        metadata.name ||
        project.titulo ||
        project.title ||
        project.nombre ||
        project.title_es ||
        rawName
      );


    /* --------------------------------------------------------
       CATEGORÍA
       -------------------------------------------------------- */

    const category =
      cleanDisplayText(
        metadata.categoria ||
        metadata.category ||
        project.categoria ||
        project.category ||
        ""
      );


    /* --------------------------------------------------------
       TÉCNICAS
       -------------------------------------------------------- */

    const techniques =
      cleanDisplayText(
        metadata.tecnicas ||
        metadata.técnicas ||
        metadata.techniques ||
        project.tecnicas ||
        project.técnicas ||
        project.techniques ||
        ""
      );


    /* --------------------------------------------------------
       OBJETIVO
       -------------------------------------------------------- */

    const objective =
      cleanDisplayText(
        metadata.objetivo ||
        metadata.objective ||
        project.objetivo ||
        project.objective ||
        ""
      );


    /* --------------------------------------------------------
       ORDEN
       -------------------------------------------------------- */

    const order =
      getProjectOrder(
        project,
        rawName
      );


    /* --------------------------------------------------------
       PORTADA
       -------------------------------------------------------- */

    const cover =
      extractCover(project);


    return {

      rawName,

      displayName:
        removeFolderOrder(rawName),

      title,

      category,

      techniques,

      objective,

      order,

      cover,

      metadata,

      original:
        project

    };
  }


  /* ----------------------------------------------------------
     ORDENAR PROYECTOS
     ---------------------------------------------------------- */

  function sortProjects(a, b) {

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

    return String(a.displayName)
      .localeCompare(
        String(b.displayName),
        "es",
        {
          sensitivity: "base"
        }
      );
  }


  /* ----------------------------------------------------------
     OBTENER ORDEN
     ---------------------------------------------------------- */

  function getProjectOrder(
    project,
    rawName
  ) {

    const directValues = [

      project.order,

      project.orden,

      project.position,

      project.index

    ];

    for (const value of directValues) {

      const number =
        Number(value);

      if (
        Number.isFinite(number)
      ) {
        return number;
      }
    }


    /*
     * Si el backend no devuelve order,
     * lo obtenemos del final del nombre:
     *
     * Ejemplo:
     * Epigrafias arabes de Granada (01)
     */

    const match =
      rawName.match(
        /\((\d+)\)\s*$/
      );

    if (match) {

      const number =
        Number(match[1]);

      if (
        Number.isFinite(number)
      ) {
        return number;
      }
    }

    return 999999;
  }


  /* ----------------------------------------------------------
     CREAR TARJETA
     ---------------------------------------------------------- */

  function createProjectCard(
    project,
    index
  ) {

    const card =
      document.createElement("article");

    card.className =
      "project-page-card";


    /*
     * La tarjeta completa funciona como enlace.
     */

    card.setAttribute(
      "role",
      "link"
    );

    card.setAttribute(
      "tabindex",
      "0"
    );


    /* --------------------------------------------------------
       MEDIA
       -------------------------------------------------------- */

    const media =
      document.createElement("div");

    media.className =
      "project-page-card-media protected-media";


    const image =
      document.createElement("img");

    image.className =
      "protected-image";

    image.alt =
      project.title ||
      project.displayName ||
      "Proyecto Baal Studio";

    image.loading =
      index < 2
        ? "eager"
        : "lazy";

    image.decoding =
      "async";

    image.draggable =
      false;


    if (project.cover) {

      image.src =
        project.cover;

      image.dataset.source =
        "supabase-cover";

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
        },
        {
          once: true
        }
      );

      image.addEventListener(
        "error",
        () => {

          console.error(
            `[Baal Studio] Error cargando cover: ${project.displayName}`,
            image.src
          );
        },
        {
          once: true
        }
      );
    }


    media.appendChild(image);


    /* --------------------------------------------------------
       INFORMACIÓN
       -------------------------------------------------------- */

    const info =
      document.createElement("div");

    info.className =
      "project-page-card-info";


    const header =
      document.createElement("div");

    header.className =
      "project-page-card-header";


    const kicker =
      document.createElement("p");

    kicker.className =
      "project-page-card-kicker";

    kicker.textContent =
      "PROYECTO";


    const title =
      document.createElement("h2");

    title.className =
      "project-page-card-title";

    title.textContent =
      project.title ||
      project.displayName;


    header.appendChild(kicker);
    header.appendChild(title);


    /* --------------------------------------------------------
       METADATOS
       SOLO LOS CUATRO CAMPOS SOLICITADOS
       -------------------------------------------------------- */

    const meta =
      document.createElement("div");

    meta.className =
      "project-page-card-meta";


    addMetadataRow(
      meta,
      "Título",
      project.title
    );

    addMetadataRow(
      meta,
      "Categoría",
      project.category
    );

    addMetadataRow(
      meta,
      "Técnicas",
      project.techniques
    );

    addMetadataRow(
      meta,
      "Objetivo",
      project.objective
    );


    /* --------------------------------------------------------
       PIE
       -------------------------------------------------------- */

    const footer =
      document.createElement("div");

    footer.className =
      "project-page-card-footer";


    const link =
      document.createElement("a");

    link.className =
      "project-page-card-link";

    link.href =
      createViewerUrl(
        project.rawName
      );

    link.innerHTML = `
      <span class="project-page-card-link-main">
        Ver proyecto
      </span>
      <span class="project-page-card-link-en">
        View project
      </span>
    `;


    /*
     * Evita que el click del enlace
     * dispare también el click general
     * de la tarjeta.
     */

    link.addEventListener(
      "click",
      event => {
        event.stopPropagation();
      }
    );


    footer.appendChild(link);


    /* --------------------------------------------------------
       ENSAMBLA TARJETA
       -------------------------------------------------------- */

    info.appendChild(header);
    info.appendChild(meta);
    info.appendChild(footer);

    card.appendChild(media);
    card.appendChild(info);


    /* --------------------------------------------------------
       CLICK EN TODA LA TARJETA
       -------------------------------------------------------- */

    const openViewer =
      () => {

        window.location.href =
          createViewerUrl(
            project.rawName
          );
      };


    card.addEventListener(
      "click",
      event => {

        /*
         * Si se ha pulsado un enlace,
         * dejamos que el enlace funcione.
         */

        if (
          event.target.closest("a")
        ) {
          return;
        }

        openViewer();
      }
    );


    card.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          openViewer();
        }
      }
    );


    return card;
  }


  /* ----------------------------------------------------------
     FILA DE METADATO
     ---------------------------------------------------------- */

  function addMetadataRow(
    container,
    label,
    value
  ) {

    const row =
      document.createElement("div");

    row.className =
      "project-page-card-meta-item";


    const labelElement =
      document.createElement("span");

    labelElement.className =
      "project-page-card-meta-label";

    labelElement.textContent =
      label;


    const valueElement =
      document.createElement("span");

    valueElement.className =
      "project-page-card-meta-value";

    valueElement.textContent =
      value ||
      "—";


    row.appendChild(
      labelElement
    );

    row.appendChild(
      valueElement
    );

    container.appendChild(
      row
    );
  }


  /* ----------------------------------------------------------
     URL DEL VISOR
     ---------------------------------------------------------- */

  function createViewerUrl(
    projectName
  ) {

    return (
      "./visor.html?project=" +
      encodeURIComponent(projectName)
    );
  }


  /* ----------------------------------------------------------
     EXTRAER PORTADA
     ---------------------------------------------------------- */

  function extractCover(project) {

    if (!project) {
      return "";
    }


    const candidates = [

      project.cover,

      project.coverUrl,

      project.cover_url,

      project.imageUrl,

      project.image_url,

      project.thumbnail,

      project.thumbnailUrl,

      project.thumbnail_url

    ];


    for (
      const candidate of candidates
    ) {

      const url =
        extractUrlFromValue(
          candidate
        );

      if (
        isImageUrl(url)
      ) {
        return url;
      }
    }


    /*
     * Búsqueda recursiva por si el backend
     * devuelve la portada dentro de otro objeto.
     */

    return findImageUrl(
      project
    );
  }


  /* ----------------------------------------------------------
     BUSCAR IMAGEN RECURSIVAMENTE
     ---------------------------------------------------------- */

  function findImageUrl(
    value,
    depth = 0
  ) {

    if (
      depth > 5 ||
      value === null ||
      value === undefined
    ) {
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


    const preferredKeys = [

      "url",
      "signedUrl",
      "signed_url",
      "coverUrl",
      "cover_url",
      "imageUrl",
      "image_url",
      "thumbnailUrl",
      "thumbnail_url"

    ];


    for (
      const key of preferredKeys
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
            depth + 1
          );

        if (result) {
          return result;
        }
      }
    }


    for (
      const key of Object.keys(value)
    ) {

      const result =
        findImageUrl(
          value[key],
          depth + 1
        );

      if (result) {
        return result;
      }
    }


    return "";
  }


  /* ----------------------------------------------------------
     EXTRAER URL
     ---------------------------------------------------------- */

  function extractUrlFromValue(
    value
  ) {

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
      "src"

    ];


    for (
      const key of keys
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


  /* ----------------------------------------------------------
     COMPROBAR IMAGEN
     ---------------------------------------------------------- */

  function isImageUrl(
    value
  ) {

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
      clean.endsWith(".gif")
    );
  }


  /* ----------------------------------------------------------
     LIMPIAR TEXTO
     ---------------------------------------------------------- */

  function cleanDisplayText(
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
        .map(item =>
          cleanDisplayText(item)
        )
        .filter(Boolean)
        .join(", ");
    }


    if (
      typeof value === "object"
    ) {

      return (
        value.es ||
        value.ES ||
        value.value ||
        value.text ||
        value.title ||
        ""
      )
        .toString()
        .trim();
    }


    return String(value)
      .replace(/\s+/g, " ")
      .trim();
  }


  /* ----------------------------------------------------------
     QUITAR ORDEN DEL NOMBRE DE CARPETA
     ---------------------------------------------------------- */

  function removeFolderOrder(
    name
  ) {

    return String(name)
      .replace(
        /\s*\(\d+\)\s*$/,
        ""
      )
      .trim();
  }

})();
