/* ============================================================
   BAAL STUDIO
   SCRIPT.JS — RECOVERY V08
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
    `${SUPABASE_FUNCTION_BASE}/list-projects`

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
   ASSETS GENERALES
   ------------------------------------------------------------ */

async function loadSiteAssets() {

  try {

    console.log(
      "[Baal Studio] Cargando assets..."
    );


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


    console.log(
      "[Baal Studio] Respuesta get-site-assets:",
      result
    );


    if (
      !result ||
      result.success !== true ||
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


    console.log(
      "[Baal Studio] Assets cargados correctamente."
    );


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


  if (!element) {

    console.warn(
      `[Baal Studio] No existe el elemento #${elementId}`
    );

    return;

  }


  if (!source) {

    console.warn(
      `[Baal Studio] No hay URL para #${elementId}`
    );

    return;

  }


  element.src =
    source;


  console.log(
    `[Baal Studio] Imagen asignada: #${elementId}`
  );

}


/* ------------------------------------------------------------
   PROYECTOS
   ------------------------------------------------------------ */

async function loadSelectedProjects() {

  const container =
    document.getElementById(
      "selected-projects-grid"
    );


  if (!container) {

    console.warn(
      "[Baal Studio] No existe #selected-projects-grid"
    );

    return;

  }


  try {

    console.log(
      "[Baal Studio] Cargando proyectos..."
    );


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
        `list-projects respondió ${response.status}`
      );

    }


    const result =
      await response.json();


    console.log(
      "[Baal Studio] Respuesta list-projects:",
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


    console.log(
      "[Baal Studio] Proyectos cargados correctamente."
    );


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
   NORMALIZAR RESPUESTA
   ------------------------------------------------------------ */

function normalizeProjectsResponse(
  result
) {

  if (!result) {
    return [];
  }


  let projects = [];


  if (Array.isArray(result)) {

    projects =
      result;

  } else if (
    Array.isArray(result.projects)
  ) {

    projects =
      result.projects;

  } else if (
    Array.isArray(result.data)
  ) {

    projects =
      result.data;

  } else if (
    Array.isArray(result.results)
  ) {

    projects =
      result.results;

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
     NOMBRE DE CARPETA / IDENTIFICADOR
  */

  const rawName =
    project.name ||
    project.projectName ||
    project.nombre ||
    project.title ||
    project.titulo ||
    "";


  /*
     METADATA
  */

  let metadata =
    project.metadata ||
    null;


  if (
    typeof metadata === "string"
  ) {

    try {

      metadata =
        JSON.parse(metadata);

    } catch (error) {

      metadata =
        null;

    }

  }


  /*
     TÍTULO VISIBLE

     Primero utilizamos los campos que
     list-projects ya devuelve directamente.
  */

  const titleFromResponse =
    project.titulo ||
    project.title ||
    "";


  const titleFromMetadata =
    metadata?.titulo ||
    metadata?.title ||
    metadata?.nombre ||
    metadata?.name ||
    "";


  const fallbackName =
    String(rawName)
      .replace(
        /\s*\(\d+\)\s*$/i,
        ""
      )
      .trim();


  const displayName =
    String(
      titleFromResponse ||
      titleFromMetadata ||
      fallbackName
    )
      .replace(
        /\s*[.!?]+\s*$/,
        ""
      )
      .trim();


  /*
     ORDEN
  */

  const order =
    project.order ??
    project.orden ??
    project.position ??
    999;


  /*
     COVER
  */

  const cover =
    extractCover(project);


  /*
     LOCALIZACIÓN
  */

  const location =
    project.location ||
    project.localizacion ||
    project.ubicacion ||
    project.place ||
    metadata?.location ||
    metadata?.localizacion ||
    "";


  /*
     AÑO
  */

  const year =
    project.year ||
    project.año ||
    project.ano ||
    metadata?.year ||
    metadata?.año ||
    metadata?.ano ||
    "";


  /*
     CATEGORÍA
  */

  const rawCategory =
    project.category ||
    project.categoria ||
    metadata?.category ||
    metadata?.categoria ||
    "";


  const category =
    Array.isArray(rawCategory)
      ? rawCategory
          .slice(0, 2)
          .join(", ")
      : String(rawCategory);


  return {

    ...project,

    metadata,

    name:
      rawName,

    displayName,

    order,

    cover,

    location,

    year,

    category

  };

}


/* ------------------------------------------------------------
   EXTRAER COVER
   ------------------------------------------------------------ */

function extractCover(
  project
) {

  if (
    !project ||
    typeof project !== "object"
  ) {

    return "";

  }


  /*
     CASO PRINCIPAL DE list-projects:

     cover: {
       file: "cover.webp",
       path: "...",
       url: "..."
     }
  */

  if (
    project.cover &&
    typeof project.cover === "object"
  ) {

    const coverUrl =
      project.cover.url ||
      project.cover.signedUrl ||
      project.cover.signed_url ||
      project.cover.publicUrl ||
      project.cover.public_url ||
      "";


    if (coverUrl) {

      return coverUrl;

    }

  }


  /*
     COVER COMO STRING
  */

  if (
    typeof project.cover === "string" &&
    project.cover.length > 0
  ) {

    return project.cover;

  }


  /*
     OTROS CAMPOS POSIBLES
  */

  const candidates = [

    project.coverUrl,

    project.cover_url,

    project.coverURL,

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
    of candidates
  ) {

    const url =
      extractUrlFromValue(
        candidate
      );


    if (url) {

      return url;

    }

  }


  /*
     ÚLTIMO RECURSO
  */

  return findImageUrl(
    project
  );

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


  if (
    typeof value === "string"
  ) {

    return value;

  }


  if (
    typeof value === "object"
  ) {

    return (
      value.url ||
      value.signedUrl ||
      value.signed_url ||
      value.publicUrl ||
      value.public_url ||
      ""
    );

  }


  return "";

}


/* ------------------------------------------------------------
   BUSCAR IMAGEN RECURSIVAMENTE
   ------------------------------------------------------------ */

function findImageUrl(
  value,
  depth = 0
) {

  if (
    !value ||
    depth > 5
  ) {

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


  const priorityKeys = [

    "cover",
    "coverUrl",
    "cover_url",
    "image",
    "imageUrl",
    "image_url",
    "thumbnail",
    "thumbnailUrl",
    "thumbnail_url",
    "portada",
    "portadaUrl",
    "portada_url",
    "url",
    "signedUrl",
    "signed_url"

  ];


  for (
    const key
    of priorityKeys
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
    const key
    of Object.keys(value)
  ) {

    if (
      priorityKeys.includes(key)
    ) {

      continue;

    }


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


  const projectName =
    project.name ||
    "";


  const displayName =
    project.displayName ||
    projectName;


  card.href =
    `./proyectos.html?proyecto=${encodeURIComponent(projectName)}`;


  card.setAttribute(
    "aria-label",
    `Ver proyecto ${displayName}`
  );


  /*
     MEDIA
  */

  const media =
    document.createElement("div");


  media.className =
    "project-card-media protected-media";


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
     ASIGNACIÓN DEL COVER

     No se modifica ni se transforma
     la URL que devuelve Supabase.
  */

  if (project.cover) {

    image.src =
      project.cover;


    image.dataset.source =
      "supabase-cover";


    console.log(
      `[Baal Studio] Cover asignado: ${displayName}`,
      project.cover
    );

  } else {

    console.warn(
      `[Baal Studio] El proyecto no tiene cover: ${displayName}`
    );

  }


  image.addEventListener(
    "load",
    () => {

      console.log(
        `[Baal Studio] Cover cargado: ${displayName}`,
        {
          naturalWidth:
            image.naturalWidth,

          naturalHeight:
            image.naturalHeight
        }
      );

    }
  );


  image.addEventListener(
    "error",
    () => {

      console.error(
        `[Baal Studio] ERROR cargando cover: ${displayName}`,
        {
          url:
            image.src,

          naturalWidth:
            image.naturalWidth,

          naturalHeight:
            image.naturalHeight
        }
      );

    }
  );


  media.appendChild(
    image
  );


  const overlay =
    document.createElement("div");


  overlay.className =
    "project-card-overlay";


  media.appendChild(
    overlay
  );


  /*
     CONTENIDO
  */

  const content =
    document.createElement("div");


  content.className =
    "project-card-content";


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
     METADATA
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


  card.appendChild(
    media
  );


  card.appendChild(
    content
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

  container.innerHTML =
    "";


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
