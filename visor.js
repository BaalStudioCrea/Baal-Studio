```javascript
/* ============================================================
   BAAL STUDIO — VISOR.JS
   Visor de proyectos compatible con la estructura de Supabase
   ============================================================ */

const SUPABASE_URL =
  "https://hlyzyeatnbulyfiiwvsq.supabase.co";

const VISOR_FUNCTION =
  `${SUPABASE_URL}/functions/v1/visor`;

document.addEventListener("DOMContentLoaded", () => {
  loadProjectViewer();
  installViewerProtection();
});


/* ============================================================
   UTILIDADES
   ============================================================ */

function getProjectParameter() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("project") || "").trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getViewerContainer() {
  return document.getElementById("project-viewer-content");
}

function showMessage(message, type = "loading") {
  const container = getViewerContainer();
  if (!container) return;

  container.innerHTML = `
    <section class="visor-state visor-state-${escapeHtml(type)}">
      <p>${escapeHtml(message)}</p>
    </section>
  `;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getResourceUrl(item) {
  if (!item) return "";

  if (typeof item === "string") {
    return item.trim();
  }

  return String(
    item.url ||
    item.resource?.url ||
    item.signedUrl ||
    item.signed_url ||
    ""
  ).trim();
}

function getItemName(item, fallback = "") {
  if (!item || typeof item === "string") return fallback;

  return String(
    item.reference ||
    item.name ||
    item.file ||
    item.title ||
    fallback
  );
}

function normaliseProjectResponse(result, requestedProject) {
  /*
   * Admite las dos respuestas:
   * { success: true, project: {...} }
   * { success: true, projects: [...] }
   */

  if (result?.project && typeof result.project === "object") {
    return result.project;
  }

  const projects = asArray(result?.projects);

  if (projects.length) {
    const requested = requestedProject.toLowerCase();

    return (
      projects.find(project =>
        String(project.id || project.name || "")
          .toLowerCase() === requested
      ) ||
      projects.find(project =>
        String(project.name || "")
          .toLowerCase() === requested
      ) ||
      (projects.length === 1 ? projects[0] : null)
    );
  }

  /*
   * Algunas funciones devuelven el propio proyecto
   * en la raíz de la respuesta.
   */

  if (result?.metadata || result?.blocks) {
    return result;
  }

  return null;
}


/* ============================================================
   CARGA
   ============================================================ */

async function loadProjectViewer() {
  const requestedProject = getProjectParameter();

  if (!requestedProject) {
    showMessage("No se ha especificado ningún proyecto.", "error");
    return;
  }

  showMessage("Cargando proyecto…");

  try {
    const response = await fetch(
      `${VISOR_FUNCTION}?project=${encodeURIComponent(requestedProject)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
      }
    );

    const rawResponse = await response.text();

    let result;

    try {
      result = JSON.parse(rawResponse);
    } catch {
      throw new Error(
        `La función visor no ha devuelto JSON válido (HTTP ${response.status}).`
      );
    }

    if (!response.ok) {
      throw new Error(
        result?.error ||
        result?.message ||
        `Error HTTP ${response.status}.`
      );
    }

    const project = normaliseProjectResponse(
      result,
      requestedProject
    );

    if (!project) {
      console.error("[Baal Studio] Respuesta de Supabase:", result);
      throw new Error(
        result?.error ||
        "La respuesta no contiene el proyecto esperado."
      );
    }

    renderProject(project);

  } catch (error) {
    console.error("[Baal Studio] Error cargando proyecto:", error);

    showMessage(
      `No se pudo cargar el proyecto: ${error.message}`,
      "error"
    );
  }
}


/* ============================================================
   RENDER PRINCIPAL
   ============================================================ */

function renderProject(project) {
  const container = getViewerContainer();
  if (!container) return;

  const metadata = project.metadata || {};
  const title = metadata.titulo || project.name || project.id || "Proyecto";

  const blocks = asArray(project.blocks);

  container.innerHTML = `
    <article class="project-viewer"
      data-project-id="${escapeHtml(project.id || project.name || "")}">

      ${renderProjectIntro(project)}

      ${renderProjectDescription(metadata.descripcion)}

      <div class="project-viewer-content">
        ${renderBlocks(blocks, project)}
      </div>

      ${renderProjectNavigation(project.navigation)}
    </article>
  `;

  document.title = `${title} — Baal Studio`;

  initialiseCarousels();
  initialiseMediaZoom();
  initialiseSketchfab();
  initialiseNavigation();
}


