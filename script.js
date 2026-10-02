/* ============================================================
   BAAL STUDIO
   SCRIPT.JS — V12
   ============================================================ */


/* ------------------------------------------------------------
   CONFIGURACIÓN
   ------------------------------------------------------------ */

const SUPABASE_FUNCTION_BASE =
  "https://hlyzyeatnbulyfiiwvsq.supabase.co/functions/v1";


const FUNCTIONS = {

  siteAssets:
    `${SUPABASE_FUNCTION_BASE}/get-site-assets`,

  projects:
    `${SUPABASE_FUNCTION_BASE}/get-projects`

};


/* ------------------------------------------------------------
   INICIO
   ------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {

  initHeader();

  initMobileMenu();

  initProtection();

  loadSiteAssets();

  loadSelectedProjects();

});


/* ------------------------------------------------------------
   HEADER
   ------------------------------------------------------------ */

function initHeader() {

  const header =
    document.getElementById("main-header");


  if (!header) {
    return;
  }


  function updateHeader() {

    if (window.scrollY > 30) {

      header.classList.add("scrolled");

    } else {

      header.classList.remove("scrolled");

    }

  }


  updateHeader();


  window.addEventListener(
    "scroll",
    updateHeader,
    {
      passive: true
    }
  );

}


/* ------------------------------------------------------------
   MENÚ MÓVIL
   ------------------------------------------------------------ */

function initMobileMenu() {

  const button =
    document.getElementById(
      "mobile-menu-button"
    );

  const menu =
    document.getElementById(
      "mobile-menu"
    );


  if (!button || !menu) {
    return;
  }


  button.addEventListener("click", () => {

    const isOpen =
      button.classList.toggle("open");


    menu.classList.toggle(
      "open",
      isOpen
    );


    button.setAttribute(
      "aria-expanded",
      String(isOpen)
    );


    menu.setAttribute(
      "aria-hidden",
      String(!isOpen)
    );

  });


  menu.querySelectorAll("a").forEach(
    link => {

      link.addEventListener(
        "click",
        () => {

          button.classList.remove("open");

          menu.classList.remove("open");

          button.setAttribute(
            "aria-expanded",
            "false"
          );

          menu.setAttribute(
            "aria-hidden",
            "true"
          );

        }
      );

    }
  );

}


/* ------------------------------------------------------------
   ASSETS DEL SITIO
   ------------------------------------------------------------ */

