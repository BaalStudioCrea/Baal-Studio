/* ============================================================
   BAAL STUDIO — VISOR.JS
   Visor editorial de proyectos
   ============================================================ */

const SUPABASE_URL =
  "https://hlyzyeatnbulyfiiwvsq.supabase.co";

const VISOR_FUNCTION =
  `${SUPABASE_URL}/functions/v1/visor`;

const PROTECTED_SELECTOR = [
  ".protected-image",
  ".protected-media",
  ".project-sketchfab-preview",
  ".project-pdf-frame",
  ".project-video-frame",
  ".project-protection-overlay",
  ".project-youtube-overlay"
].join(",");


/* ============================================================
   INICIO
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadProjectViewer();

    installViewerProtection();

  }
);


/* ============================================================
   PARÁMETRO
   ============================================================ */

function getProjectParameter() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  return (
    params.get("project") ||
    ""
  ).trim();
}


/* ============================================================
   SEGURIDAD HTML
   ============================================================ */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* ============================================================
   CONTENEDOR
   ============================================================ */

function getViewerContainer() {

  return document.getElementById(
    "project-viewer-content"
  );
}


/* ============================================================
   MENSAJES
   ============================================================ */

function showMessage(
  message,
  type = "loading"
) {

  const container =
    getViewerContainer();

  if (!container) {
    return;
  }

  container.innerHTML = `
    <section class="visor-state visor-state-${escapeHtml(type)}">
      <p>
        <strong>
          ${escapeHtml(message)}
        </strong>
      </p>
    </section>
  `;
}


/* ============================================================
   CARGA DEL PROYECTO
   ============================================================ */

async function loadProjectViewer() {

  const requestedProject =
    getProjectParameter();

  if (!requestedProject) {

    showMessage(
      "No se ha especificado ningún proyecto.",
      "error"
    );

    return;
  }

  showMessage(
    "Cargando proyecto…",
    "loading"
  );

  try {

    const response =
      await fetch(
        `${VISOR_FUNCTION}?project=${encodeURIComponent(
          requestedProject
        )}`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json"
          },
          cache: "no-store"
        }
      );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success ||
      !result.project
    ) {

      throw new Error(
        result.error ||
        `La función visor respondió ${response.status}.`
      );
    }

    renderProject(
      result.project
    );

  } catch (error) {

    console.error(
      "[Baal Studio] Error cargando proyecto:",
      error
    );

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

  const container =
    getViewerContainer();

  if (!container) {
    return;
  }

  const metadata =
    project.metadata || {};

  const title =
    metadata.titulo ||
    project.id ||
    "Proyecto";

  const blocks =
    Array.isArray(project.blocks)
      ? project.blocks
      : [];

  container.innerHTML = `

    <article
      class="project-viewer"
      data-project-id="${escapeHtml(project.id)}"
    >

      ${renderProjectIntro(project)}

      ${renderProjectDescription(
        metadata.descripcion
      )}

      <div class="project-viewer-content">

        ${renderBlocks(blocks)}

      </div>

      ${renderProjectNavigation(
        project.navigation
      )}

    </article>
  `;

  document.title =
    `${title} — Baal Studio`;

  initialiseCarousels();

  initialiseMediaZoom();

  initialiseSketchfab();

  initialiseYoutubeVideos();

  initialiseNavigation();

  applyProtectedMedia();
}


/* ============================================================
   INTRO
   ============================================================ */

