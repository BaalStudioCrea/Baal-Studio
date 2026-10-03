/* ============================================================
   BAAL STUDIO
   SCRIPT.JS — V08
   ============================================================ */


/* ------------------------------------------------------------
   CONFIGURACIÓN GENERAL
   ------------------------------------------------------------ */

const SUPABASE_URL = "https://fayxkqzqvthwqjtrvphk.supabase.co";

const FUNCTIONS = {

  projects:
    `${SUPABASE_URL}/functions/v1/list-projects`,

  assets:
    `${SUPABASE_URL}/functions/v1/get-site-assets`

};


/* ------------------------------------------------------------
   UTILIDADES
   ------------------------------------------------------------ */

function log(...args) {
  console.log("[Baal Studio]", ...args);
}


function warn(...args) {
  console.warn("[Baal Studio]", ...args);
}


function error(...args) {
  console.error("[Baal Studio]", ...args);
}


function isObject(value) {

  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );

}


function isString(value) {

  return (
    typeof value === "string" &&
    value.trim().length > 0
  );

}


function normalizeText(value) {

  if (!isString(value)) {
    return "";
  }

  return value.trim();

}


/* ------------------------------------------------------------
   URL
   ------------------------------------------------------------ */

function isProbablyImageUrl(value) {

  if (!isString(value)) {
    return false;
  }

  const clean = value
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();

  return (
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".png") ||
    clean.endsWith(".webp") ||
    clean.endsWith(".gif") ||
    clean.endsWith(".avif")
  );

}


function isProbablyUrl(value) {

  if (!isString(value)) {
    return false;
  }

  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:")
  );

}


/* ------------------------------------------------------------
   ASSETS
   ------------------------------------------------------------ */