/* ============================================================
   INTRODUCCIÓN Y METADATOS
   ============================================================ */

function renderProjectIntro(project) {
  const metadata = project.metadata || {};

  const fields = [
    ["Localización", "Location", metadata.localizacion],
    ["Categoría", "Category", metadata.categoria],
    ["Subcategoría", "Subcategory", metadata.subcategoria],
    ["Año", "Year", metadata.año || metadata.anio],
    ["Técnicas", "Techniques", metadata.tecnicas],
    ["Objetivo", "Purpose", metadata.objetivo],
    ["Autoría", "Authorship", metadata.autoria],
    ["Colaboración", "Collaboration", metadata.colaboracion]
  ];

  const title =
    metadata.titulo ||
    project.name ||
    project.id ||
    "Proyecto";

  const articles = asArray(project.articles);

  return `
    <header class="project-viewer-intro">
      <div class="project-viewer-intro-inner">

        <div class="project-viewer-title-block">
          <p class="project-viewer-title-en">Project</p>
          <h1 class="project-viewer-title">${escapeHtml(title)}</h1>
        </div>

        <div class="project-viewer-summary">
          ${fields.map(([label, english, value]) =>
            renderMetadataItem(label, english, value)
          ).join("")}

          ${articles.length ? renderArticles(articles) : ""}
        </div>

      </div>
    </header>
  `;
}

function renderMetadataItem(label, english, value) {
  if (!value || (Array.isArray(value) && !value.length)) return "";

  const displayValue = Array.isArray(value)
    ? value.filter(Boolean).join(" · ")
    : String(value);

  return `
    <div class="project-viewer-summary-item">
      <div class="project-viewer-summary-label">${escapeHtml(label)}</div>
      <div class="project-viewer-summary-label-en">${escapeHtml(english)}</div>
      <div class="project-viewer-summary-value">${escapeHtml(displayValue)}</div>
    </div>
  `;
}

function renderArticles(articles) {
  return `
    <div class="project-viewer-summary-item">
      <div class="project-viewer-summary-label">Artículos</div>
      <div class="project-viewer-summary-label-en">Sources</div>
      <div class="project-viewer-summary-value project-viewer-articles">
        ${articles.map((article, index) => {
          const url = typeof article === "string"
            ? article
            : article?.url || "";

          const label = typeof article === "object"
            ? article.title || `Fuente ${index + 1}`
            : `Fuente ${index + 1}`;

          if (!url) return "";

          return `
            <a href="${escapeHtml(url)}"
              target="_blank"
              rel="noopener noreferrer">
              ${escapeHtml(label)}
            </a>
          `;
        }).join("")}
      </div>
    </div>
  `;
}


/* ============================================================
   DESCRIPCIÓN
   ============================================================ */

function renderProjectDescription(description) {
  if (!description) return "";

  const paragraphs = String(description)
    .split(/\n\s*\n/)
    .map(text => text.trim())
    .filter(Boolean);

  return `
    <section class="project-viewer-description">
      <div class="project-viewer-description-heading">
        <div class="project-viewer-description-title">Descripción</div>
        <div class="project-viewer-description-en">Project description</div>
      </div>

      <div class="project-viewer-description-text">
        ${paragraphs.map(paragraph =>
          `<p>${escapeHtml(paragraph)}</p>`
        ).join("")}
      </div>
    </section>
  `;
}


/* ============================================================
   BLOQUES
   ============================================================ */

function renderBlocks(blocks, project) {
  if (!blocks.length) {
    return `
      <section class="project-viewer-empty">
        <p>No hay bloques visuales disponibles para este proyecto.</p>
      </section>
    `;
  }

  /*
   * Se respeta el orden recibido de Supabase.
   * No se ordenan los bloques alfabéticamente.
   */

  return blocks.map((block, index) =>
    renderBlock(block, index, project)
  ).join("");
}

