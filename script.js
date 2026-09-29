/* ============================================================
   BAAL STUDIO
   SCRIPT V03
   BASE: V02
============================================================ */

const SUPABASE_FUNCTIONS =
  "https://hlyzyeatnbulyfiiwvsq.supabase.co/functions/v1";

const GET_SITE_ASSETS =
  `${SUPABASE_FUNCTIONS}/get-site-assets`;

const GET_PROJECTS =
  `${SUPABASE_FUNCTIONS}/get-projects`;


/* ============================================================
   DOM READY
============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

  setupMobileMenu();
  setupProtection();

  await loadSiteAssets();
  await loadProjects();

});


/* ============================================================
   SITE ASSETS
============================================================ */

async function loadSiteAssets() {

  try {

    const response = await fetch(GET_SITE_ASSETS);

    if (!response.ok) {
      throw new Error(
        `get-site-assets respondió con HTTP ${response.status}`
      );
    }

    const result = await response.json();

    if (!result.success || !result.assets) {
      throw new Error("No se recibieron los assets del sitio.");
    }

    const assets = result.assets;


    const hero =
      document.getElementById("hero-background");

    if (hero && assets.fondo) {
      hero.src = assets.fondo;
    }


    const headerLogo =
      document.getElementById("header-logo");

    if (headerLogo && assets.logoPrincipal) {
      headerLogo.src = assets.logoPrincipal;
    }


    const footerLogoMain =
      document.getElementById("footer-logo-main");

    if (footerLogoMain && assets.logoPrincipal) {
      footerLogoMain.src = assets.logoPrincipal;
    }


    const footerLogoLNS =
      document.getElementById("footer-logo-lns");

    if (footerLogoLNS && assets.logoLNS) {
      footerLogoLNS.src = assets.logoLNS;
    }


    const footerQR =
      document.getElementById("footer-qr");

    if (footerQR && assets.qr) {
      footerQR.src = assets.qr;
    }

  } catch (error) {

    console.error(
      "Error cargando los recursos del sitio:",
      error
    );

  }

}


/* ============================================================
   PROJECTS
============================================================ */

async function loadProjects() {

  const container =
    document.getElementById("projects-grid");

  if (!container) {
    return;
  }


  try {

    const response =
      await fetch(GET_PROJECTS);

    if (!response.ok) {
      throw new Error(
        `get-projects respondió con HTTP ${response.status}`
      );
    }


    const result =
      await response.json();


    const projects =
      normalizeProjectsResponse(result);


    if (!projects.length) {

      container.innerHTML = `
        <div class="projects-loading">
          No hay proyectos disponibles.
        </div>
      `;

      return;
    }


    /*
      La V02 ya utiliza el primer proyecto como
      proyecto destacado.
    */

    const visibleProjects =
      projects.slice(0, 3);


    container.innerHTML =
      visibleProjects
        .map((project, index) =>
          createProjectCard(project, index)
        )
        .join("");


    applyImageProtection(container);

  } catch (error) {

    console.error(
      "Error cargando proyectos:",
      error
    );

    container.innerHTML = `
      <div class="projects-loading">
        No se han podido cargar los proyectos.
      </div>
    `;

  }

}


/* ============================================================
   NORMALIZE RESPONSE
============================================================ */

