/* ============================================================
   BAAL STUDIO
   SCRIPT V03
============================================================ */

const SUPABASE_FUNCTIONS =
  "https://hlyzyeatnbulyfiiwvsq.supabase.co/functions/v1";

const SITE_ASSETS_URL =
  `${SUPABASE_FUNCTIONS}/get-site-assets`;

const PROJECTS_URL =
  `${SUPABASE_FUNCTIONS}/get-projects`;


/* ============================================================
   INICIO
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  setupMobileMenu();
  setupProtection();

  loadSiteAssets();
  loadProjects();

});


/* ============================================================
   ASSETS DEL SITIO
============================================================ */

async function loadSiteAssets() {

  try {

    const response =
      await fetch(SITE_ASSETS_URL);

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const result =
      await response.json();

    if (
      !result.success ||
      !result.assets
    ) {
      throw new Error(
        "La función no devolvió los assets."
      );
    }

    const assets =
      result.assets;


    const hero =
      document.getElementById(
        "hero-background"
      );

    if (hero && assets.fondo) {
      hero.src = assets.fondo;
    }


    const headerLogo =
      document.getElementById(
        "header-logo"
      );

    if (
      headerLogo &&
      assets.logoPrincipal
    ) {
      headerLogo.src =
        assets.logoPrincipal;
    }


    const footerLogo =
      document.getElementById(
        "footer-logo-main"
      );

    if (
      footerLogo &&
      assets.logoPrincipal
    ) {
      footerLogo.src =
        assets.logoPrincipal;
    }


    const footerLns =
      document.getElementById(
        "footer-logo-lns"
      );

    if (
      footerLns &&
      assets.logoLNS
    ) {
      footerLns.src =
        assets.logoLNS;
    }


    const qr =
      document.getElementById(
        "footer-qr"
      );

    if (
      qr &&
      assets.qr
    ) {
      qr.src =
        assets.qr;
    }

  } catch (error) {

    console.error(
      "Error cargando assets:",
      error
    );

  }

}


/* ============================================================
   PROYECTOS
============================================================ */

async function loadProjects() {

  const container =
    document.getElementById(
      "projects-grid"
    );

  if (!container) {
    return;
  }


  try {

    const response =
      await fetch(PROJECTS_URL);

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const result =
      await response.json();


    const projects =
      getProjectsArray(result);


    if (!projects.length) {

      container.innerHTML = "";

      return;

    }


    container.innerHTML =
      projects
        .slice(0, 3)
        .map(
          (project, index) =>
            renderProject(
              project,
              index
            )
        )
        .join("");


    setupProjectProtection(container);

  } catch (error) {

    console.error(
      "Error cargando proyectos:",
      error
    );

    container.innerHTML = "";

  }

}


/* ============================================================
   NORMALIZAR RESPUESTA
============================================================ */

function getProjectsArray(result) {

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.projects)) {
    return result.projects;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.results)) {
    return result.results;
  }

  return [];

}


/* ============================================================
   PROYECTO
============================================================ */

function renderProject(
  project,
  index
) {

  const metadata =
    project.metadata || {};


  /*
    IMPORTANTE:
    el nombre de la carpeta NO se utiliza
    como título editorial.

    La función get-projects ya devuelve:

    metadata.titulo =
    "Epigrafías árabes de Granada."
  */

  let title =
    metadata.titulo ||
    metadata.title ||
    project.titulo ||
    project.title ||
    cleanFolderName(
      project.name ||
      project.folder ||
      ""
    );


  title =
    String(title)
      .replace(/\.\s*$/, "")
      .trim();


  const folder =
    project.name ||
    project.folder ||
    project.folderName ||
    "";


  const cover =
    getCover(project);


  const type =
    metadata.categoria ||
    project.category ||
    project.categoria ||
    "Documentación patrimonial";


  let cardClass =
    "project-card ";


  if (index === 0) {

    cardClass +=
      "featured";

  } else if (index === 1) {

    cardClass +=
      "secondary-large";

  } else {

    cardClass +=
      "secondary-small";

  }


  const image =
    cover
      ? `
        <img
          class="project-card-image protected-image"
          src="${escapeAttribute(cover)}"
          alt="${escapeAttribute(title)}"
          draggable="false"
        >
      `
      : "";


  return `
    <a
      class="${cardClass}"
      href="proyectos.html?proyecto=${encodeURIComponent(folder)}"
    >

      ${image}

      <div class="project-card-overlay"></div>

      <div class="project-card-content">

        <div class="project-card-type">
          ${escapeHTML(type)}
        </div>

        <h2 class="project-card-title">
          ${escapeHTML(title)}
        </h2>

      </div>

    </a>
  `;

}


