/* ============================================================
   BAAL STUDIO
   VISOR.JS
   VISOR DINÁMICO DE PROYECTOS
   ============================================================ */

/* ------------------------------------------------------------
   CONFIGURACIÓN
   ------------------------------------------------------------ */
const SUPABASE_URL = "https://hlyzyeatnbulyfiiwvsq.supabase.co";
const VISOR_FUNCTION = `${SUPABASE_URL}/functions/v1/visor`;

/* ------------------------------------------------------------
   INICIO
   ------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  loadProjectViewer();
});

function getProjectParameter() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("project") || "").trim();
}

function normalizeText(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function getViewerContainer() {
  const possibleIds = ["project-viewer", "visor-content", "project-content", "viewer-content", "project-detail", "project-detail-content"];
  for (const id of possibleIds) {
    const element = document.getElementById(id);
    if (element) return element;
  }
  const main = document.querySelector("main");
  if (main) return main;
  return null;
}

function showMessage(message, type = "loading") {
  const container = getViewerContainer();
  if (!container) return;
  container.innerHTML = `
    <section class="visor-state visor-state-${escapeHtml(type)} project-viewer-state">
      <p><strong>${escapeHtml(message)}</strong></p>
    </section>
  `;
}

async function loadProjectViewer() {
  const requestedProject = getProjectParameter();
  console.log("[Baal Studio] Parámetro recibido:", requestedProject);

  if (!requestedProject) {
    showMessage("No se ha especificado ningún proyecto.", "error");
    return;
  }

  showMessage("Cargando proyecto…", "loading");

  try {
    const endpoint = `${VISOR_FUNCTION}?project=${encodeURIComponent(requestedProject)}`;
    console.log("[Baal Studio] Consultando visor:", endpoint);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });

    console.log("[Baal Studio] visor HTTP:", response.status);
    const result = await response.json();
    console.log("[Baal Studio] Respuesta completa de visor:", result);

    if (!response.ok) throw new Error(result.error || `visor respondió ${response.status}`);
    if (!result.success || !result.project) throw new Error(result.error || "La función visor no devolvió un proyecto válido.");

    console.log("[Baal Studio] Proyecto recibido:", result.project);
    renderProject(result.project);
  } catch (error) {
    console.error("[Baal Studio] Error cargando proyecto:", error);
    showMessage(`No se pudo cargar el proyecto: ${error.message}`, "error");
  }
}

function renderProject(project) {
  const container = getViewerContainer();
  if (!container) {
    console.error("[Baal Studio] No se encontró el contenedor del visor.");
    return;
  }

  const metadata = project.metadata || {};
  const blocks = Array.isArray(project.blocks) ? project.blocks : [];
  const title = metadata.titulo || project.id || "Proyecto";

  container.innerHTML = `
    <article class="project-viewer" data-project-id="${escapeHtml(project.id)}">
      ${renderProjectHeader(project)}
      <div class="project-viewer-body">
        <div class="project-viewer-content">
          ${renderBlocks(blocks)}
        </div>
      </div>
    </article>
  `;

  document.title = `${title} — Baal Studio`;
  applyProtectedMedia();
  initialiseViewerInteractions();
}

function renderProjectHeader(project) {
  const metadata = project.metadata || {};
  const title = metadata.titulo || project.id || "Proyecto";
  const location = metadata.localizacion || "";
  const year = metadata.año || "";
  const category = Array.isArray(metadata.categoria) ? metadata.categoria.join(" · ") : (metadata.categoria || "");
  const subcategory = Array.isArray(metadata.subcategoria) ? metadata.subcategoria.join(" · ") : (metadata.subcategoria || "");
  const description = metadata.descripcion || "";
  const techniques = Array.isArray(metadata.tecnicas) ? metadata.tecnicas : [];
  const objectives = Array.isArray(metadata.objetivo) ? metadata.objetivo : [];
  const authorship = metadata.autoria || "";
  const collaboration = metadata.colaboracion || "";
  const articles = Array.isArray(project.articles) ? project.articles : [];

  return `
    <header class="project-viewer-intro">
      <div class="project-viewer-intro-inner">
        <div class="project-viewer-title-block">
          <p class="project-viewer-title-en">Project</p>
          <h1 class="project-viewer-title">${escapeHtml(title)}</h1>
        </div>
        
        <div class="project-viewer-summary">
          ${renderMetadataItem("Localización", location)}
          ${renderMetadataItem("Categoría", category)}
          ${renderMetadataItem("Subcategoría", subcategory)}
          ${renderMetadataItem("Año", year)}
          ${renderMetadataItem("Técnicas", techniques.join(" · "))}
          ${renderMetadataItem("Objetivo", objectives.join(" · "))}
          ${renderMetadataItem("Autoría", authorship)}
          ${renderMetadataItem("Colaboración", collaboration)}
          ${articles.length ? `<div class="project-viewer-summary-item"><span class="project-viewer-summary-label">Artículos</span><span class="project-viewer-summary-value">${articles.map((url, index) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:white;">Fuente ${index + 1}</a>`).join("<br>")}</span></div>` : ""}
        </div>
      </div>
    </header>
    ${description ? `
      <div class="project-viewer-body" style="padding-bottom: 0;">
        <div class="project-viewer-description">
          <div class="project-viewer-section-label">
            <span>Descripción</span>
          </div>
          <div>${renderParagraphs(description)}</div>
        </div>
      </div>
    ` : ""}
  `;
}

function renderMetadataItem(label, value) {
  if (!value) return "";
  return `
    <div class="project-viewer-summary-item">
      <span class="project-viewer-summary-label">${escapeHtml(label)}</span>
      <span class="project-viewer-summary-value">${escapeHtml(value)}</span>
    </div>
  `;
}

function renderParagraphs(text) {
  return String(text).split(/\n{2,}/).map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function renderBlocks(blocks) {
  if (!blocks.length) return `<section class="project-viewer-empty"><p>No hay contenido disponible para este proyecto.</p></section>`;
  return blocks.map((block, index) => renderBlock(block, index)).join("");
}

function renderBlock(block, index) {
  if (!block) return "";
  switch (block.type) {
    case "image": return renderImageBlock(block, index);
    case "carousel": return renderCarouselBlock(block, index);
    case "comparator": return renderComparatorBlock(block, index);
    case "evolution": return renderEvolutionBlock(block, index);
    case "sketchfab": return renderSketchfabBlock(block, index);
    case "video": return renderVideoBlock(block, index);
    case "pdf": return renderPdfBlock(block, index);
    default: return "";
  }
}

function renderImageBlock(block, index) {
  if (!block.resource || !block.resource.url) return "";
  return `
    <figure class="project-block project-image-block" data-block-index="${index}">
      <div class="project-image-frame protected-media">
        <img class="project-main-image protected-image" src="${escapeHtml(block.resource.url)}" alt="${escapeHtml(block.reference)}" loading="lazy" draggable="false">
      </div>
    </figure>
  `;
}

function renderCarouselBlock(block, index) {
  const images = Array.isArray(block.images) ? block.images : [];
  if (!images.length) return "";
  const carouselId = `project-carousel-${index}`;

  return `
    <section class="project-block project-carousel-block" data-carousel="${carouselId}">
      <div class="project-carousel">
        <button type="button" class="project-carousel-button project-carousel-prev" data-carousel-action="prev" aria-label="Anterior">←</button>
        <div class="project-carousel-stage protected-media">
          ${images.map((image, imageIndex) => `
            <img class="project-carousel-image protected-image ${imageIndex === 0 ? "is-active" : ""}" src="${escapeHtml(image.url)}" alt="${escapeHtml(image.name)}" loading="${imageIndex === 0 ? "eager" : "lazy"}" draggable="false" data-carousel-index="${imageIndex}">
          `).join("")}
        </div>
        <button type="button" class="project-carousel-button project-carousel-next" data-carousel-action="next" aria-label="Siguiente">→</button>
      </div>
      <div class="project-carousel-counter">
        <span data-carousel-current>01</span> / <span>${String(images.length).padStart(2, "0")}</span>
      </div>
      ${block.text ? `<p class="project-block-caption">${escapeHtml(block.text)}</p>` : ""}
    </section>
  `;
}

function renderComparatorBlock(block, index) {
  const images = Array.isArray(block.images) ? block.images : [];
  if (images.length < 2) return "";
  return `
    <section class="project-block project-comparator-block" data-block-index="${index}">
      <div class="project-comparator protected-media">
        <div class="project-comparator-image"><img class="protected-image" src="${escapeHtml(images[0].url)}" alt="${escapeHtml(images[0].name)}" draggable="false"></div>
        <div class="project-comparator-divider"></div>
        <div class="project-comparator-image"><img class="protected-image" src="${escapeHtml(images[1].url)}" alt="${escapeHtml(images[1].name)}" draggable="false"></div>
      </div>
      ${block.text ? `<p class="project-block-caption">${escapeHtml(block.text)}</p>` : ""}
    </section>
  `;
}

function renderEvolutionBlock(block, index) {
  const images = Array.isArray(block.images) ? block.images : [];
  if (!images.length) return "";
  return `
    <section class="project-block project-evolution-block" data-block-index="${index}">
      <div class="project-evolution">
        ${images.map((image, imageIndex) => `
          <figure class="project-evolution-item">
            <div class="project-evolution-image protected-media">
              <img class="protected-image" src="${escapeHtml(image.url)}" alt="${escapeHtml(image.name)}" loading="lazy" draggable="false">
            </div>
            <figcaption>${String(imageIndex + 1).padStart(2, "0")}</figcaption>
          </figure>
        `).join("")}
      </div>
      ${block.text ? `<p class="project-block-caption">${escapeHtml(block.text)}</p>` : ""}
    </section>
  `;
}

function renderSketchfabBlock(block, index) {
  const items = Array.isArray(block.items) ? block.items : [];
  if (!items.length) return "";
  return `
    <section class="project-block project-sketchfab-block" data-block-index="${index}">
      <div class="project-sketchfab-grid">
        ${items.map((item, sketchIndex) => renderSketchfabItem(item, sketchIndex)).join("")}
      </div>
    </section>
  `;
}

function renderSketchfabItem(item, index) {
  const url = item?.url || "";
  if (!url) return "";
  const sketchfabId = extractSketchfabId(url);
  if (!sketchfabId) {
    return `<div class="project-sketchfab-item"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Ver modelo 3D</a></div>`;
  }
  return `
    <div class="project-sketchfab-item">
      <div class="project-sketchfab-frame">
        <iframe src="https://sketchfab.com/models/${escapeHtml(sketchfabId)}/embed" title="Modelo 3D ${index + 1}" loading="lazy" allow="autoplay; fullscreen; xr-spatial-tracking;" allowfullscreen></iframe>
      </div>
    </div>
  `;
}

function extractSketchfabId(url) {
  const value = String(url ?? "").trim();
  const modelMatch = value.match(/sketchfab\.com\/models\/([a-zA-Z0-9]+)/);
  if (modelMatch) return modelMatch[1];
  return null;
}

function renderVideoBlock(block, index) {
  const resource = block.resource;
  if (!resource || !resource.url) return "";
  const url = resource.url;
  if (/youtube\.com|youtu\.be/i.test(url)) {
    const youtubeId = extractYoutubeId(url);
    if (youtubeId) {
      return `
        <section class="project-block project-video-block" data-block-index="${index}">
          <div class="project-video-frame">
            <iframe src="https://www.youtube.com/embed/${escapeHtml(youtubeId)}" title="Vídeo del proyecto" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;" allowfullscreen></iframe>
          </div>
        </section>
      `;
    }
  }
  return `
    <section class="project-block project-video-block" data-block-index="${index}">
      <div class="project-video-frame">
        <video class="project-video" controls preload="metadata"><source src="${escapeHtml(url)}">Tu navegador no admite la reproducción de vídeo.</video>
      </div>
    </section>
  `;
}

function extractYoutubeId(url) {
  const value = String(url ?? "");
  const patterns = [/youtu\.be\/([^?&/]+)/i, /youtube\.com\/watch\?v=([^?&/]+)/i, /youtube\.com\/embed\/([^?&/]+)/i];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function renderPdfBlock(block, index) {
  const resource = block.resource;
  if (!resource || !resource.url) return "";
  return `
    <section class="project-block project-pdf-block" data-block-index="${index}">
      <div class="project-pdf-header" style="margin-bottom: 12px; font-family: var(--font-body); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;">
        <span>Documento / </span>
        <a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--black); font-weight:bold;">Abrir PDF en pestaña nueva</a>
      </div>
      <div class="project-pdf-frame">
        <iframe src="${escapeHtml(resource.url)}#toolbar=0" title="${escapeHtml(block.reference)}" loading="lazy"></iframe>
      </div>
    </section>
  `;
}

function initialiseViewerInteractions() {
  initialiseCarousels();
  initialiseImageZoom();
}

function initialiseCarousels() {
  const carousels = document.querySelectorAll("[data-carousel]");
  carousels.forEach(carousel => {
    const images = carousel.querySelectorAll(".project-carousel-image");
    const prev = carousel.querySelector('[data-carousel-action="prev"]');
    const next = carousel.querySelector('[data-carousel-action="next"]');
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

    prev?.addEventListener("click", () => {
      current = current <= 0 ? images.length - 1 : current - 1;
      update();
    });

    next?.addEventListener("click", () => {
      current = current >= images.length - 1 ? 0 : current + 1;
      update();
    });

    update();
  });
}

function initialiseImageZoom() {
  const images = document.querySelectorAll(".project-main-image, .project-carousel-image, .project-comparator-image img, .project-evolution-image img");
  images.forEach(image => {
    image.addEventListener("click", () => { openImageZoom(image.src, image.alt); });
  });
}

function openImageZoom(src, alt) {
  let modal = document.getElementById("visor-image-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "visor-image-modal";
    modal.className = "project-lightbox";
    modal.innerHTML = `
      <button type="button" class="project-lightbox-close" aria-label="Cerrar">×</button>
      <div class="project-lightbox-inner">
        <img class="visor-image-modal-image protected-image" src="" alt="" draggable="false">
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector(".project-lightbox-close").addEventListener("click", () => {
      modal.classList.remove("is-open");
      document.body.classList.remove("lightbox-open");
    });

    modal.addEventListener("click", event => {
      if (event.target === modal) {
        modal.classList.remove("is-open");
        document.body.classList.remove("lightbox-open");
      }
    });
  }

  const modalImage = modal.querySelector(".visor-image-modal-image");
  modalImage.src = src;
  modalImage.alt = alt || "";
  modal.classList.add("is-open");
  document.body.classList.add("lightbox-open");
  applyProtectedMedia();
}

function applyProtectedMedia() {
  const protectedImages = document.querySelectorAll(".protected-image");
  protectedImages.forEach(image => {
    image.setAttribute("draggable", "false");
    image.addEventListener("dragstart", event => event.preventDefault());
    image.addEventListener("contextmenu", event => event.preventDefault());
  });

  const protectedContainers = document.querySelectorAll(".protected-media");
  protectedContainers.forEach(container => {
    container.addEventListener("contextmenu", event => event.preventDefault());
  });
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    const modal = document.getElementById("visor-image-modal");
    if (modal) {
      modal.classList.remove("is-open");
      document.body.classList.remove("lightbox-open");
    }
  }
});
