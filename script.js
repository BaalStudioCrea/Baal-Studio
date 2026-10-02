/* ============================================================
   BAAL STUDIO
   SCRIPT.JS — V09
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
   ASSETS
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
      "Error cargando assets:",
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
    source
  ) {

    element.src =
      source;

  }

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


    const projects =
      normalizeProjectsResponse(
        result
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


  } catch (error) {

    console.error(
      "Error cargando proyectos:",
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


  const rawName =
    project.name ||
    project.title ||
    project.nombre ||
    project.titulo ||
    project.projectName ||
    "";


  /*
     Eliminamos solamente el sufijo de orden
     de la carpeta:

     "Epigrafias arabes de Granada (01)"
     →
     "Epigrafias arabes de Granada"
  */

  const displayName =
    String(rawName)
      .replace(
        /\s*\(\d+\)\s*$/,
        ""
      )
      .trim();


  const order =
    project.order ??
    project.orden ??
    project.position ??
    999;


  const cover =
    extractCover(project);


  const location =
    project.location ||
    project.localizacion ||
    project.ubicacion ||
    project.place ||
    "";


  const year =
    project.year ||
    project.año ||
    project.ano ||
    "";


  const category =
    project.category ||
    project.categoria ||
    project.type ||
    project.tipo ||
    "";


  return {

    ...project,

    name: rawName,

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

  const directCandidates = [

    project.cover,

    project.coverUrl,

    project.cover_url,

    project.coverURL,

    project.image,

    project.imageUrl,

    project.image_url,

    project.thumbnail,

    project.thumbnailUrl,

    project.thumbnail_url,

    project.portada,

    project.portadaUrl,

    project.portada_url

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


  /*
     Si el cover está dentro de otra
     propiedad del objeto, buscamos
     recursivamente una URL de imagen.
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

    return isImageUrl(value)
      ? value
      : "";

  }


  if (
    typeof value === "object"
  ) {

    const candidates = [

      value.url,

      value.signedUrl,

      value.signed_url,

      value.publicUrl,

      value.public_url

    ];


    for (
      const candidate
      of candidates
    ) {

      if (
        typeof candidate === "string" &&
        candidate.length > 0
      ) {

        return candidate;

      }

    }

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

  /*
     Evitamos recorrer objetos indefinidamente.
  */

  if (
    !value ||
    depth > 5
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


  /*
     Primero comprobamos claves con
     mayor probabilidad de contener covers.
  */

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


  /*
     Después recorremos el resto.
  */

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
   COMPROBAR URL DE IMAGEN
   ------------------------------------------------------------ */

function isImageUrl(
  value
) {

  if (
    typeof value !== "string"
  ) {

    return false;

  }


  const clean =
    value
      .split("?")[0]
      .toLowerCase();


  return (

    clean.includes(".jpg") ||
    clean.includes(".jpeg") ||
    clean.includes(".png") ||
    clean.includes(".webp") ||
    clean.includes(".avif") ||
    clean.includes(".gif")

  );

}


/* ------------------------------------------------------------
   CREAR TARJETA
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
    project.name || "";


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
     CARGA DEL COVER

     Se hace mediante una función específica
     para poder detectar si el navegador
     realmente consigue decodificar el archivo.
  */

  if (project.cover) {

    loadProjectCover(
      image,
      project.cover,
      displayName
    );

  } else {

    image.classList.add(
      "image-load-failed"
    );

  }


  media.appendChild(image);


  const overlay =
    document.createElement("div");


  overlay.className =
    "project-card-overlay";


  media.appendChild(overlay);


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


    content.appendChild(location);

  }


  const title =
    document.createElement("h2");


  title.className =
    "project-card-title";


  title.textContent =
    displayName;


  content.appendChild(title);


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


    meta.appendChild(year);

  }


  if (project.category) {

    const category =
      document.createElement("span");


    category.textContent =
      project.category;


    meta.appendChild(category);

  }


  if (
    meta.children.length
  ) {

    content.appendChild(meta);

  }


  card.appendChild(media);

  card.appendChild(content);


  return card;

}


/* ------------------------------------------------------------
   CARGA ROBUSTA DEL COVER
   ------------------------------------------------------------ */

function loadProjectCover(
  image,
  url,
  displayName
) {

  if (
    !image ||
    !url
  ) {

    return;

  }


  image.dataset.source =
    "supabase-cover";


  image.dataset.coverUrl =
    url;


  let reported =
    false;


  const reportFailure =
    (reason) => {

      if (reported) {
        return;
      }


      reported =
        true;


      console.error(
        `[Baal Studio] ERROR cargando cover: ${displayName}`,
        {
          reason,
          url,
          naturalWidth:
            image.naturalWidth,
          naturalHeight:
            image.naturalHeight,
          complete:
            image.complete
        }
      );


      image.classList.add(
        "image-load-failed"
      );


      image.removeAttribute(
        "src"
      );


      image.setAttribute(
        "data-image-error",
        "No se ha podido decodificar la imagen recibida."
      );

    };


  image.addEventListener(
    "load",
    () => {

      if (
        image.naturalWidth > 0 &&
        image.naturalHeight > 0
      ) {

        image.classList.remove(
          "image-load-failed"
        );


        console.log(
          `[Baal Studio] Cover cargado correctamente: ${displayName}`,
          {
            width:
              image.naturalWidth,
            height:
              image.naturalHeight
          }
        );


        return;

      }


      reportFailure(
        "El navegador recibió la respuesta pero naturalWidth/naturalHeight son 0."
      );

    },
    {
      once: true
    }
  );


  image.addEventListener(
    "error",
    () => {

      reportFailure(
        "El navegador no ha podido decodificar la respuesta como imagen."
      );

    },
    {
      once: true
    }
  );


  image.src =
    url;

}


/* ------------------------------------------------------------
   DIAGNÓSTICO DEL COVER
   ------------------------------------------------------------ */

async function diagnoseProjectCover(
  url,
  displayName = "cover"
) {

  if (!url) {

    console.error(
      "[Baal Studio] No existe URL para diagnosticar el cover."
    );

    return;

  }


  try {

    const response =
      await fetch(
        url,
        {
          method: "GET",
          cache: "no-store"
        }
      );


    const contentType =
      response.headers.get(
        "content-type"
      );


    const contentLength =
      response.headers.get(
        "content-length"
      );


    const buffer =
      await response.arrayBuffer();


    const bytes =
      new Uint8Array(
        buffer.slice(0, 16)
      );


    const ascii =
      Array.from(bytes)
        .map(
          byte =>
            byte >= 32 && byte <= 126
              ? String.fromCharCode(byte)
              : "."
        )
        .join("");


    console.group(
      `[Baal Studio] Diagnóstico cover — ${displayName}`
    );


    console.log(
      "HTTP:",
      response.status,
      response.ok
    );


    console.log(
      "Content-Type:",
      contentType
    );


    console.log(
      "Content-Length:",
      contentLength
    );


    console.log(
      "Tamaño recibido:",
      buffer.byteLength,
      "bytes"
    );


    console.log(
      "Primeros bytes:",
      Array.from(bytes)
    );


    console.log(
      "Cabecera ASCII:",
      ascii
    );


    console.groupEnd();


  } catch (error) {

    console.error(
      `[Baal Studio] No se pudo diagnosticar el cover: ${displayName}`,
      error
    );

  }

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


  element.appendChild(text);


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