function renderProjectIntro(project) {

  const metadata =
    project.metadata || {};

  const title =
    metadata.titulo ||
    project.id ||
    "Proyecto";

  const category =
    joinValue(
      metadata.categoria
    );

  const subcategory =
    joinValue(
      metadata.subcategoria
    );

  const location =
    metadata.localizacion || "";

  const year =
    metadata.año || "";

  const techniques =
    joinValue(
      metadata.tecnicas
    );

  const objectives =
    joinValue(
      metadata.objetivo
    );

  const authorship =
    metadata.autoria || "";

  const collaboration =
    metadata.colaboracion || "";

  const articles =
    Array.isArray(project.articles)
      ? project.articles
      : [];

  return `

    <header class="project-viewer-intro">

      <div class="project-viewer-intro-inner">

        <div class="project-viewer-title-block">

          <p class="project-viewer-title-en">
            Project
          </p>

          <h1 class="project-viewer-title">
            ${escapeHtml(title)}
          </h1>

        </div>


        <div class="project-viewer-summary">

          ${renderMetadataItem(
            "Localización",
            "Location",
            location
          )}

          ${renderMetadataItem(
            "Categoría",
            "Category",
            category
          )}

          ${renderMetadataItem(
            "Subcategoría",
            "Subcategory",
            subcategory
          )}

          ${renderMetadataItem(
            "Año",
            "Year",
            year
          )}

          ${renderMetadataItem(
            "Técnicas",
            "Techniques",
            techniques
          )}

          ${renderMetadataItem(
            "Objetivo",
            "Purpose",
            objectives
          )}

          ${renderMetadataItem(
            "Autoría",
            "Authorship",
            authorship
          )}

          ${renderMetadataItem(
            "Colaboración",
            "Collaboration",
            collaboration
          )}

          ${
            articles.length
              ? renderArticles(articles)
              : ""
          }

        </div>

      </div>

    </header>
  `;
}


function joinValue(value) {

  if (Array.isArray(value)) {

    return value
      .filter(Boolean)
      .join(" · ");
  }

  return String(
    value || ""
  ).trim();
}


function renderMetadataItem(
  label,
  english,
  value
) {

  if (!value) {
    return "";
  }

  return `

    <div class="project-viewer-summary-item">

      <div class="project-viewer-summary-label">
        ${escapeHtml(label)}
      </div>

      <div class="project-viewer-summary-label-en">
        ${escapeHtml(english)}
      </div>

      <div class="project-viewer-summary-value">
        ${escapeHtml(value)}
      </div>

    </div>

  `;
}


function renderArticles(articles) {

  return `

    <div class="project-viewer-summary-item">

      <div class="project-viewer-summary-label">
        Artículos
      </div>

      <div class="project-viewer-summary-label-en">
        Sources
      </div>

      <div class="project-viewer-summary-value project-viewer-articles">

        ${articles
          .map(
            (url, index) => `

              <a
                href="${escapeHtml(url)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Fuente ${index + 1}
              </a>

            `
          )
          .join("")}

      </div>

    </div>

  `;
}


/* ============================================================
   DESCRIPCIÓN
   ============================================================ */

function renderProjectDescription(
  description
) {

  if (!description) {
    return "";
  }

  const paragraphs =
    String(description)
      .split(/\n\s*\n/)
      .map(
        (paragraph) =>
          paragraph.trim()
      )
      .filter(Boolean);

  return `

    <section
      class="project-viewer-description"
    >

      <div
        class="project-viewer-description-heading"
      >

        <div
          class="project-viewer-description-title"
        >
          Descripción
        </div>

        <div
          class="project-viewer-description-en"
        >
          Project description
        </div>

      </div>


      <div
        class="project-viewer-description-text"
      >

        ${paragraphs
          .map(
            (paragraph) =>
              `<p>${escapeHtml(
                paragraph
              )}</p>`
          )
          .join("")}

      </div>

    </section>

  `;
}


/* ============================================================
   BLOQUES Y FRANJAS ALTERNADAS
   ============================================================ */

function renderBlocks(blocks) {

  if (!blocks.length) {

    return `

      <section class="project-viewer-empty">

        <p>
          No hay contenido visual disponible
          para este proyecto.
        </p>

      </section>

    `;
  }

  let validBlockCount = 0;

  return blocks
    .map(
      (block, index) => {

        const blockHtml = renderBlock(block, index);

        if (!blockHtml) {
          return "";
        }

        validBlockCount++;

        // Alterna entre franja oscura (#181818) y beige (#e9e5dc)
        const stripeClass =
          validBlockCount % 2 === 1
            ? "stripe-dark"
            : "stripe-warm";

        return `
          <div class="project-block-stripe ${stripeClass}">
            ${blockHtml}
          </div>
        `;

      }
    )
    .join("");
}