function renderBlock(block, index, project) {
  if (!block) return "";

  const type = String(block.type || "").toLowerCase();

  switch (type) {
    case "image":
    case "imagen":
      return renderImageBlock(block, index);

    case "carousel":
    case "carrusel":
      return renderCarouselBlock(block, index);

    case "comparator":
    case "comparador":
      return renderComparatorBlock(block, index);

    case "evolution":
    case "evolucion":
      return renderEvolutionBlock(block, index);

    case "sketchfab":
      return renderSketchfabBlock(block, index, project);

    case "video":
    case "vídeo":
      return renderVideoBlock(block, index, project);

    case "pdf":
      return renderPdfBlock(block, index);

    default:
      console.warn("[Baal Studio] Tipo de bloque no reconocido:", type, block);
      return "";
  }
}

function renderCaption(text) {
  if (!text) return "";

  return `
    <p class="project-block-caption">${escapeHtml(text)}</p>
  `;
}

function renderZoomButton(label = "Ampliar imagen", extraClass = "") {
  return `
    <button type="button"
      class="project-media-zoom ${escapeHtml(extraClass)}"
      data-zoom-current
      aria-label="${escapeHtml(label)}"
      title="${escapeHtml(label)}">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.8" cy="10.8" r="6.3"></circle>
        <path d="M15.5 15.5 21 21"></path>
        <path d="M10.8 7.5v6.6M7.5 10.8h6.6"></path>
      </svg>
    </button>
  `;
}


/* ============================================================
   IMAGEN INDIVIDUAL
   ============================================================ */

function renderImageBlock(block, index) {
  const url = getResourceUrl(block);

  if (!url) return "";

  const alt = getItemName(block, "Imagen del proyecto");

  return `
    <figure class="project-block project-image-block"
      data-block-index="${index}">

      <div class="project-single-image protected-media">
        <img class="project-main-image protected-image"
          src="${escapeHtml(url)}"
          alt="${escapeHtml(alt)}"
          loading="lazy"
          draggable="false">

        ${renderZoomButton()}
      </div>

      ${renderCaption(block.text || block.caption)}
    </figure>
  `;
}


/* ============================================================
   CARRUSEL
   ============================================================ */

function renderCarouselBlock(block, index) {
  const images = asArray(block.images)
    .filter(item => getResourceUrl(item));

  if (!images.length) return "";

  const carouselId = `project-carousel-${index}`;

  return `
    <section class="project-block project-carousel-block"
      data-carousel="${carouselId}">

      <div class="portfolio-media-viewer">

        <button type="button"
          class="project-carousel-button project-carousel-prev"
          data-carousel-action="prev"
          aria-label="Imagen anterior">←</button>

        <div class="portfolio-media-stage protected-media">

          ${images.map((image, imageIndex) => `
            <img class="project-carousel-image protected-image ${imageIndex === 0 ? "is-active" : ""}"
              src="${escapeHtml(getResourceUrl(image))}"
              alt="${escapeHtml(getItemName(image, "Imagen del proyecto"))}"
              loading="${imageIndex === 0 ? "eager" : "lazy"}"
              draggable="false"
              data-carousel-index="${imageIndex}">
          `).join("")}

          ${renderZoomButton()}
        </div>

        <button type="button"
          class="project-carousel-button project-carousel-next"
          data-carousel-action="next"
          aria-label="Imagen siguiente">→</button>
      </div>

      <div class="project-carousel-counter">
        <span data-carousel-current>01</span>
        /
        <span>${String(images.length).padStart(2, "0")}</span>
      </div>

      ${renderCaption(block.text || block.caption)}
    </section>
  `;
}


/* ============================================================
   COMPARADOR
   ============================================================ */

function renderComparatorBlock(block, index) {
  const images = asArray(block.images)
    .filter(item => getResourceUrl(item));

  if (images.length < 2) return "";

  return `
    <section class="project-block project-comparator-block"
      data-block-index="${index}">

      <div class="project-comparator">

        ${renderComparatorImage(images[0], "Imagen original")}

        <div class="project-comparator-divider" aria-hidden="true"></div>

        ${renderComparatorImage(images[1], "Imagen comparada")}

      </div>

      ${renderCaption(block.text || block.caption)}
    </section>
  `;
}

function renderComparatorImage(image, fallback) {
  return `
    <div class="project-comparator-image protected-media">
      <img class="protected-image"
        src="${escapeHtml(getResourceUrl(image))}"
        alt="${escapeHtml(getItemName(image, fallback))}"
        loading="lazy"
        draggable="false">
      ${renderZoomButton()}
    </div>
  `;
}