async function loadSiteAssets() {

  try {

    log("Solicitando assets:", FUNCTIONS.assets);

    const response = await fetch(FUNCTIONS.assets);

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status} al cargar assets`
      );

    }

    const data = await response.json();

    log("Assets recibidos:", data);

    if (!data || data.success !== true) {

      throw new Error(
        data?.error ||
        "Respuesta no válida de get-site-assets"
      );

    }

    applySiteAssets(data.assets || {});

  } catch (err) {

    error("Error cargando assets:", err);

  }

}


/* ------------------------------------------------------------
   APLICAR ASSETS
   ------------------------------------------------------------ */

function applySiteAssets(assets) {

  if (!assets || typeof assets !== "object") {
    return;
  }


  const siteLogo =
    document.getElementById("site-logo");

  const heroBackground =
    document.getElementById("hero-background");

  const footerLogoBaal =
    document.getElementById("footer-logo-baal");

  const footerLogoLns =
    document.getElementById("footer-logo-lns");

  const footerQr =
    document.getElementById("footer-qr");


  if (siteLogo && assets.logoPrincipal) {

    siteLogo.src = assets.logoPrincipal;

  }


  if (heroBackground && assets.fondo) {

    heroBackground.src = assets.fondo;

  }


  if (footerLogoBaal && assets.logoPrincipal) {

    footerLogoBaal.src = assets.logoPrincipal;

  }


  if (footerLogoLns && assets.logoLNS) {

    footerLogoLns.src = assets.logoLNS;

  }


  if (footerQr && assets.qr) {

    footerQr.src = assets.qr;

  }


  log("Assets aplicados.");

}


/* ------------------------------------------------------------
   NORMALIZAR PROYECTO
   ------------------------------------------------------------ */

function normalizeProject(project, index = 0) {

  if (!isObject(project)) {
    return null;
  }


  const rawName =
    normalizeText(
      project.name ||
      project.folder ||
      project.nombre ||
      project.id ||
      `Proyecto ${index + 1}`
    );


  const metadataTitle =
    project?.metadata?.titulo ||
    project?.metadata?.title ||
    project?.metadata?.nombre ||
    project?.metadata?.name ||
    project?.titulo ||
    project?.title ||
    "";


  const displayName =
    String(metadataTitle || rawName)
      .replace(/\s*[.!?]+\s*$/, "")
      .trim();


  const order = Number(
    project.order ??
    project.orden ??
    project.position ??
    project.posicion ??
    index + 1
  );


  const cover =
    extractCover(project);


  const location =
    normalizeText(
      project.location ||
      project.ubicacion ||
      project.lugar ||
      project.procedencia ||
      project?.metadata?.ubicacion ||
      project?.metadata?.location ||
      ""
    );


  const year =
    normalizeText(
      project.year ||
      project.ano ||
      project.año ||
      project.fecha ||
      project?.metadata?.year ||
      project?.metadata?.ano ||
      project?.metadata?.año ||
      ""
    );


  const category =
    normalizeText(
      project.category ||
      project.categoria ||
      project.tipo ||
      project?.metadata?.category ||
      project?.metadata?.categoria ||
      ""
    );


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

function extractCover(project) {

  if (!isObject(project)) {
    return "";
  }


  if (
    isObject(project.cover) &&
    isString(project.cover.url)
  ) {

    return project.cover.url;

  }


  if (
    isObject(project.cover) &&
    isString(project.cover.signedUrl)
  ) {

    return project.cover.signedUrl;

  }


  if (
    isString(project.cover)
  ) {

    return project.cover;

  }


  const directCandidates = [

    project.coverUrl,
    project.cover_url,

    project.imageUrl,
    project.image_url,

    project.image,

    project.thumbnailUrl,
    project.thumbnail_url,

    project.thumbnail,

    project.portada,

    project.portadaUrl,
    project.portada_url

  ];


  for (const candidate of directCandidates) {

    const url =
      extractUrlFromValue(candidate);

    if (url) {

      return url;

    }

  }


  return findImageUrl(project);

}


/* ------------------------------------------------------------
   BUSCAR IMAGEN RECURSIVAMENTE
   ------------------------------------------------------------ */

function findImageUrl(value, depth = 0) {

  if (depth > 6) {
    return "";
  }


  if (isString(value)) {

    if (
      isProbablyUrl(value) &&
      isProbablyImageUrl(value)
    ) {

      return value;

    }

    return "";

  }


  if (!isObject(value)) {
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
    "signedUrl"

  ];


  for (const key of priorityKeys) {

    if (!(key in value)) {
      continue;
    }

    const found =
      extractUrlFromValue(
        value[key]
      );

    if (found) {
      return found;
    }

  }


  for (const key of Object.keys(value)) {

    const found =
      findImageUrl(
        value[key],
        depth + 1
      );

    if (found) {
      return found;
    }

  }


  return "";

}


/* ------------------------------------------------------------
   EXTRAER URL DE VALOR
   ------------------------------------------------------------ */

function extractUrlFromValue(value) {

  if (isString(value)) {

    if (isProbablyUrl(value)) {

      return value;

    }

    return "";

  }


  if (!isObject(value)) {
    return "";
  }


  const candidates = [

    value.url,
    value.signedUrl,
    value.signed_url,

    value.publicUrl,
    value.public_url,

    value.href,

    value.downloadUrl,
    value.download_url

  ];


  for (const candidate of candidates) {

    if (
      isString(candidate) &&
      isProbablyUrl(candidate)
    ) {

      return candidate;

    }

  }


  return "";

}


/* ------------------------------------------------------------
   CARGAR PROYECTOS DESTACADOS
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

    log(
      "Solicitando proyectos:",
      FUNCTIONS.projects
    );


    const response =
      await fetch(
        FUNCTIONS.projects
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status} al cargar proyectos`
      );

    }


    const data =
      await response.json();


    log(
      "Proyectos recibidos:",
      data
    );


    if (
      !data ||
      data.success !== true
    ) {

      throw new Error(
        data?.error ||
        "Respuesta no válida de list-projects"
      );

    }


    const projects =
      Array.isArray(data.projects)
        ? data.projects
        : [];


    const normalized =
      projects
        .map(
          (project, index) =>
            normalizeProject(
              project,
              index
            )
        )
        .filter(Boolean)
        .sort(
          (a, b) =>
            Number(a.order || 0) -
            Number(b.order || 0)
        );


    renderSelectedProjects(
      container,
      normalized
    );


  } catch (err) {

    error(
      "Error cargando proyectos:",
      err
    );


    container.innerHTML = `

      <div class="project-loading">

        <p>
          No se pudieron cargar los proyectos.
        </p>

      </div>

    `;

  }

}


/* ------------------------------------------------------------
   RENDER PROYECTOS
   ------------------------------------------------------------ */

function renderSelectedProjects(
  container,
  projects
) {

  container.innerHTML = "";


  if (!projects.length) {

    container.innerHTML = `

      <div class="project-loading">

        <p>
          No hay proyectos disponibles.
        </p>

      </div>

    `;

    return;

  }


  /*
     Para la home utilizamos:
     - primer proyecto como grande
     - segundo y tercero como medianos
  */

  const selected =
    projects.slice(0, 3);


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

}


/* ------------------------------------------------------------
   CREAR TARJETA DE PROYECTO
   ------------------------------------------------------------ */