function renderBlock(
  block,
  index
) {

  if (!block) {
    return "";
  }

  switch (
    String(
      block.type || ""
    ).toLowerCase()
  ) {

    case "image":
      return renderImageBlock(
        block,
        index
      );

    case "carousel":
      return renderCarouselBlock(
        block,
        index
      );

    case "comparator":
      return renderComparatorBlock(
        block,
        index
      );

    case "evolution":
      return renderEvolutionBlock(
        block,
        index
      );

    case "sketchfab":
      return renderSketchfabBlock(
        block,
        index
      );

    case "video":
      return renderVideoBlock(
        block,
        index
      );

    case "pdf":
      return renderPdfBlock(
        block,
        index
      );

    default:
      return "";
  }
}


/* ============================================================
   PIE / CAPTION
   ============================================================ */

function renderCaption(text) {

  if (!text) {
    return "";
  }

  return `

    <p class="project-block-caption">
      ${escapeHtml(text)}
    </p>

  `;
}


/* ============================================================
   IMAGEN INDIVIDUAL
   ============================================================ */

function renderImageBlock(
  block,
  index
) {

  const resource =
    block.resource;

  if (!resource?.url) {
    return "";
  }

  return `

    <figure
      class="project-block project-image-block"
      data-block-index="${index}"
    >

      <div
        class="project-single-image protected-media"
      >

        <img
          class="project-main-image protected-image"
          src="${escapeHtml(resource.url)}"
          alt="${escapeHtml(
            block.reference ||
            resource.name ||
            "Imagen del proyecto"
          )}"
          loading="lazy"
          draggable="false"
        >

        ${renderZoomButton(
          "Ampliar imagen",
          "project-image-zoom"
        )}

      </div>

      ${renderCaption(
        block.text
      )}

    </figure>

  `;
}


/* ============================================================
   CARRUSEL
   ============================================================ */

function renderCarouselBlock(
  block,
  index
) {

  const images =
    Array.isArray(block.images)
      ? block.images.filter(
          (item) => item?.url
        )
      : [];

  if (!images.length) {
    return "";
  }

  const carouselId =
    `project-carousel-${index}`;

  return `

    <section
      class="project-block project-carousel-block"
      data-carousel="${carouselId}"
    >

      <div
        class="portfolio-media-viewer"
      >

        <button
          type="button"
          class="project-carousel-button project-carousel-prev"
          data-carousel-action="prev"
          aria-label="Imagen anterior"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>


        <div
          class="portfolio-media-stage protected-media"
        >

          ${images
            .map(
              (image, imageIndex) => `

                <img
                  class="project-carousel-image protected-image ${
                    imageIndex === 0
                      ? "is-active"
                      : ""
                  }"
                  src="${escapeHtml(
                    image.url
                  )}"
                  alt="${escapeHtml(
                    image.name ||
                    "Imagen del proyecto"
                  )}"
                  loading="${
                    imageIndex === 0
                      ? "eager"
                      : "lazy"
                  }"
                  draggable="false"
                  data-carousel-index="${imageIndex}"
                >

              `
            )
            .join("")}


          ${renderZoomButton(
            "Ampliar imagen",
            "project-carousel-zoom"
          )}

        </div>


        <button
          type="button"
          class="project-carousel-button project-carousel-next"
          data-carousel-action="next"
          aria-label="Imagen siguiente"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

      </div>


      <div
        class="project-carousel-counter"
      >

        <span data-carousel-current>
          01
        </span>

        /

        <span>
          ${String(
            images.length
          ).padStart(2, "0")}
        </span>

      </div>


      ${renderCaption(
        block.text
      )}

    </section>

  `;
}


/* ============================================================
   COMPARADOR
   ============================================================ */