/* ============================================================
   OBTENER PORTADA
============================================================ */

function getCover(project) {

  const fields = [
    "cover",
    "coverUrl",
    "cover_url",
    "coverURL",
    "image",
    "imageUrl",
    "image_url",
    "thumbnail",
    "thumbnailUrl",
    "thumbnail_url",
    "portada",
    "portadaUrl",
    "portada_url"
  ];


  for (const field of fields) {

    if (
      typeof project[field] ===
      "string" &&
      project[field].trim()
    ) {

      return project[field];

    }

  }


  if (project.metadata) {

    for (const field of fields) {

      if (
        typeof project.metadata[field] ===
        "string" &&
        project.metadata[field].trim()
      ) {

        return project.metadata[field];

      }

    }

  }


  /*
    Si get-projects entrega la portada
    dentro de resources, blocks u otra
    estructura, la buscamos sin modificar
    el resto de la respuesta.
  */

  return findImage(
    project.resources
  ) ||
  findImage(
    project.blocks
  ) ||
  findImage(
    project
  );

}


/* ============================================================
   BUSCAR URL DE IMAGEN
============================================================ */

function findImage(value) {

  if (
    !value ||
    typeof value !== "object"
  ) {
    return "";
  }


  if (Array.isArray(value)) {

    for (const item of value) {

      const result =
        findImage(item);

      if (result) {
        return result;
      }

    }

    return "";

  }


  for (const key of Object.keys(value)) {

    const current =
      value[key];


    if (
      typeof current ===
      "string"
    ) {

      const lower =
        current.toLowerCase();


      if (
        (
          lower.includes(".jpg") ||
          lower.includes(".jpeg") ||
          lower.includes(".png") ||
          lower.includes(".webp")
        ) &&
        (
          lower.startsWith("http://") ||
          lower.startsWith("https://")
        )
      ) {

        return current;

      }

    }


    if (
      current &&
      typeof current === "object"
    ) {

      const result =
        findImage(current);

      if (result) {
        return result;
      }

    }

  }


  return "";

}


/* ============================================================
   LIMPIAR NOMBRE DE CARPETA
============================================================ */

function cleanFolderName(name) {

  return String(name || "")
    .replace(/\s*\(\d+\)\s*$/, "")
    .trim();

}


/* ============================================================
   MENÚ MÓVIL
============================================================ */

function setupMobileMenu() {

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


  button.addEventListener(
    "click",
    () => {

      menu.classList.toggle(
        "open"
      );

    }
  );


  menu
    .querySelectorAll("a")
    .forEach(link => {

      link.addEventListener(
        "click",
        () => {

          menu.classList.remove(
            "open"
          );

        }
      );

    });

}


/* ============================================================
   PROTECCIÓN
============================================================ */

function setupProtection() {

  document.addEventListener(
    "contextmenu",
    event => {

      const target =
        event.target;


      if (
        target.closest(
          "input, textarea, select, video, iframe, button"
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

      if (
        event.target.tagName ===
        "IMG"
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


      if (
        (event.ctrlKey ||
         event.metaKey) &&
        ["s", "u"].includes(key)
      ) {

        event.preventDefault();

      }


      if (
        event.key === "F12"
      ) {

        event.preventDefault();

      }


      if (
        (event.ctrlKey ||
         event.metaKey) &&
        event.shiftKey &&
        ["i", "j", "c"].includes(key)
      ) {

        event.preventDefault();

      }

    }
  );

}


/* ============================================================
   PROTECCIÓN DE IMÁGENES DINÁMICAS
============================================================ */

function setupProjectProtection(
  container
) {

  container
    .querySelectorAll("img")
    .forEach(image => {

      image.classList.add(
        "protected-image"
      );

      image.setAttribute(
        "draggable",
        "false"
      );

      image.addEventListener(
        "dragstart",
        event => {
          event.preventDefault();
        }
      );

    });

}


/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHTML(value) {

  return String(
    value ?? ""
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


function escapeAttribute(value) {

  return escapeHTML(value);

}