/* ============================================================
   EVOLUCIÓN
   ============================================================ */

function renderEvolutionBlock(block, index) {
  const images = asArray(block.images)
    .filter(item => getResourceUrl(item));

  if (!images.length) return "";

  return `
    <section class="project-block project-evolution-block"
      data-block-index="${index}">

      <div class="project-evolution">
        ${images.map(image => `
          <figure class="project-evolution-item">
            <div class="project-evolution-image protected-media">
              <img class="protected-image"
                src="${escapeHtml(getResourceUrl(image))}"
                alt="${escapeHtml(getItemName(image, "Imagen del proceso"))}"
                loading="lazy"
                draggable="false">
              ${renderZoomButton()}
            </div>
            ${image.text ? renderCaption(image.text) : ""}
          </figure>
        `).join("")}
      </div>

      ${renderCaption(block.text || block.caption)}
    </section>
  `;
}


/* ============================================================
   SKETCHFAB
   Admite URL corta, URL /embed/ y código iframe.
   ============================================================ */

function extractSketchfabEmbed(value) {
  const text = String(value || "").trim();

  if (!text) return "";

  /*
   * Si se ha pegado el iframe completo, extraemos el src.
   */

  const iframeMatch = text.match(
    /<iframe[^>]+src=["']([^"']+)["']/i
  );

  if (iframeMatch) {
    return iframeMatch[1].replace(/&amp;/g, "&");
  }

  /*
   * Si ya es una URL de inserción, se usa directamente.
   */

  if (/sketchfab\.com\/models\/[^/]+\/embed/i.test(text)) {
    return text;
  }

  return "";
}

function normaliseSketchfabItem(item, index) {
  const value = typeof item === "string"
    ? item.trim()
    : String(item?.url || item?.embed || item?.iframe || "").trim();

  const directEmbed = extractSketchfabEmbed(value);

  return {
    url: directEmbed || value,
    sourceUrl: value,
    title: typeof item === "object"
      ? item.title || item.name || `Modelo 3D ${index + 1}`
      : `Modelo 3D ${index + 1}`
  };
}

function renderSketchfabBlock(block, index, project) {
  /*
   * En los datos existentes, el bloque puede ser únicamente
   * { "type": "sketchfab" } y las URL están en project.sketchfab.
   */

  const sourceItems = asArray(block.items).length
    ? block.items
    : asArray(project.sketchfab);

  const items = sourceItems
    .map(normaliseSketchfabItem)
    .filter(item => item.url);

  if (!items.length) {
    return `
      <section class="project-block project-sketchfab-block">
        <p class="project-block-caption">
          No hay modelos de Sketchfab configurados para este bloque.
        </p>
      </section>
    `;
  }

  return `
    <section class="project-block project-sketchfab-block"
      data-block-index="${index}">

      <div class="project-sketchfab-grid">
        ${items.map((item, itemIndex) =>
          renderSketchfabItem(item, index * 100 + itemIndex)
        ).join("")}
      </div>

      ${renderCaption(block.text || block.caption)}
    </section>
  `;
}

function renderSketchfabItem(item, index) {
  const directEmbed = extractSketchfabEmbed(item.url);
  const sourceUrl = item.sourceUrl || item.url;
  const embedUrl = directEmbed || "";

  return `
    <article class="project-sketchfab-item"
      data-sketchfab-url="${escapeHtml(sourceUrl)}"
      data-sketchfab-embed="${escapeHtml(embedUrl)}">

      <div class="project-sketchfab-preview protected-media"
        data-sketchfab-preview>

        <div class="project-sketchfab-placeholder"></div>

        <div class="project-sketchfab-preview-overlay">
          <button type="button"
            class="project-sketchfab-load">
            Cargar modelo 3D
          </button>
          <span>Sketchfab</span>
        </div>
      </div>

      <div class="project-sketchfab-title">
        ${escapeHtml(item.title || `Modelo 3D ${index + 1}`)}
      </div>

      <p class="project-sketchfab-external">
        <a href="${escapeHtml(sourceUrl)}"
          target="_blank"
          rel="noopener noreferrer">
          Abrir en Sketchfab ↗
        </a>
      </p>
    </article>
  `;
}

