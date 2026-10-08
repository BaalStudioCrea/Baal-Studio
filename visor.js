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
  ".project-pdf-frame"
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
   BLOQUES
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

  /*
   * NO SE ORDENA.
   *
   * El orden recibido desde Supabase
   * es el orden definido en proyecto.txt.
   */

  return blocks
    .map(
      (block, index) =>
        renderBlock(
          block,
          index
        )
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
          ←
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
          →
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

  const url =
    item.url || "";

  const title =
    item.title ||
    `Modelo 3D ${index + 1}`;

  const thumbnail =
    item.thumbnail_url ||
    "";

  const embedUrl =
    item.embed_url ||
    "";

  return `

    <article
      class="project-sketchfab-item"
      data-sketchfab-url="${escapeHtml(
        url
      )}"
      data-sketchfab-embed="${escapeHtml(
        embedUrl
      )}"
    >

      <div
        class="project-sketchfab-preview protected-media"
        data-sketchfab-preview
      >

        ${
          thumbnail
            ? `
              <img
                class="project-sketchfab-thumbnail protected-image"
                src="${escapeHtml(
                  thumbnail
                )}"
                alt="${escapeHtml(
                  title
                )}"
                draggable="false"
              >
            `
            : `
              <div
                class="project-sketchfab-placeholder"
              ></div>
            `
        }


        <div
          class="project-sketchfab-preview-overlay"
        >

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


      <div
        class="project-sketchfab-title"
      >
        ${escapeHtml(title)}
      </div>

    </article>

  `;
}


/* ============================================================
   VÍDEO
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
        class="project-video-frame"
      >

        ${
          youtubeId

            ? `

              <iframe
                src="https://www.youtube.com/embed/${escapeHtml(
                  youtubeId
                )}"
                title="Vídeo del proyecto"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>

            `

            : `

              <video
                class="project-video"
                controls
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
   PDF
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


  document
    .querySelectorAll(
      ".project-main-image, .project-carousel-image, .project-comparator-image img, .project-evolution-image img"
    )
    .forEach(
      (image) => {

        image.addEventListener(
          "click",
          () => {

            openImageZoom(
              image.src,
              image.alt || ""
            );

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
          event.target === modal
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

  modal.classList.remove(
    "is-open"
  );

  document.body.classList.remove(
    "lightbox-open"
  );
}


/* ============================================================
   SKETCHFAB
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
          async () => {

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

            const source =
              item.dataset.sketchfabUrl ||
              "";

            let embedUrl =
              item.dataset.sketchfabEmbed ||
              "";

            button.disabled = true;

            button.textContent =
              "Cargando…";

            try {

              if (
                !embedUrl &&
                source
              ) {

                const response =
                  await fetch(
                    `https://sketchfab.com/oembed?url=${encodeURIComponent(
                      source
                    )}&format=json`,
                    {
                      headers: {
                        Accept:
                          "application/json"
                      }
                    }
                  );

                if (response.ok) {

                  const data =
                    await response.json();

                  const html =
                    String(
                      data?.html || ""
                    );

                  const match =
                    html.match(
                      /<iframe[^>]+src=["']([^"']+)["']/i
                    );

                  embedUrl =
                    match?.[1] || "";
                }
              }

              if (!embedUrl) {

                throw new Error(
                  "No se pudo obtener el visor 3D."
                );
              }

              preview.innerHTML = `

                <iframe
                  class="project-sketchfab-iframe"
                  src="${escapeHtml(
                    embedUrl
                  )}"
                  title="Modelo 3D"
                  loading="eager"
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  allowfullscreen
                ></iframe>

              `;

              item.classList.add(
                "is-loaded"
              );

            } catch (error) {

              console.error(
                "[Baal Studio] Error cargando Sketchfab:",
                error
              );

              button.disabled =
                false;

              button.textContent =
                "Cargar modelo 3D";
            }
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
                  ← Anterior
                </span>

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
                  Siguiente →
                </span>

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