async function loadSiteAssets() {

  try {

    const response =
      await fetch(
        FUNCTIONS.siteAssets,
        {
          method: "GET",
          headers: {
            "Accept": "application/json"
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        `get-site-assets respondió ${response.status}`
      );

    }


    const result =
      await response.json();


    if (
      !result.success ||
      !result.assets
    ) {

      throw new Error(
        "get-site-assets no devolvió assets válidos."
      );

    }


    const assets =
      result.assets;


    setImageSource(
      "hero-background",
      assets.fondo
    );


    setImageSource(
      "site-logo",
      assets.logoPrincipal
    );


    setImageSource(
      "footer-logo-baal",
      assets.logoPrincipal
    );


    setImageSource(
      "footer-logo-lns",
      assets.logoLNS
    );


    setImageSource(
      "footer-qr",
      assets.qr
    );


    applyProtectionToImages();


  } catch (error) {

    console.error(
      "[Baal Studio] Error cargando assets:",
      error
    );

  }

}


/* ------------------------------------------------------------
   ASIGNAR IMAGEN
   ------------------------------------------------------------ */

function setImageSource(
  elementId,
  source
) {

  const element =
    document.getElementById(elementId);


  if (
    element &&
    typeof source === "string" &&
    source.trim() !== ""
  ) {

    element.src =
      source;

  }

}


/* ------------------------------------------------------------
   PROYECTOS SELECCIONADOS
   ------------------------------------------------------------ */

async function loadSelectedProjects() {

  const container =
    document.getElementById(
      "selected-projects-grid"
    );


  if (!container) {

    console.warn(
      "[Baal Studio] No existe #selected-projects-grid."
    );

    return;

  }


  try {

    const response =
      await fetch(
        FUNCTIONS.projects,
        {
          method: "GET",
          headers: {
            "Accept": "application/json"
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        `get-projects respondió ${response.status}`
      );

    }


    const result =
      await response.json();


    console.log(
      "[Baal Studio] Respuesta get-projects:",
      result
    );


    const projects =
      normalizeProjectsResponse(
        result
      );


    console.log(
      "[Baal Studio] Proyectos normalizados:",
      projects
    );


    if (!projects.length) {

      showProjectsMessage(
        container,
        "No hay proyectos disponibles."
      );

      return;

    }


    projects.sort(
      (a, b) =>
        Number(a.order || 999) -
        Number(b.order || 999)
    );


    /*
       HOME

       Mostramos solamente los tres primeros
       proyectos según el orden definido
       en Supabase.
    */

    const selected =
      projects.slice(0, 3);


    container.innerHTML = "";


    selected.forEach(
      (project, index) => {

        const card =
          createProjectCard(
            project,
            index
          );


        if (card) {

          container.appendChild(card);

        }

      }
    );


    applyProtectionToImages();


  } catch (error) {

    console.error(
      "[Baal Studio] Error cargando proyectos:",
      error
    );


    showProjectsMessage(
      container,
      "No se han podido cargar los proyectos."
    );

  }

}


/* ------------------------------------------------------------
   NORMALIZAR RESPUESTA DE GET-PROJECTS
   ------------------------------------------------------------ */

function normalizeProjectsResponse(
  result
) {

  if (!result) {
    return [];
  }


  let projects = [];


  if (Array.isArray(result)) {

    projects = result;

  } else if (
    Array.isArray(result.projects)
  ) {

    projects = result.projects;

  } else if (
    Array.isArray(result.data)
  ) {

    projects = result.data;

  } else if (
    Array.isArray(result.results)
  ) {

    projects = result.results;

  }


  return projects
    .map(normalizeProject)
    .filter(Boolean);

}


/* ------------------------------------------------------------
   NORMALIZAR PROYECTO
   ------------------------------------------------------------ */

function normalizeProject(
  project
) {

  if (
    !project ||
    typeof project !== "object"
  ) {

    return null;

  }


  /*
     ----------------------------------------------------------
     METADATA
     ----------------------------------------------------------

     Algunos valores pueden estar directamente
     en el objeto y otros dentro de metadata.
  */

  const metadata =
    project.metadata &&
    typeof project.metadata === "object"
      ? project.metadata
      : {};


  /*
     ----------------------------------------------------------
     IDENTIDAD INTERNA
     ----------------------------------------------------------

     Este es el nombre real de la carpeta.

     Ejemplo:

     Epigrafias arabes de Granada (01)

     Se utiliza para construir el enlace,
     pero nunca como título visible.
  */

  const rawName =
    firstValue(
      project.name,
      project.projectName,
      project.project_name,
      project.folder,
      project.slug
    );


  /*
     ----------------------------------------------------------
     TÍTULO VISIBLE
     ----------------------------------------------------------

     Priorizamos los campos editoriales.
  */

  const title =
    firstValue(
      project.titulo,
      project.title,
      project.nombre,
      project.name_display,

      metadata.titulo,
      metadata.title,
      metadata.nombre
    ) ||
    rawName;


  const displayName =
    String(title)
      .replace(
        /\s*\(\d+\)\s*$/,
        ""
      )
      .replace(
        /\s*[.!?]+\s*$/,
        ""
      )
      .trim();


  /*
     ----------------------------------------------------------
     ORDEN
     ----------------------------------------------------------
  */

  const order =
    project.order ??
    project.orden ??
    metadata.order ??
    metadata.orden ??
    project.position ??
    999;


  /*
     ----------------------------------------------------------
     COVER
     ----------------------------------------------------------

     IMPORTANTE:

     get-projects devuelve actualmente:

     cover: {
       file,
       path,
       url
     }

     Extraemos exclusivamente la URL.

     La URL no se modifica.
     No se hace fetch manual.
     No se transforma a Blob.
  */

  const cover =
    extractCover(project);


  /*
     ----------------------------------------------------------
     INFORMACIÓN DEL PROYECTO
     ----------------------------------------------------------

     Se conservan varias denominaciones
     posibles para que la función no dependa
     de un único nombre de campo.
  */

  const location =
    firstValue(
      project.location,
      project.localizacion,
      project.localización,
      project.ubicacion,
      project.ubicación,
      project.place,
      project.procedencia,

      metadata.location,
      metadata.localizacion,
      metadata.localización,
      metadata.ubicacion,
      metadata.ubicación,
      metadata.place,
      metadata.procedencia
    );


  const year =
    firstValue(
      project.year,
      project.año,
      project.ano,

      metadata.year,
      metadata.año,
      metadata.ano
    );


  const category =
    firstValue(
      project.category,
      project.categoria,
      project.type,
      project.tipo,

      metadata.category,
      metadata.categoria,
      metadata.type,
      metadata.tipo
    );


  const description =
    firstValue(
      project.description,
      project.descripcion,
      project.descripción,
      project.resumen,
      project.summary,

      metadata.description,
      metadata.descripcion,
      metadata.descripción,
      metadata.resumen,
      metadata.summary
    );


  /*
     ----------------------------------------------------------
     RESULTADO NORMALIZADO
     ----------------------------------------------------------
  */

  return {

    ...project,

    name:
      rawName,

    displayName:
      displayName,

    order:
      order,

    cover:
      cover,

    location:
      location,

    year:
      year,

    category:
      category,

    description:
      description,

    metadata:
      metadata

  };

}


/* ------------------------------------------------------------
   OBTENER PRIMER VALOR VÁLIDO
   ------------------------------------------------------------ */

function firstValue(
  ...values
) {

  for (
    const value
    of values
  ) {

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {

      return String(value).trim();

    }

  }


  return "";

}


/* ------------------------------------------------------------
   EXTRAER COVER
   ------------------------------------------------------------ */

function extractCover(
  project
) {

  /*
     ----------------------------------------------------------
     PRIORIDAD 1
     ----------------------------------------------------------

     Estructura actual de get-projects:

     cover.url
  */

  if (
    project.cover &&
    typeof project.cover === "object"
  ) {

    const coverUrl =
      firstValue(
        project.cover.url,
        project.cover.signedUrl,
        project.cover.signed_url,
        project.cover.publicUrl,
        project.cover.public_url
      );


    if (coverUrl) {

      return coverUrl;

    }

  }


  /*
     ----------------------------------------------------------
     PRIORIDAD 2
     ----------------------------------------------------------

     Campos directos que get-projects
     puede proporcionar.
  */

  const directCandidates = [

    project.coverUrl,

    project.cover_url,

    project.imageUrl,

    project.image_url,

    project.image,

    project.thumbnailUrl,

    project.thumbnail_url,

    project.thumbnail,

    project.portadaUrl,

    project.portada_url,

    project.portada

  ];


  for (
    const candidate
    of directCandidates
  ) {

    const url =
      extractUrlFromValue(
        candidate
      );


    if (url) {

      return url;

    }

  }


  return "";

}


/* ------------------------------------------------------------
   EXTRAER URL DE UN VALOR
   ------------------------------------------------------------ */

function extractUrlFromValue(
  value
) {

  if (!value) {
    return "";
  }


  /*
     Valor directamente textual.
  */

  if (
    typeof value === "string"
  ) {

    const trimmed =
      value.trim();


    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://")
    ) {

      return trimmed;

    }


    return "";

  }


  /*
     Valor objeto.
  */

  if (
    typeof value === "object"
  ) {

    return firstValue(
      value.url,
      value.signedUrl,
      value.signed_url,
      value.publicUrl,
      value.public_url
    );

  }


  return "";

}


/* ------------------------------------------------------------
   CREAR TARJETA DE PROYECTO
   ------------------------------------------------------------ */

function createProjectCard(
  project,
  index
) {

  const card =
    document.createElement("a");


  card.classList.add(
    "project-card"
  );


  /*
     ----------------------------------------------------------
     DISTRIBUCIÓN VISUAL
     ----------------------------------------------------------
  */

  if (index === 0) {

    card.classList.add(
      "project-card-large"
    );

  } else {

    card.classList.add(
      "project-card-medium"
    );


    if (index === 1) {

      card.classList.add(
        "project-card-left"
      );

    } else {

      card.classList.add(
        "project-card-right"
      );

    }

  }


  /*
     ----------------------------------------------------------
     IDENTIDAD
     ----------------------------------------------------------
  */

  const projectName =
    project.name || "";


  const displayName =
    project.displayName ||
    "Proyecto";


  /*
     ----------------------------------------------------------
     ENLACE
     ----------------------------------------------------------

     Se utiliza exclusivamente el nombre
     interno de la carpeta.
  */

  if (projectName) {

    card.href =
      `./proyectos.html?proyecto=${encodeURIComponent(projectName)}`;

  } else {

    card.href =
      "./proyectos.html";

  }


  card.setAttribute(
    "aria-label",
    `Ver proyecto ${displayName}`
  );


  /* ----------------------------------------------------------
     MEDIA
     ---------------------------------------------------------- */

  const media =
    document.createElement("div");


  media.className =
    "project-card-media protected-media";


  /*
     ----------------------------------------------------------
     IMAGEN
     ----------------------------------------------------------
  */

  const image =
    document.createElement("img");


  image.className =
    "protected-image";


  image.alt =
    displayName;


  image.loading =
    index === 0
      ? "eager"
      : "lazy";


  image.decoding =
    "async";


  image.draggable =
    false;


  /*
     La URL se asigna directamente.

     NO hacemos fetch.
     NO hacemos Blob.
     NO usamos canvas.
     NO modificamos la URL.
  */

  if (project.cover) {

    image.src =
      project.cover;

    image.dataset.source =
      "supabase-cover";

  } else {

    image.classList.add(
      "image-load-failed"
    );

    console.warn(
      `[Baal Studio] El proyecto "${displayName}" no tiene cover.`
    );

  }


  image.addEventListener(
    "load",
    () => {

      console.log(
        `[Baal Studio] Cover cargado: ${displayName}`,
        {
          url:
            image.src,

          width:
            image.naturalWidth,

          height:
            image.naturalHeight
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
        `[Baal Studio] Error cargando cover: ${displayName}`,
        {
          url:
            image.src,

          naturalWidth:
            image.naturalWidth,

          naturalHeight:
            image.naturalHeight
        }
      );


      /*
         MUY IMPORTANTE:

         Un error del cover NO elimina
         ni oculta la información del proyecto.
      */

      image.classList.add(
        "image-load-failed"
      );

    },
    {
      once: true
    }
  );


  media.appendChild(
    image
  );


  /*
     ----------------------------------------------------------
     OVERLAY
     ----------------------------------------------------------
  */

  const overlay =
    document.createElement("div");


  overlay.className =
    "project-card-overlay";


  media.appendChild(
    overlay
  );


  /* ----------------------------------------------------------
     INFORMACIÓN
     ---------------------------------------------------------- */

  const content =
    document.createElement("div");


  content.className =
    "project-card-content";


  /*
     ----------------------------------------------------------
     LOCALIZACIÓN
     ----------------------------------------------------------
  */

  if (project.location) {

    const location =
      document.createElement("p");


    location.className =
      "project-card-location";


    location.textContent =
      project.location;


    content.appendChild(
      location
    );

  }


  /*
     ----------------------------------------------------------
     TÍTULO
     ----------------------------------------------------------
  */

  const title =
    document.createElement("h2");


  title.className =
    "project-card-title";


  title.textContent =
    displayName;


  content.appendChild(
    title
  );


  /*
     ----------------------------------------------------------
     METADATA
     ----------------------------------------------------------

     Año + categoría.
  */

  const meta =
    document.createElement("div");


  meta.className =
    "project-card-meta";


  if (project.year) {

    const year =
      document.createElement("span");


    year.textContent =
      project.year;


    meta.appendChild(
      year
    );

  }


  if (project.category) {

    const category =
      document.createElement("span");


    category.textContent =
      project.category;


    meta.appendChild(
      category
    );

  }


  if (
    meta.children.length > 0
  ) {

    content.appendChild(
      meta
    );

  }


  /*
     ----------------------------------------------------------
     DESCRIPCIÓN
     ----------------------------------------------------------

     Solo se añade si get-projects
     realmente devuelve una descripción.

     No inventamos texto.
  */

  if (project.description) {

    const description =
      document.createElement("p");


    description.className =
      "project-card-description";


    description.textContent =
      project.description;


    content.appendChild(
      description
    );

  }


  /*
     ----------------------------------------------------------
     ORDEN FINAL
     ----------------------------------------------------------

     card
       ├── media
       │    ├── img
       │    └── overlay
       │
       └── content
            ├── location
            ├── title
            ├── metadata
            └── description
  */

  card.appendChild(
    media
  );


  card.appendChild(
    content
  );


  /*
     ----------------------------------------------------------
     INFORMACIÓN DE DEPURACIÓN
     ----------------------------------------------------------
  */

  console.log(
    `[Baal Studio] Tarjeta creada: ${displayName}`,
    {
      name:
        project.name,

      title:
        project.displayName,

      cover:
        project.cover,

      location:
        project.location,

      year:
        project.year,

      category:
        project.category
    }
  );


  return card;

}


/* ------------------------------------------------------------
   MENSAJE DE PROYECTOS
   ------------------------------------------------------------ */

function showProjectsMessage(
  container,
  message
) {

  container.innerHTML = "";


  const element =
    document.createElement("div");


  element.className =
    "project-loading";


  const text =
    document.createElement("p");


  text.textContent =
    message;


  element.appendChild(
    text
  );


  container.appendChild(
    element
  );

}


/* ------------------------------------------------------------
   PROTECCIÓN
   ------------------------------------------------------------ */

function initProtection() {

  document.addEventListener(
    "contextmenu",
    event => {

      const target =
        event.target;


      if (
        target.closest(
          "input, textarea, select, [contenteditable='true'], video, audio, iframe"
        )
      ) {

        return;

      }


      event.preventDefault();

    }
  );


  document.addEventListener(
    "dragstart",
    event => {

      const target =
        event.target;


      if (
        target instanceof HTMLImageElement ||
        target.closest?.(".protected-media")
      ) {

        event.preventDefault();

      }

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      const key =
        event.key.toLowerCase();


      const modifier =
        event.ctrlKey ||
        event.metaKey;


      if (
        modifier &&
        (
          key === "s" ||
          key === "u"
        )
      ) {

        event.preventDefault();

        return;

      }


      if (
        modifier &&
        event.shiftKey &&
        (
          key === "i" ||
          key === "j" ||
          key === "c"
        )
      ) {

        event.preventDefault();

        return;

      }


      if (
        event.key === "F12"
      ) {

        event.preventDefault();

      }

    }
  );


  applyProtectionToImages();

}


/* ------------------------------------------------------------
   PROTECCIÓN DE IMÁGENES
   ------------------------------------------------------------ */

function applyProtectionToImages() {

  document
    .querySelectorAll(
      "img.protected-image"
    )
    .forEach(
      image => {

        image.setAttribute(
          "draggable",
          "false"
        );


        image.style.userSelect =
          "none";


        image.style.webkitUserDrag =
          "none";

      }
    );


  document
    .querySelectorAll(
      ".project-card-media"
    )
    .forEach(
      media => {

        media.classList.add(
          "protected-media"
        );

      }
    );

}