function createProjectCard(
  project,
  index
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    index === 0
      ? "project-card project-card-large"
      : "project-card project-card-medium";


  const media =
    document.createElement(
      "div"
    );


  media.className =
    "project-card-media protected-media";


  const image =
    document.createElement(
      "img"
    );


  image.className =
    "protected-image";


  image.alt =
    project.displayName ||
    project.name ||
    "Proyecto Baal Studio";


  image.draggable =
    false;


  if (
    typeof project.cover === "string" &&
    project.cover.length > 0
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
          width:
            image.naturalWidth,

          height:
            image.naturalHeight,

          src:
            image.src
        }
      );

    }
  );


  image.addEventListener(
    "error",
    event => {

      console.error(
        `[Baal Studio] ERROR cargando cover: ${project.displayName}`,
        {
          url:
            image.src,

          event
        }
      );

    }
  );


  media.appendChild(
    image
  );


  const overlay =
    document.createElement(
      "div"
    );


  overlay.className =
    "project-card-overlay";


  media.appendChild(
    overlay
  );


  card.appendChild(
    media
  );


  const content =
    document.createElement(
      "div"
    );


  content.className =
    "project-card-content";


  if (project.location) {

    const location =
      document.createElement(
        "p"
      );

    location.className =
      "project-card-location";

    location.textContent =
      project.location;

    content.appendChild(
      location
    );

  }


  const title =
    document.createElement(
      "h3"
    );


  title.className =
    "project-card-title";


  title.textContent =
    project.displayName ||
    project.name;


  content.appendChild(
    title
  );


  const meta =
    document.createElement(
      "div"
    );


  meta.className =
    "project-card-meta";


  if (project.year) {

    const span =
      document.createElement(
        "span"
      );

    span.textContent =
      project.year;

    meta.appendChild(
      span
    );

  }


  if (project.category) {

    const span =
      document.createElement(
        "span"
      );

    span.textContent =
      project.category;

    meta.appendChild(
      span
    );

  }


  if (meta.children.length) {

    content.appendChild(
      meta
    );

  }


  card.appendChild(
    content
  );


  card.addEventListener(
    "click",
    () => {

      if (
        project.url &&
        isProbablyUrl(project.url)
      ) {

        window.location.href =
          project.url;

        return;

      }


      const params =
        new URLSearchParams({

          project:
            project.name || ""

        });


      window.location.href =
        `./proyectos.html?${params.toString()}`;

    }
  );


  return card;

}


/* ------------------------------------------------------------
   PROTECCIÓN DE MEDIOS
   ------------------------------------------------------------ */

function setupMediaProtection() {

  document.addEventListener(
    "contextmenu",
    event => {

      const target =
        event.target;

      if (
        target instanceof
          HTMLImageElement ||
        target.closest(
          ".protected-media"
        ) ||
        target.closest(
          ".protected-image"
        )
      ) {

        event.preventDefault();

      }

    }
  );


  document.addEventListener(
    "dragstart",
    event => {

      const target =
        event.target;

      if (
        target instanceof
          HTMLImageElement ||
        target.closest(
          ".protected-media"
        ) ||
        target.closest(
          ".protected-image"
        )
      ) {

        event.preventDefault();

      }

    }
  );


  document.addEventListener(
    "selectstart",
    event => {

      const target =
        event.target;

      if (
        target instanceof
          HTMLImageElement ||
        target.closest(
          ".protected-media"
        )
      ) {

        event.preventDefault();

      }

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      const key =
        String(event.key).toLowerCase();


      const forbidden =
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        [
          "s",
          "u"
        ].includes(key);


      if (forbidden) {

        event.preventDefault();

      }

    }
  );

}


/* ------------------------------------------------------------
   HEADER SCROLL
   ------------------------------------------------------------ */

function setupHeaderScroll() {

  const header =
    document.getElementById(
      "main-header"
    );


  if (!header) {
    return;
  }


  const update =
    () => {

      if (
        window.scrollY > 30
      ) {

        header.classList.add(
          "scrolled"
        );

      } else {

        header.classList.remove(
          "scrolled"
        );

      }

    };


  update();


  window.addEventListener(
    "scroll",
    update,
    {
      passive: true
    }
  );

}


/* ------------------------------------------------------------
   MENÚ MÓVIL
   ------------------------------------------------------------ */

function setupMobileMenu() {

  const button =
    document.getElementById(
      "mobile-menu-button"
    );


  const menu =
    document.getElementById(
      "mobile-menu"
    );


  if (
    !button ||
    !menu
  ) {

    return;

  }


  button.addEventListener(
    "click",
    () => {

      const open =
        button.classList.toggle(
          "open"
        );


      menu.classList.toggle(
        "open",
        open
      );


      button.setAttribute(
        "aria-expanded",
        String(open)
      );


      menu.setAttribute(
        "aria-hidden",
        String(!open)
      );

    }
  );


  menu
    .querySelectorAll("a")
    .forEach(
      link => {

        link.addEventListener(
          "click",
          () => {

            button.classList.remove(
              "open"
            );

            menu.classList.remove(
              "open"
            );

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
   INICIALIZACIÓN
   ------------------------------------------------------------ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    log(
      "Inicializando Baal Studio V08..."
    );


    loadSiteAssets();

    loadSelectedProjects();

    setupMediaProtection();

    setupHeaderScroll();

    setupMobileMenu();


    log(
      "Inicialización completada."
    );

  }
);