function renderComparatorBlock(
  block,
  index
) {

  const images =
    Array.isArray(block.images)
      ? block.images.filter(
          (item) => item?.url
        )
      : [];

  if (images.length < 2) {
    return "";
  }

  return `

    <section
      class="project-block project-comparator-block"
      data-block-index="${index}"
    >

      <div class="project-comparator">

        <div
          class="project-comparator-image protected-media"
        >

          <img
            class="protected-image"
            src="${escapeHtml(
              images[0].url
            )}"
            alt="${escapeHtml(
              images[0].name ||
              "Imagen 1"
            )}"
            draggable="false"
          >

          ${renderZoomButton(
            "Ampliar imagen",
            "project-comparator-zoom"
          )}

        </div>


        <div
          class="project-comparator-divider"
          aria-hidden="true"
        ></div>


        <div
          class="project-comparator-image protected-media"
        >

          <img
            class="protected-image"
            src="${escapeHtml(
              images[1].url
            )}"
            alt="${escapeHtml(
              images[1].name ||
              "Imagen 2"
            )}"
            draggable="false"
          >

          ${renderZoomButton(
            "Ampliar imagen",
            "project-comparator-zoom"
          )}

        </div>

      </div>


      ${renderCaption(
        block.text
      )}

    </section>

  `;
}


/* ============================================================
   EVOLUCIÓN
   ============================================================ */

function renderEvolutionBlock(
  block,
  index
) {

  const images =
    Array.isArray(block.images)
      ? block.images.filter(
          (item) => item?.url
        )
      : [];

  if (!images.length) {
    return "";
  }

  return `

    <section
      class="project-block project-evolution-block"
      data-block-index="${index}"
    >

      <div class="project-evolution">

        ${images
          .map(
            (image) => `

              <figure
                class="project-evolution-item"
              >

                <div
                  class="project-evolution-image protected-media"
                >

                  <img
                    class="protected-image"
                    src="${escapeHtml(
                      image.url
                    )}"
                    alt="${escapeHtml(
                      image.name ||
                      "Imagen del proceso"
                    )}"
                    loading="lazy"
                    draggable="false"
                  >

                  ${renderZoomButton(
                    "Ampliar imagen",
                    "project-evolution-zoom"
                  )}

                </div>

              </figure>

            `
          )
          .join("")}

      </div>


      ${renderCaption(
        block.text
      )}

    </section>

  `;
}


/* ============================================================
   PARSEAR SKETCHFAB (SOPORTA HTML EMBED COMPLETO, URLS O IDS)
   ============================================================ */

function parseSketchfabData(rawInput) {

  const str = String(rawInput || "").trim();

  if (!str) {
    return { embedUrl: "", webUrl: "", title: "" };
  }

  let sourceUrl = str;
  const iframeMatch = str.match(/src=["']([^"']+)["']/i);

  if (iframeMatch) {
    sourceUrl = iframeMatch[1];
  }

  let title = "";
  const titleMatch = str.match(/title=["']([^"']+)["']/i);

  if (titleMatch) {
    title = titleMatch[1];
  }

  let id = "";
  const hexMatch = sourceUrl.match(/([a-fA-F0-9]{32})/);

  if (hexMatch) {
    id = hexMatch[1];
  } else {
    const altMatch = sourceUrl.match(/(?:models|3d-models|skfb\.ly)\/(?:[a-zA-Z0-9-]+-)?([a-zA-Z0-9]+)/i);

    if (altMatch) {
      id = altMatch[1];
    }
  }

  let embedUrl = "";
  let webUrl = "";

  if (id) {
    embedUrl = `https://sketchfab.com/models/${id}/embed?autostart=1&ui_controls=1&ui_infos=0`;
    webUrl = `https://sketchfab.com/3d-models/${id}`;
  } else if (sourceUrl.startsWith("http")) {
    embedUrl = sourceUrl;
    webUrl = sourceUrl;
  }

  return { embedUrl, webUrl, title };
}


/* ============================================================
   SKETCHFAB
   ============================================================ */

function renderSketchfabBlock(
  block,
  index
) {

  const items =
    Array.isArray(block.items)
      ? block.items.filter(
          (item) => item?.url
        )
      : [];

  if (!items.length) {
    return "";
  }

  return `

    <section
      class="project-block project-sketchfab-block"
      data-block-index="${index}"
    >

      <div class="project-sketchfab-grid">

        ${items
          .map(
            (item, itemIndex) =>
              renderSketchfabItem(
                item,
                itemIndex
              )
          )
          .join("")}

      </div>


      ${renderCaption(
        block.text
      )}

    </section>

  `;
}