function normalizeProjectsResponse(result) {

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
   CREATE PROJECT CARD
============================================================ */

function createProjectCard(project, index) {

  const folderName =
    project.name ||
    project.folder ||
    project.folderName ||
    project.project ||
    "";


  /*
    CAMBIO V03:
    El título visible procede de metadata.titulo.

    No utilizamos el nombre de carpeta para generar
    artificialmente las tildes.
  */

  const metadata =
    project.metadata || {};


  let visibleTitle =
    metadata.titulo ||
    project.titulo ||
    project.title ||
    project.projectTitle ||
    project.project_title ||
    project.displayName ||
    project.display_name ||
    project.nombre ||
    cleanFolderName(folderName);


  /*
    Eliminamos únicamente el punto final si el texto
    de proyecto.txt lo contiene.
  */

  visibleTitle =
    String(visibleTitle)
      .replace(/\.$/, "")
      .trim();


  const cover =
    extractCover(project);


  const description =
    metadata.descripcion ||
    metadata.description ||
    project.description ||
    project.descripcion ||
    project.summary ||
    "";


  const type =
    metadata.tipo ||
    project.type ||
    project.tipo ||
    "DOCUMENTACIÓN PATRIMONIAL";


  const encodedFolder =
    encodeURIComponent(folderName);


  const isFeatured =
    index === 0;


  const cardClass =
    isFeatured
      ? "project-card featured"
      : "project-card secondary";


  const titleClass =
    isFeatured
      ? "project-card-title"
      : "project-card-title project-card-title-small";


  const imageHTML =
    cover
      ? `
        <img
          class="project-card-image protected-image"
          src="${escapeAttribute(cover)}"
          alt="${escapeAttribute(visibleTitle)}"
          draggable="false"
        >
      `
      : "";


  return `
    <a
      href="./proyectos.html?proyecto=${encodedFolder}"
      class="${cardClass}"
    >

      ${imageHTML}

      <div class="project-card-overlay"></div>

      <div class="project-card-content">

        <div class="project-card-type">
          ${escapeHTML(type)}
        </div>

        <h3 class="${titleClass}">
          ${escapeHTML(visibleTitle)}
        </h3>

        ${
          description
            ? `
              <p class="project-card-description">
                ${escapeHTML(description)}
              </p>
            `
            : ""
        }

      </div>

    </a>
  `;

}


/* ============================================================
   COVER
============================================================ */

function extractCover(project) {

  const directFields = [
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


  for (const field of directFields) {

    if (
      typeof project[field] === "string" &&
      project[field].trim() !== ""
    ) {

      return project[field];

    }

  }


  /*
    También comprobamos metadata por si la función
    devuelve allí la portada.
  */

  if (project.metadata) {

    for (const field of directFields) {

      if (
        typeof project.metadata[field] === "string" &&
        project.metadata[field].trim() !== ""
      ) {

        return project.metadata[field];

      }

    }

  }


  return findImageURL(project);

}


/* ============================================================
   FIND IMAGE URL
============================================================ */

function findImageURL(value) {

  if (!value || typeof value !== "object") {
    return "";
  }


  for (const key of Object.keys(value)) {

    const current =
      value[key];


    if (typeof current === "string") {

      const lower =
        current.toLowerCase();


      if (
        lower.includes(".jpg") ||
        lower.includes(".jpeg") ||
        lower.includes(".png") ||
        lower.includes(".webp")
      ) {

        return current;

      }

    }


    if (
      current &&
      typeof current === "object"
    ) {

      const nested =
        findImageURL(current);

      if (nested) {
        return nested;
      }

    }

  }


  return "";

}


/* ============================================================
   CLEAN FOLDER NAME
============================================================ */

function cleanFolderName(folderName) {

  if (!folderName) {
    return "Proyecto";
  }


  return folderName
    .replace(/\s*\(\d+\)\s*$/, "")
    .trim();

}


/* ============================================================
   MOBILE MENU
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

      menu.classList.toggle("open");

    }
  );


  menu
    .querySelectorAll("a")
    .forEach(link => {

      link.addEventListener(
        "click",
        () => {
          menu.classList.remove("open");
        }
      );

    });

}


/* ============================================================
   PROTECTION
============================================================ */

function setupProtection() {

  document.addEventListener(
    "contextmenu",
    event => {

      const target =
        event.target;


      if (
        target.closest(
          "input, textarea, select, button, video, iframe"
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
        target.tagName === "IMG" ||
        target.closest(".protected-media")
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
        (event.ctrlKey || event.metaKey) &&
        key === "s"
      ) {

        event.preventDefault();

      }


      if (
        (event.ctrlKey || event.metaKey) &&
        key === "u"
      ) {

        event.preventDefault();

      }


      if (
        event.key === "F12" ||
        (
          (event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          ["i", "j", "c"].includes(key)
        )
      ) {

        event.preventDefault();

      }

    }
  );


  applyImageProtection(document);

}


/* ============================================================
   IMAGE PROTECTION
============================================================ */

function applyImageProtection(container) {

  container
    .querySelectorAll("img")
    .forEach(img => {

      img.classList.add(
        "protected-image"
      );

      img.setAttribute(
        "draggable",
        "false"
      );


      img.addEventListener(
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

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }


  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {
  return escapeHTML(value);
}
