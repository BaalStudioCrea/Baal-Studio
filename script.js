/* ============================================================
   BAAL STUDIO
   SCRIPT.JS — V04
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
      "header-logo",
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


    const qrLink =
      document.getElementById(
        "footer-qr-link"
      );


    const qr =
      document.getElementById(
        "footer-qr"
      );


    if (qr && assets.qr) {

      qr.src =
        assets.qr;

    }


    if (qrLink && assets.qr) {

      qrLink.href =
        "https://linktr.ee/baalstudio";

    }


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
     El título visible debe proceder preferentemente
     del contenido estructurado del proyecto.txt.

     Se aceptan las variantes que ya utiliza
     nuestra función de proyectos.
  */

  const metadataTitle =
    project?.metadata?.titulo ||
    project?.metadata?.title ||
    project?.metadata?.nombre ||
    project?.metadata?.name ||
    project?.txt?.titulo ||
    project?.txt?.title ||
    project?.content?.titulo ||
    project?.content?.title ||
    "";


  /*
     Si no existe título en los metadatos,
     utilizamos el nombre de carpeta como respaldo,
     pero eliminamos siempre el sufijo de orden.

     Ejemplo:

     Epigrafias arabes de Granada (01)

     se muestra como:

     Epigrafias arabes de Granada
  */

  const displayName =
    String(metadataTitle || rawName)
      .replace(
        /\s*\(\s*\d+\s*\)\s*$/,
        ""
      )
      .replace(
        /\s*[.!?]+\s*$/,
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

  if (!project) {
    return "";
  }


  if (
    typeof project.cover === "string" &&
    project.cover
  ) {

    return project.cover;

  }


  if (
    typeof project.coverUrl === "string" &&
    project.coverUrl
  ) {

    return project.coverUrl;

  }


  if (
    typeof project.cover_url === "string" &&
    project.cover_url
  ) {

    return project.cover_url;

  }


  if (
    project.resources &&
    typeof project.resources === "object"
  ) {

    if (
      typeof project.resources.cover === "string"
    ) {

      return project.resources.cover;

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

  if (!project) {
    return null;
  }


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
    projectName
      .replace(
        /\s*\(\s*\d+\s*\)\s*$/,
        ""
      )
      .trim();


  /*
     El nombre de carpeta sigue siendo la identidad
     interna para localizar el proyecto.

     El título visible es displayName.
  */

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


  if (project.cover) {

    image.src =
      project.cover;

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


  if (meta.children.length) {

    content.appendChild(meta);

  }


  card.appendChild(media);

  card.appendChild(content);


  return card;

}


/* ------------------------------------------------------------
   MENSAJES DE PROYECTOS
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


  element.innerHTML =
    `
      <p>${message}</p>
    `;


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

      if (
        event.target.closest(
          ".protected-image, .protected-media"
        )
      ) {

        event.preventDefault();

      }

    }
  );


  document.addEventListener(
    "dragstart",
    event => {

      if (
        event.target.closest(
          ".protected-image"
        )
      ) {

        event.preventDefault();

      }

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      const target =
        event.target;


      if (
        target &&
        target.closest &&
        target.closest(
          ".protected-image, .protected-media"
        )
      ) {

        if (
          event.key === "s" &&
          (event.ctrlKey || event.metaKey)
        ) {

          event.preventDefault();

        }

      }

    }
  );

}


function applyProtectionToImages() {

  document
    .querySelectorAll(
      "img"
    )
    .forEach(
      image => {

        image.classList.add(
          "protected-image"
        );

        image.draggable =
          false;

      }
    );

}