function renderSketchfabItem(
  item,
  index
) {

  const rawUrl = item.url || "";

  const {
    embedUrl,
    webUrl,
    title: extractedTitle
  } = parseSketchfabData(rawUrl);

  const title =
    extractedTitle ||
    item.title ||
    `Modelo 3D ${String(index + 1).padStart(2, "0")}`;

  return `

    <article
      class="project-sketchfab-item"
      data-sketchfab-embed="${escapeHtml(embedUrl)}"
    >

      <div
        class="project-sketchfab-preview protected-media"
        data-sketchfab-preview
      >

        <div class="project-sketchfab-placeholder">
          <div class="sketchfab-3d-icon">3D</div>
        </div>


        <div class="project-sketchfab-preview-overlay">

          <button
            type="button"
            class="project-sketchfab-load"
          >
            Cargar modelo 3D
          </button>

          <span>
            Sketchfab
          </span>

        </div>

      </div>


      <div class="project-sketchfab-info">

        <div class="project-sketchfab-title">
          ${escapeHtml(title)}
        </div>

        ${
          webUrl
            ? `
              <a
                href="${escapeHtml(webUrl)}"
                target="_blank"
                rel="noopener noreferrer"
                class="project-sketchfab-link"
              >
                Ver en Sketchfab ↗
              </a>
            `
            : ""
        }

      </div>

    </article>

  `;
}


/* ============================================================
   VÍDEO CON PROTECCIÓN Y BOTÓN FLOTANTE
   ============================================================ */

function renderVideoBlock(
  block,
  index
) {

  const resource =
    block.resource;

  if (!resource?.url) {
    return "";
  }

  const url =
    resource.url;

  const youtubeId =
    extractYoutubeId(url);

  return `

    <section
      class="project-block project-video-block"
      data-block-index="${index}"
    >

      <div
        class="project-video-frame protected-media"
        data-youtube-container
      >

        ${
          youtubeId

            ? `

              <iframe
                class="project-youtube-iframe"
                src="https://www.youtube.com/embed/${escapeHtml(
                  youtubeId
                )}?enablejsapi=1&rel=0&modestbranding=1"
                title="Vídeo del proyecto"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>

              <div class="project-youtube-overlay">

                <button
                  type="button"
                  class="project-youtube-play-btn"
                  aria-label="Reproducir / Pausar vídeo"
                  data-yt-control="toggle"
                >

                  <svg
                    class="icon-play"
                    viewBox="0 0 24 24"
                    width="32"
                    height="32"
                    fill="currentColor"
                  >
                    <polygon points="5,3 19,12 5,21"></polygon>
                  </svg>

                  <svg
                    class="icon-pause"
                    viewBox="0 0 24 24"
                    width="32"
                    height="32"
                    fill="currentColor"
                    style="display:none;"
                  >
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>

                </button>

              </div>

              <div class="project-youtube-topbar">

                <a
                  href="https://www.youtube.com/watch?v=${escapeHtml(
                    youtubeId
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="project-youtube-link"
                >
                  Ver en YouTube ↗
                </a>

              </div>

            `

            : `

              <video
                class="project-video"
                controls
                controlsList="nodownload"
                preload="metadata"
              >

                <source
                  src="${escapeHtml(
                    url
                  )}"
                >

                Tu navegador no admite
                la reproducción de vídeo.

              </video>

            `
        }

      </div>


      ${renderCaption(
        block.text
      )}

    </section>

  `;
}


function extractYoutubeId(url) {

  const value =
    String(url || "");

  const patterns = [

    /youtu\.be\/([^?&/]+)/i,

    /youtube\.com\/watch\?v=([^?&/]+)/i,

    /youtube\.com\/embed\/([^?&/]+)/i

  ];

  for (
    const pattern of patterns
  ) {

    const match =
      value.match(pattern);

    if (match) {
      return match[1];
    }
  }

  return null;
}


