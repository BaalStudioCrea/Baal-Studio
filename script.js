// ============================================================
// BAAL STUDIO — SCRIPT V08
// ============================================================

const SUPABASE_URL = "https://hgzqzqzqzqzqzqzqzqzq.supabase.co";

const FUNCTIONS = {
  projects:
    `${SUPABASE_URL}/functions/v1/list-projects`,

  siteAssets:
    `${SUPABASE_URL}/functions/v1/get-site-assets`,

  projectResources:
    `${SUPABASE_URL}/functions/v1/resolve-project-resources`,

  externalResources:
    `${SUPABASE_URL}/functions/v1/get-project-external-resources`
};


// ============================================================
// UTILIDADES GENERALES
// ============================================================

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}


function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


function getProjectFolderName(project) {
  return (
    project?.folder ||
    project?.folderName ||
    project?.path ||
    project?.name ||
    ""
  );
}


// ============================================================
// PETICIONES
// ============================================================

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Accept": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} al solicitar ${url}`
    );
  }

  return await response.json();
}


// ============================================================
// PROYECTOS
// ============================================================

async function loadProjects() {
  try {
    const data = await fetchJSON(FUNCTIONS.projects);

    if (!data || !Array.isArray(data.projects)) {
      console.error(
        "[Baal Studio] Respuesta de proyectos no válida:",
        data
      );

      return [];
    }

    return data.projects
      .map(normalizeProject)
      .sort((a, b) => a.order - b.order);

  } catch (error) {
    console.error(
      "[Baal Studio] Error cargando proyectos:",
      error
    );

    return [];
  }
}


// ============================================================
// NORMALIZACIÓN DE PROYECTOS
// ============================================================

function normalizeProject(project) {

  const rawName =
    project?.name ||
    project?.folder ||
    project?.folderName ||
    "";

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

  const order =
    Number(
      project?.order ??
      project?.orden ??
      project?.metadata?.order ??
      999
    );

  const cover = extractCover(project);

  const location =
    project?.metadata?.localizacion ||
    project?.metadata?.location ||
    project?.location ||
    project?.ubicacion ||
    "";

  const year =
    project?.metadata?.anio ||
    project?.metadata?.año ||
    project?.metadata?.year ||
    project?.year ||
    "";

  const category =
    project?.metadata?.categoria ||
    project?.metadata?.category ||
    project?.category ||
    "";

  return {
    ...project,

    rawName,

    name: displayName,

    displayName,

    order,

    cover,

    location,

    year,

    category
  };
}


// ============================================================
// EXTRACCIÓN DE COVER
// ============================================================

function extractCover(project) {

  if (!project) {
    return "";
  }

  // ----------------------------------------------------------
  // 1. Estructura habitual:
  // project.cover.url
  // ----------------------------------------------------------

  if (
    project.cover &&
    typeof project.cover === "object" &&
    typeof project.cover.url === "string" &&
    project.cover.url.length > 0
  ) {
    return project.cover.url;
  }


  // ----------------------------------------------------------
  // 2. Posibles nombres directos
  // ----------------------------------------------------------

  const directCandidates = [

    project.cover,

    project.coverUrl,

    project.cover_url,

    project.imageUrl,

    project.image_url,

    project.thumbnail,

    project.thumbnailUrl,

    project.thumbnail_url,

    project.portada,

    project.portadaUrl,

    project.portada_url

  ];


  for (const candidate of directCandidates) {

    const url = extractUrlFromValue(candidate);

    if (url) {
      return url;
    }
  }


  // ----------------------------------------------------------
  // 3. Búsqueda recursiva
  // ----------------------------------------------------------

  const recursiveUrl = findImageUrl(project);

  if (recursiveUrl) {
    return recursiveUrl;
  }


  return "";
}


// ============================================================
// BÚSQUEDA RECURSIVA DE IMAGEN
// ============================================================

function findImageUrl(value, depth = 0) {

  if (depth > 6 || value == null) {
    return "";
  }


  if (typeof value === "string") {

    const text = value.trim();

    if (!text) {
      return "";
    }

    if (
      /^https?:\/\//i.test(text) &&
      (
        /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(text) ||
        text.includes("/storage/")
      )
    ) {
      return text;
    }

    return "";
  }


  if (Array.isArray(value)) {

    for (const item of value) {

      const result = findImageUrl(item, depth + 1);

      if (result) {
        return result;
      }
    }

    return "";
  }


  if (typeof value === "object") {

    const priorityKeys = [

      "url",
      "signedUrl",
      "signed_url",
      "publicUrl",
      "public_url",
      "imageUrl",
      "image_url",
      "coverUrl",
      "cover_url",
      "src",
      "href"

    ];


    for (const key of priorityKeys) {

      if (key in value) {

        const result =
          findImageUrl(value[key], depth + 1);

        if (result) {
          return result;
        }
      }
    }


    for (const key of Object.keys(value)) {

      const result =
        findImageUrl(value[key], depth + 1);

      if (result) {
        return result;
      }
    }
  }


  return "";
}