function initialiseSketchfab() {
  document.querySelectorAll(".project-sketchfab-item").forEach(item => {
    const button = item.querySelector(".project-sketchfab-load");
    const preview = item.querySelector("[data-sketchfab-preview]");

    if (!button || !preview || button.dataset.initialised === "true") {
      return;
    }

    button.dataset.initialised = "true";

    /*
     * Si el proyecto.txt ya proporciona una URL /embed/,
     * el iframe se carga directamente al pulsar el botón.
     * Si proporciona una URL corta, intentamos resolverla
     * mediante el servicio oEmbed de Sketchfab.
     */

    button.addEventListener("click", async () => {
      if (item.classList.contains("is-loaded")) return;

      const source = item.dataset.sketchfabUrl || "";
      let embedUrl = item.dataset.sketchfabEmbed || "";

      button.disabled = true;
      button.textContent = "Cargando…";

      try {
        if (!embedUrl && source) {
          const response = await fetch(
            `https://sketchfab.com/oembed?url=${encodeURIComponent(source)}&format=json`
          );

          if (!response.ok) {
            throw new Error(`Sketchfab respondió ${response.status}`);
          }

          const data = await response.json();
          embedUrl = extractSketchfabEmbed(data.html || "") ||
            String(data.html || "").match(/src=["']([^"']+)["']/i)?.[1] ||
            "";
        }

        if (!embedUrl) {
          throw new Error("No se pudo obtener la URL de inserción.");
        }

        preview.innerHTML = `
          <iframe class="project-sketchfab-iframe"
            src="${escapeHtml(embedUrl)}"
            title="Modelo 3D de Sketchfab"
            loading="eager"
            allow="autoplay; fullscreen; xr-spatial-tracking"
            allowfullscreen>
          </iframe>
        `;

        item.classList.add("is-loaded");

      } catch (error) {
        console.error("[Baal Studio] Error Sketchfab:", error);

        button.disabled = false;
        button.textContent = "Reintentar modelo 3D";
      }
    });
  });
}


/* ============================================================
   VÍDEO
   Admite URL en el bloque o en project.video.
   ============================================================ */

function extractYoutubeId(url) {
  const value = String(url || "");

  const patterns = [
    /youtu\.be\/([^?&/]+)/i,
    /youtube\.com\/watch\?v=([^?&/]+)/i,
    /youtube\.com\/embed\/([^?&/]+)/i,
    /youtube-nocookie\.com\/embed\/([^?&/]+)/i
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }

  return "";
}

function renderVideoBlock(block, index, project) {
  const url = getResourceUrl(block) || String(project.video || "").trim();

  if (!url) return "";

  const youtubeId = extractYoutubeId(url);

  const videoContent = youtubeId
    ? `
      <iframe
        src="https://www.youtube-nocookie.com/embed/${escapeHtml(youtubeId)}?rel=0&playsinline=1"
        title="Vídeo del proyecto"
        loading="lazy"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>
    `
    : `
      <video class="project-video" controls preload="metadata">
        <source src="${escapeHtml(url)}">
        Tu navegador no admite la reproducción de vídeo.
      </video>
    `;

  return `
    <section class="project-block project-video-block"
      data-block-index="${index}">

      <div class="project-video-frame">
        ${videoContent}
      </div>

      ${renderCaption(block.text || block.caption)}
    </section>
  `;
}


/* ============================================================
   PDF
   ============================================================ */

function renderPdfBlock(block, index) {
  const url = getResourceUrl(block);
  if (!url) return "";

  const pdfUrl = `${url}#toolbar=0&navpanes=0&scrollbar=1&view=Fit`;

  return `
    <section class="project-block project-pdf-block"
      data-block-index="${index}">

      <div class="project-pdf-frame protected-media">
        <iframe
          src="${escapeHtml(pdfUrl)}"
          title="${escapeHtml(getItemName(block, "Documento PDF"))}"
          loading="lazy">
        </iframe>
      </div>

      ${renderCaption(block.text || block.caption)}
    </section>
  `;
}


/* ============================================================
   CARRUSELES Y AMPLIACIÓN
   ============================================================ */