/* ============================================================
   CONTROL DE VÍDEOS DE YOUTUBE VÍA API
   ============================================================ */

function initialiseYoutubeVideos() {

  document
    .querySelectorAll(
      "[data-youtube-container]"
    )
    .forEach(
      (container) => {

        const iframe =
          container.querySelector(
            ".project-youtube-iframe"
          );

        const playBtn =
          container.querySelector(
            '[data-yt-control="toggle"]'
          );

        const overlay =
          container.querySelector(
            ".project-youtube-overlay"
          );

        if (!iframe || !playBtn) {
          return;
        }

        let isPlaying = false;

        playBtn.addEventListener(
          "click",
          () => {

            const iconPlay =
              playBtn.querySelector(
                ".icon-play"
              );

            const iconPause =
              playBtn.querySelector(
                ".icon-pause"
              );

            if (!isPlaying) {

              iframe.contentWindow.postMessage(
                '{"event":"command","func":"playVideo","args":""}',
                "*"
              );

              isPlaying = true;

              container.classList.add(
                "is-playing"
              );

              if (iconPlay)
                iconPlay.style.display =
                  "none";

              if (iconPause)
                iconPause.style.display =
                  "block";

            } else {

              iframe.contentWindow.postMessage(
                '{"event":"command","func":"pauseVideo","args":""}',
                "*"
              );

              isPlaying = false;

              container.classList.remove(
                "is-playing"
              );

              if (iconPlay)
                iconPlay.style.display =
                  "block";

              if (iconPause)
                iconPause.style.display =
                  "none";

            }
          }
        );

        overlay?.addEventListener(
          "click",
          (event) => {

            if (
              event.target === overlay
            ) {

              playBtn.click();

            }

          }
        );

      }
    );
}


/* ============================================================
   PDF (MANTENIDO PARA RECURSOS LEGACY)
   ============================================================ */

function renderPdfBlock(
  block,
  index
) {

  const resource =
    block.resource;

  if (!resource?.url) {
    return "";
  }

  const pdfUrl =
    `${resource.url}#toolbar=0&navpanes=0&scrollbar=1&view=Fit`;

  return `

    <section
      class="project-block project-pdf-block"
      data-block-index="${index}"
    >

      <div
        class="project-pdf-frame protected-media"
      >

        <div class="project-protection-overlay"></div>

        <iframe
          src="${escapeHtml(
            pdfUrl
          )}"
          title="${escapeHtml(
            block.reference ||
            "Documento PDF"
          )}"
          loading="lazy"
        ></iframe>

      </div>


      ${renderCaption(
        block.text
      )}

    </section>

  `;
}


/* ============================================================
   LUPA
   ============================================================ */

function renderZoomButton(
  label,
  extraClass = ""
) {

  return `

    <button
      type="button"
      class="project-media-zoom ${extraClass}"
      data-zoom-current
      aria-label="${escapeHtml(
        label
      )}"
      title="${escapeHtml(
        label
      )}"
    >

      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >

        <circle
          cx="10.8"
          cy="10.8"
          r="5.8"
        ></circle>

        <path
          d="M15.2 15.2 21 21"
        ></path>

        <path
          d="M10.8 8.2v5.2M8.2 10.8h5.2"
        ></path>

      </svg>

    </button>

  `;
}


/* ============================================================
   CARRUSELES
   ============================================================ */

function initialiseCarousels() {

  document
    .querySelectorAll(
      "[data-carousel]"
    )
    .forEach(
      (carousel) => {

        const images =
          Array.from(
            carousel.querySelectorAll(
              ".project-carousel-image"
            )
          );

        const prev =
          carousel.querySelector(
            '[data-carousel-action="prev"]'
          );

        const next =
          carousel.querySelector(
            '[data-carousel-action="next"]'
          );

        const counter =
          carousel.querySelector(
            "[data-carousel-current]"
          );

        let current = 0;

        function update() {

          images.forEach(
            (image, index) => {

              image.classList.toggle(
                "is-active",
                index === current
              );

            }
          );

          if (counter) {

            counter.textContent =
              String(
                current + 1
              ).padStart(
                2,
                "0"
              );
          }
        }

        prev?.addEventListener(
          "click",
          () => {

            current =
              current <= 0
                ? images.length - 1
                : current - 1;

            update();
          }
        );

        next?.addEventListener(
          "click",
          () => {

            current =
              current >=
              images.length - 1
                ? 0
                : current + 1;

            update();
          }
        );

        update();
      }
    );
}