// ============================================================
// EXTRACCIÓN DE URL
// ============================================================

function extractUrlFromValue(value) {

  if (!value) {
    return "";
  }


  if (typeof value === "string") {

    const text = value.trim();

    if (
      /^https?:\/\//i.test(text)
    ) {
      return text;
    }

    return "";
  }


  if (typeof value === "object") {

    const possibleKeys = [

      "url",
      "signedUrl",
      "signed_url",
      "publicUrl",
      "public_url",
      "imageUrl",
      "image_url",
      "src",
      "href"

    ];


    for (const key of possibleKeys) {

      if (
        typeof value[key] === "string" &&
        value[key].trim()
      ) {
        return value[key].trim();
      }
    }
  }


  return "";
}


// ============================================================
// PROYECTOS SELECCIONADOS
// ============================================================

async function loadSelectedProjects() {

  const container =
    document.querySelector("#selected-projects");

  if (!container) {
    return;
  }


  try {

    const projects = await loadProjects();

    if (!projects.length) {

      console.warn(
        "[Baal Studio] No se encontraron proyectos."
      );

      return;
    }


    container.innerHTML = "";


    const selectedProjects =
      projects.slice(0, 3);


    selectedProjects.forEach(
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


  } catch (error) {

    console.error(
      "[Baal Studio] Error cargando proyectos seleccionados:",
      error
    );
  }
}


// ============================================================
// CREACIÓN DE TARJETA DE PROYECTO
// ============================================================

function createProjectCard(project, index = 0) {

  if (!project) {
    return null;
  }


  const article =
    document.createElement("article");

  article.className =
    index === 0
      ? "project-card project-card-large"
      : "project-card project-card-small";


  const folderName =
    getProjectFolderName(project);


  const displayName =
    project.displayName ||
    project.name ||
    folderName ||
    "Proyecto";


  // ----------------------------------------------------------
  // MEDIA
  // ----------------------------------------------------------

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


  if (
    typeof project.cover === "string" &&
    project.cover.length > 0
  ) {

    image.src =
      project.cover;

    image.dataset.source =
      "supabase-cover";


    console.log(
      `[Baal Studio] Cover asignado: ${displayName}`,
      project.cover
    );
  }


  image.addEventListener(
    "load",
    () => {

      console.log(
        `[Baal Studio] Cover cargado: ${displayName}`,
        {
          width: image.naturalWidth,
          height: image.naturalHeight
        }
      );
    }
  );


  image.addEventListener(
    "error",
    event => {

      console.error(
        `[Baal Studio] ERROR cargando cover: ${displayName}`,
        {
          url: image.src,
          event
        }
      );
    }
  );


  media.appendChild(image);


  // ----------------------------------------------------------
  // OVERLAY
  // ----------------------------------------------------------

  const overlay =
    document.createElement("div");

  overlay.className =
    "project-card-overlay";


  media.appendChild(
    overlay
  );


  article.appendChild(
    media
  );


  // ----------------------------------------------------------
  // CONTENIDO
  // ----------------------------------------------------------

  const content =
    document.createElement("div");

  content.className =
    "project-card-content";


  const meta =
    document.createElement("div");

  meta.className =
    "project-card-meta";


  if (project.location) {

    const location =
      document.createElement("span");

    location.textContent =
      project.location;

    meta.appendChild(
      location
    );
  }


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


  content.appendChild(
    meta
  );


  const title =
    document.createElement("h3");

  title.className =
    "project-card-title";

  title.textContent =
    displayName;


  content.appendChild(
    title
  );


  article.appendChild(
    content
  );


  // ----------------------------------------------------------
  // ENLACE
  // ----------------------------------------------------------

  const link =
    document.createElement("a");

  link.className =
    "project-card-link";

  link.href =
    `proyecto.html?project=${encodeURIComponent(folderName)}`;

  link.setAttribute(
    "aria-label",
    `Ver proyecto ${displayName}`
  );


  article.appendChild(
    link
  );


  return article;
}


// ============================================================
// ASSETS DEL SITIO
// ============================================================

async function loadSiteAssets() {

  try {

    const data =
      await fetchJSON(
        FUNCTIONS.siteAssets
      );


    if (
      !data ||
      !data.success ||
      !data.assets
    ) {

      console.warn(
        "[Baal Studio] No se pudieron cargar los assets del sitio.",
        data
      );

      return null;
    }


    return data.assets;

  } catch (error) {

    console.error(
      "[Baal Studio] Error cargando assets:",
      error
    );

    return null;
  }
}


// ============================================================
// APLICAR ASSETS
// ============================================================

async function applySiteAssets() {

  const assets =
    await loadSiteAssets();


  if (!assets) {
    return;
  }


  const elements = {

    fondo:
      document.querySelector(
        "[data-site-asset='fondo']"
      ),

    logoPrincipal:
      document.querySelector(
        "[data-site-asset='logoPrincipal']"
      ),

    logoLNS:
      document.querySelector(
        "[data-site-asset='logoLNS']"
      ),

    qr:
      document.querySelector(
        "[data-site-asset='qr']"
      )

  };


  if (
    elements.fondo &&
    assets.fondo
  ) {

    elements.fondo.src =
      assets.fondo;
  }


  if (
    elements.logoPrincipal &&
    assets.logoPrincipal
  ) {

    elements.logoPrincipal.src =
      assets.logoPrincipal;
  }


  if (
    elements.logoLNS &&
    assets.logoLNS
  ) {

    elements.logoLNS.src =
      assets.logoLNS;
  }


  if (
    elements.qr &&
    assets.qr
  ) {

    elements.qr.src =
      assets.qr;
  }
}


// ============================================================
// PROTECCIÓN DE IMÁGENES
// ============================================================

function protectMedia() {

  document.addEventListener(
    "contextmenu",
    event => {

      const target =
        event.target.closest(
          ".protected-media, .protected-image"
        );

      if (target) {
        event.preventDefault();
      }
    }
  );


  document.addEventListener(
    "dragstart",
    event => {

      const target =
        event.target.closest(
          ".protected-media, .protected-image"
        );

      if (target) {
        event.preventDefault();
      }
    }
  );


  document.addEventListener(
    "selectstart",
    event => {

      const target =
        event.target.closest(
          ".protected-media, .protected-image"
        );

      if (target) {
        event.preventDefault();
      }
    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.ctrlKey &&
        (
          event.key.toLowerCase() === "s" ||
          event.key.toLowerCase() === "u"
        )
      ) {

        const active =
          document.activeElement;

        if (
          active &&
          active.closest &&
          active.closest(
            ".protected-media, .protected-image"
          )
        ) {
          event.preventDefault();
        }
      }
    }
  );
}


