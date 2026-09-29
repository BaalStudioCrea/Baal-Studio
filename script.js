/* ============================================================
   BAAL STUDIO
   MAIN JAVASCRIPT
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
    document.getElementById("mobile-menu-button");

  const menu =
    document.getElementById("mobile-menu");


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


  menu.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {

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

    });

  });

}


/* ------------------------------------------------------------
   ASSETS DEL SITIO
   ------------------------------------------------------------ */

async function loadSiteAssets() {

  try {

    const response =
      await fetch(FUNCTIONS.siteAssets, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });


    if (!response.ok) {

      throw new Error(
        `get-site-assets respondió ${response.status}`
      );

    }


    const result =
      await response.json();


    if (!result.success || !result.assets) {

      throw new Error(
        "La función get-site-assets no devolvió assets válidos."
      );

    }


    const assets =
      result.assets;


    /*
       Fondo principal
    */

    const hero =
      document.getElementById("hero-background");


    if (hero && assets.fondo) {

      hero.src = assets.fondo;

    }


    /*
       Logo principal
    */

    const headerLogo =
      document.getElementById("site-logo");


    if (headerLogo && assets.logoPrincipal) {

      headerLogo.src =
        assets.logoPrincipal;

    }


    /*
       Logo del footer
    */

    const footerLogo =
      document.getElementById("footer-logo");


    if (footerLogo && assets.logoPrincipal) {

      footerLogo.src =
        assets.logoPrincipal;

    }


    /*
       Segundo logo
    */

    const lnsLogo =
      document.getElementById("footer-logo-lns");


    if (lnsLogo && assets.logoLNS) {

      lnsLogo.src =
        assets.logoLNS;

    }


    /*
       Segundo logo Baal
    */

    const baalFooterLogo =
      document.getElementById("footer-logo-baal");


    if (
      baalFooterLogo &&
      assets.logoPrincipal
    ) {

      baalFooterLogo.src =
        assets.logoPrincipal;

    }


    /*
       QR
    */

    const qr =
      document.getElementById("footer-qr");


    if (qr && assets.qr) {

      qr.src =
        assets.qr;

    }


    /*
       Activamos la protección una vez
       cargadas las imágenes.
    */

    applyProtectionToImages();


  } catch (error) {

    console.error(
      "Error cargando los assets del sitio:",
      error
    );

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
      await fetch(FUNCTIONS.projects, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });


    if (!response.ok) {

      throw new Error(
        `get-projects respondió ${response.status}`
      );

    }


    const result =
      await response.json();


    const projects =
      normalizeProjectsResponse(result);


    if (!projects.length) {

      showProjectsMessage(
        container,
        "No hay proyectos disponibles."
      );

      return;
    }


    /*
       Ordenamos por el campo order cuando existe.
    */

    projects.sort(
      (a, b) =>
        Number(a.order || 999) -
        Number(b.order || 999)
    );


    /*
       Tomamos los tres primeros para
       la portada.
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
   NORMALIZACIÓN DE RESPUESTA
   ------------------------------------------------------------ */

function normalizeProjectsResponse(result) {

  if (!result) {
    return [];
  }


  /*
     Admitimos varias estructuras para que la
     interfaz no dependa de una única envoltura JSON.
  */

  let projects = [];


  if (Array.isArray(result)) {

    projects = result;

  } else if (Array.isArray(result.projects)) {

    projects = result.projects;

  } else if (Array.isArray(result.data)) {

    projects = result.data;

  } else if (Array.isArray(result.results)) {

    projects = result.results;

  }


  return projects
    .map(normalizeProject)
    .filter(Boolean);

}


/* ------------------------------------------------------------
   NORMALIZAR PROYECTO
   ------------------------------------------------------------ */

function normalizeProject(project) {

  if (!project || typeof project !== "object") {
    return null;
  }


  const name =
    project.name ||
    project.title ||
    project.nombre ||
    project.titulo ||
    project.projectName ||
    "";


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

    name,
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

function extractCover(project) {

  const candidates = [

    project.cover,

    project.coverUrl,

    project.cover_url,

    project.coverURL,

    project.image,

    project.imageUrl,

    project.image_url,

    project.thumbnail,

    project.thumbnailUrl,

    project.thumbnail_url

  ];


  for (const candidate of candidates) {

    if (!candidate) {
      continue;
    }


    if (typeof candidate === "string") {

      return candidate;

    }


    if (
      typeof candidate === "object"
    ) {

      if (candidate.url) {
        return candidate.url;
      }

      if (candidate.signedUrl) {
        return candidate.signedUrl;
      }

      if (candidate.signed_url) {
        return candidate.signed_url;
      }

    }

  }


  return "";

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


  /*
     Enlazamos con proyectos.html.

     El nombre se pasa como parámetro para que
     posteriormente proyectos.html pueda abrir
     directamente el proyecto correspondiente.
  */

  const projectName =
    project.name || "";


  card.href =
    `./proyectos.html?proyecto=${encodeURIComponent(projectName)}`;


  card.setAttribute(
    "aria-label",
    `Ver proyecto ${projectName}`
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
    projectName;


  image.loading =
    index === 0
      ? "eager"
      : "lazy";


  image.decoding =
    "async";


  image.draggable =
    false;


  if (project.cover) {

    image.src =
      project.cover;

  }


  media.appendChild(image);


  /*
     OVERLAY
  */

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
    projectName;


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


  if (meta.children.length) {

    content.appendChild(meta);

  }


  card.appendChild(media);

  card.appendChild(content);


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


  const messageElement =
    document.createElement("div");


  messageElement.className =
    "project-loading";


  messageElement.innerHTML =
    `<p>${escapeHtml(message)}</p>`;


  container.appendChild(
    messageElement
  );

}


/* ------------------------------------------------------------
   ESCAPAR HTML
   ------------------------------------------------------------ */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* ------------------------------------------------------------
   PROTECCIÓN GENERAL
   ------------------------------------------------------------ */

function initProtection() {


  /*
     Evitar menú contextual sobre el sitio.

     Se mantienen operativos:
     - formularios
     - inputs
     - textareas
     - selects
     - contenido editable
     - vídeo
     - audio
     - iframes
  */

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


  /*
     Evitar arrastre de imágenes.
  */

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


  /*
     Atajos habituales de guardado,
     código fuente y herramientas.
  */

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


      if (event.key === "F12") {

        event.preventDefault();

      }

    }
  );


  applyProtectionToImages();

}


/* ------------------------------------------------------------
   APLICAR PROTECCIÓN A IMÁGENES
   ------------------------------------------------------------ */

function applyProtectionToImages() {

  document
    .querySelectorAll(
      "img.protected-image"
    )
    .forEach(image => {

      image.setAttribute(
        "draggable",
        "false"
      );


      image.style.userSelect =
        "none";


      image.style.webkitUserDrag =
        "none";

    });


  /*
     Aseguramos que los contenedores de
     proyecto tengan la clase correspondiente.
  */

  document
    .querySelectorAll(
      ".project-card-media"
    )
    .forEach(media => {

      media.classList.add(
        "protected-media"
      );

    });

}