/* ============================================================
   ZOOM
   ============================================================ */

function initialiseMediaZoom() {

  document
    .querySelectorAll(
      "[data-zoom-current]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          (event) => {

            event.preventDefault();
            event.stopPropagation();

            const image =
              button
                .closest(
                  ".protected-media"
                )
                ?.querySelector(
                  "img.is-active, img.project-main-image, img.protected-image"
                );

            if (image) {

              openImageZoom(
                image.src,
                image.alt || ""
              );
            }
          }
        );
      }
    );
}


function openImageZoom(
  src,
  alt
) {

  let modal =
    document.getElementById(
      "visor-image-modal"
    );

  if (!modal) {

    modal =
      document.createElement(
        "div"
      );

    modal.id =
      "visor-image-modal";

    modal.className =
      "project-lightbox";

    modal.innerHTML = `

      <button
        type="button"
        class="project-lightbox-close"
        aria-label="Cerrar"
      >
        ×
      </button>

      <div
        class="project-lightbox-inner protected-media"
      >

        <img
          class="visor-image-modal-image protected-image"
          src=""
          alt=""
          draggable="false"
        >

      </div>

    `;

    document.body.appendChild(
      modal
    );


    modal
      .querySelector(
        ".project-lightbox-close"
      )
      .addEventListener(
        "click",
        closeImageZoom
      );


    modal.addEventListener(
      "click",
      (event) => {

        if (
          event.target === modal ||
          event.target.classList.contains("project-lightbox-inner")
        ) {

          closeImageZoom();

        }
      }
    );
  }

  const image =
    modal.querySelector(
      ".visor-image-modal-image"
    );

  image.src = src;
  image.alt = alt;

  image.classList.remove("is-zoomed");

  if (!image.dataset.zoomBound) {

    image.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        image.classList.toggle(
          "is-zoomed"
        );

      }
    );

    image.dataset.zoomBound = "true";
  }

  modal.classList.add(
    "is-open"
  );

  document.body.classList.add(
    "lightbox-open"
  );

  applyProtectedMedia();
}


function closeImageZoom() {

  const modal =
    document.getElementById(
      "visor-image-modal"
    );

  if (!modal) {
    return;
  }

  const image =
    modal.querySelector(
      ".visor-image-modal-image"
    );

  if (image) {
    image.classList.remove("is-zoomed");
  }

  modal.classList.remove(
    "is-open"
  );

  document.body.classList.remove(
    "lightbox-open"
  );
}


/* ============================================================
   SKETCHFAB INTERACTIVO Y CARGA DIRECTA
   ============================================================ */

function initialiseSketchfab() {

  document
    .querySelectorAll(
      ".project-sketchfab-item"
    )
    .forEach(
      (item) => {

        const button =
          item.querySelector(
            ".project-sketchfab-load"
          );

        if (!button) {
          return;
        }

        button.addEventListener(
          "click",
          () => {

            if (
              item.classList.contains(
                "is-loaded"
              )
            ) {
              return;
            }

            const preview =
              item.querySelector(
                "[data-sketchfab-preview]"
              );

            const embedUrl =
              item.dataset.sketchfabEmbed ||
              "";

            if (!embedUrl) {
              console.error(
                "[Baal Studio] No se encontró una URL de embed válida para este modelo."
              );
              return;
            }

            button.disabled = true;

            button.textContent =
              "Cargando…";

            preview.innerHTML = `

              <iframe
                class="project-sketchfab-iframe"
                src="${escapeHtml(
                  embedUrl
                )}"
                title="Modelo 3D Sketchfab"
                loading="eager"
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowfullscreen
              ></iframe>

            `;

            item.classList.add(
              "is-loaded"
            );

          }
        );
      }
    );
}