function initialiseCarousels() {
  document.querySelectorAll("[data-carousel]").forEach(carousel => {
    const images = Array.from(
      carousel.querySelectorAll(".project-carousel-image")
    );

    if (!images.length) return;

    const counter = carousel.querySelector("[data-carousel-current]");
    let current = 0;

    function update() {
      images.forEach((image, index) => {
        image.classList.toggle("is-active", index === current);
      });

      if (counter) {
        counter.textContent = String(current + 1).padStart(2, "0");
      }
    }

    carousel.querySelectorAll("[data-carousel-action]").forEach(button => {
      button.addEventListener("click", () => {
        const action = button.dataset.carouselAction;

        current = action === "prev"
          ? (current - 1 + images.length) % images.length
          : (current + 1) % images.length;

        update();
      });
    });

    update();
  });
}

function initialiseMediaZoom() {
  document.querySelectorAll("[data-zoom-current]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      const parent = button.closest(".protected-media");
      const image = parent?.querySelector(
        "img.is-active, img.project-main-image, img.protected-image"
      );

      if (image) openImageZoom(image.src, image.alt || "");
    });
  });

  document.querySelectorAll(
    ".project-main-image, .project-carousel-image, .project-comparator-image img, .project-evolution-image img"
  ).forEach(image => {
    image.addEventListener("click", () => {
      openImageZoom(image.src, image.alt || "");
    });
  });
}

function openImageZoom(src, alt) {
  let modal = document.getElementById("visor-image-modal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "visor-image-modal";
    modal.className = "project-lightbox";

    modal.innerHTML = `
      <button type="button"
        class="project-lightbox-close"
        aria-label="Cerrar">×</button>

      <div class="project-lightbox-inner protected-media">
        <img class="visor-image-modal-image protected-image"
          src=""
          alt=""
          draggable="false">
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".project-lightbox-close")
      .addEventListener("click", closeImageZoom);

    modal.addEventListener("click", event => {
      if (event.target === modal) closeImageZoom();
    });
  }

  const image = modal.querySelector(".visor-image-modal-image");
  image.src = src;
  image.alt = alt;

  modal.classList.add("is-open");
  document.body.classList.add("lightbox-open");
}

function closeImageZoom() {
  const modal = document.getElementById("visor-image-modal");
  if (!modal) return;

  modal.classList.remove("is-open");
  document.body.classList.remove("lightbox-open");
}


/* ============================================================
   NAVEGACIÓN ENTRE PROYECTOS
   ============================================================ */

function renderProjectNavigation(navigation) {
  if (!navigation) return "";

  const previous = navigation.previous;
  const next = navigation.next;

  function navItem(item, direction) {
    if (!item) return "";

    const id = item.id || item.name || "";
    const title = item.title || item.titulo || item.name || "Proyecto";

    if (!id) return "";

    return `
      <div class="project-navigation-side project-navigation-${direction}">
        <a href="./visor.html?project=${encodeURIComponent(id)}">
          <span>${direction === "previous" ? "← Anterior" : "Siguiente →"}</span>
          <strong>${escapeHtml(title)}</strong>
        </a>
      </div>
    `;
  }

  return `
    <nav class="project-viewer-navigation" aria-label="Navegación de proyectos">
      ${navItem(previous, "previous")}

      <a class="project-navigation-all" href="./proyectos.html">
        <small>Portfolio</small>
        <span>Todos los proyectos</span>
      </a>

      ${navItem(next, "next")}
    </nav>
  `;
}

function initialiseNavigation() {
  /*
   * La navegación utiliza enlaces HTML normales.
   * No necesita listeners adicionales.
   */
}


/* ============================================================
   PROTECCIÓN BÁSICA DE MEDIOS
   ============================================================ */

function installViewerProtection() {
  document.addEventListener("contextmenu", event => {
    if (event.target.closest(
      ".protected-image, .protected-media, .project-sketchfab-preview, .project-pdf-frame"
    )) {
      event.preventDefault();
    }
  });

  document.addEventListener("dragstart", event => {
    if (event.target.matches("img")) {
      event.preventDefault();
    }
  });

  document.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    if ((event.ctrlKey || event.metaKey) &&
        ["s", "u"].includes(key)) {
      event.preventDefault();
    }

    if (event.key === "Escape") {
      closeImageZoom();
    }
  });
}
```