// ============================================================
// NAVEGACIÓN MÓVIL
// ============================================================

function initMobileMenu() {

  const button =
    document.querySelector(
      ".mobile-menu-button"
    );

  const menu =
    document.querySelector(
      ".mobile-menu"
    );


  if (!button || !menu) {
    return;
  }


  button.addEventListener(
    "click",
    () => {

      const isOpen =
        menu.classList.toggle(
          "is-open"
        );

      button.setAttribute(
        "aria-expanded",
        String(isOpen)
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
            "is-open"
          );

          button.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      );
    });
}


// ============================================================
// SCROLL HEADER
// ============================================================

function initHeaderScroll() {

  const header =
    document.querySelector(
      ".site-header"
    );

  if (!header) {
    return;
  }


  const update =
    () => {

      if (
        window.scrollY > 40
      ) {

        header.classList.add(
          "is-scrolled"
        );

      } else {

        header.classList.remove(
          "is-scrolled"
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


// ============================================================
// REVEAL AL HACER SCROLL
// ============================================================

function initReveal() {

  const elements =
    document.querySelectorAll(
      "[data-reveal]"
    );


  if (!elements.length) {
    return;
  }


  if (
    !("IntersectionObserver" in window)
  ) {

    elements.forEach(
      element =>
        element.classList.add(
          "is-visible"
        )
    );

    return;
  }


  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "is-visible"
              );

              observer.unobserve(
                entry.target
              );
            }
          }
        );
      },
      {
        threshold: 0.12
      }
    );


  elements.forEach(
    element =>
      observer.observe(
        element
      )
  );
}


// ============================================================
// SMOOTH SCROLL
// ============================================================

function initSmoothScroll() {

  document
    .querySelectorAll(
      'a[href^="#"]'
    )
    .forEach(
      link => {

        link.addEventListener(
          "click",
          event => {

            const href =
              link.getAttribute(
                "href"
              );

            if (
              !href ||
              href === "#"
            ) {
              return;
            }


            const target =
              document.querySelector(
                href
              );


            if (!target) {
              return;
            }


            event.preventDefault();


            target.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        );
      }
    );
}


// ============================================================
// INICIALIZACIÓN
// ============================================================

async function initBaalStudio() {

  console.log(
    "[Baal Studio] Inicializando V08..."
  );


  await applySiteAssets();


  await loadSelectedProjects();


  protectMedia();


  initMobileMenu();


  initHeaderScroll();


  initReveal();


  initSmoothScroll();


  console.log(
    "[Baal Studio] V08 inicializado."
  );
}


// ============================================================
// ARRANQUE
// ============================================================

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initBaalStudio
  );

} else {

  initBaalStudio();
}