/* ============================================================
   NAVEGACIÓN
   ============================================================ */

function initialiseNavigation() {

  document
    .querySelectorAll(
      "[data-project-navigation]"
    )
    .forEach(
      (link) => {

        link.addEventListener(
          "click",
          (event) => {

            const project =
              link.dataset
                .projectNavigation;

            if (!project) {
              return;
            }

            event.preventDefault();

            window.location.href =
              `./visor.html?project=${encodeURIComponent(
                project
              )}`;
          }
        );

      }
    );
}


function renderProjectNavigation(
  navigation
) {

  const previous =
    navigation?.previous ||
    null;

  const next =
    navigation?.next ||
    null;

  return `

    <nav
      class="project-viewer-navigation"
      aria-label="Navegación entre proyectos"
    >

      <div
        class="project-navigation-side project-navigation-prev"
      >

        ${
          previous

            ? `

              <a
                href="./visor.html?project=${encodeURIComponent(
                  previous.id
                )}"
                data-project-navigation="${escapeHtml(
                  previous.id
                )}"
              >

                <span>
                  ← Proyecto anterior
                </span>

                <small>
                  Previous project
                </small>

                <strong>
                  ${escapeHtml(
                    previous.title
                  )}
                </strong>

              </a>

            `

            : ""
        }

      </div>


      <a
        class="project-navigation-all"
        href="./proyectos.html"
      >

        <span>
          Todos los proyectos
        </span>

        <small>
          All projects
        </small>

      </a>


      <div
        class="project-navigation-side project-navigation-next"
      >

        ${
          next

            ? `

              <a
                href="./visor.html?project=${encodeURIComponent(
                  next.id
                )}"
                data-project-navigation="${escapeHtml(
                  next.id
                )}"
              >

                <span>
                  Proyecto siguiente →
                </span>

                <small>
                  Next project
                </small>

                <strong>
                  ${escapeHtml(
                    next.title
                  )}
                </strong>

              </a>

            `

            : ""
        }

      </div>

    </nav>

  `;
}


/* ============================================================
   PROTECCIÓN DE MEDIOS
   ============================================================ */

function applyProtectedMedia() {

  document
    .querySelectorAll(
      PROTECTED_SELECTOR
    )
    .forEach(
      (element) => {

        element.addEventListener(
          "contextmenu",
          blockContextMenu
        );

        element.addEventListener(
          "dragstart",
          blockEvent
        );
      }
    );


  document
    .querySelectorAll(
      ".protected-image"
    )
    .forEach(
      (image) => {

        image.setAttribute(
          "draggable",
          "false"
        );

        image.addEventListener(
          "dragstart",
          blockEvent
        );

        image.addEventListener(
          "contextmenu",
          blockContextMenu
        );

      }
    );
}


/* ============================================================
   PROTECCIÓN GLOBAL DEL VISOR
   ============================================================ */

function installViewerProtection() {

  document.addEventListener(
    "contextmenu",
    (event) => {

      if (
        event.target.closest?.(
          PROTECTED_SELECTOR
        )
      ) {

        event.preventDefault();

      }

    }
  );


  document.addEventListener(
    "dragstart",
    (event) => {

      if (
        event.target.closest?.(
          ".protected-image, .protected-media"
        )
      ) {

        event.preventDefault();

      }

    }
  );


  document.addEventListener(
    "keydown",
    (event) => {

      const viewer =
        event.target.closest?.(
          ".project-viewer, .project-lightbox"
        );

      if (!viewer) {
        return;
      }

      const key =
        String(
          event.key
        ).toLowerCase();

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        ["s", "u"].includes(key)
      ) {

        event.preventDefault();

      }

    }
  );


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape"
      ) {

        closeImageZoom();

      }

    }
  );
}


function blockContextMenu(
  event
) {

  event.preventDefault();
}


function blockEvent(
  event
) {

  event.preventDefault();
}
