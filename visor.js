/* ============================================================
   BAAL STUDIO
   VISOR.JS
   VISOR DINÁMICO DE PROYECTOS
   ============================================================ */


/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

const SUPABASE_URL =
  "https://hlyzyeatnbulyfiiwvsq.supabase.co";

const VISOR_FUNCTION =
  `${SUPABASE_URL}/functions/v1/visor`;

const PROJECTS_FUNCTION =
  `${SUPABASE_URL}/functions/v1/get-projects`;


/* ============================================================
   INICIO
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    loadProjectViewer();
    initialiseGlobalProtection();
  }
);


/* ============================================================
   PARÁMETRO DEL PROYECTO
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
   NORMALIZACIÓN
   ============================================================ */

function normalizeText(value) {

  return String(value ?? "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[._-]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .toLowerCase();

}


/* ============================================================
   ESCAPADO HTML
   ============================================================ */

function escapeHtml(value) {

  return String(value ?? "")
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


/* ============================================================
   CONTENEDOR
   ============================================================ */

function getViewerContainer() {

  const possibleIds = [
    "project-viewer-content",
    "project-viewer",
    "visor-content",
    "project-content",
    "viewer-content",
    "project-detail",
    "project-detail-content"
  ];

  for (
    const id
    of possibleIds
  ) {

    const element =
      document.getElementById(id);

    if (element) {
      return element;
    }

  }

  const main =
    document.querySelector("main");

  return main || null;

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
    <section
      class="project-viewer-state project-viewer-state-${escapeHtml(type)}"
      aria-live="polite"
    >
      <div>
        <strong>
          ${escapeHtml(message)}
        </strong>

        ${
          type === "error"
            ? `
              <span class="project-viewer-state-en">
                Project could not be loaded
              </span>
            `
            : ""
        }
      </div>
    </section>
  `;

}


/* ============================================================
   CARGAR PROYECTO
   ============================================================ */

async function loadProjectViewer() {

  const requestedProject =
    getProjectParameter();

  console.log(
    "[Baal Studio] Parámetro recibido:",
    requestedProject
  );

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

    const endpoint =
      `${VISOR_FUNCTION}?project=${encodeURIComponent(
        requestedProject
      )}`;

    console.log(
      "[Baal Studio] Consultando visor:",
      endpoint
    );

    const response =
      await fetch(
        endpoint,
        {
          method: "GET",
          headers: {
            "Accept":
              "application/json"
          },
          cache: "no-store"
        }
      );

    console.log(
      "[Baal Studio] visor HTTP:",
      response.status
    );

    const result =
      await response.json();

    console.log(
      "[Baal Studio] Respuesta completa de visor:",
      result
    );

    if (!response.ok) {

      throw new Error(
        result.error ||
        `visor respondió ${response.status}`
      );

    }

    if (
      !result.success ||
      !result.project
    ) {

      throw new Error(
        result.error ||
        "La función visor no devolvió un proyecto válido."
      );

    }

    console.log(
      "[Baal Studio] Proyecto recibido:",
      result.project
    );

    renderProject(
      result.project,
      result.navigation || null
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

function renderProject(
  project,
  navigation
) {

  const container =
    getViewerContainer();

  if (!container) {

    console.error(
      "[Baal Studio] No se encontró el contenedor."
    );

    return;
  }

  const metadata =
    project.metadata || {};

  const blocks =
    Array.isArray(project.blocks)
      ? project.blocks
      : [];

  const title =
    cleanDisplayText(
      metadata.titulo ||
      metadata.title ||
      project.title ||
      project.id ||
      "Proyecto"
    );

  container.innerHTML = `
    <article
      class="project-viewer"
      data-project-id="${escapeHtml(
        project.id ||
        project.name ||
        ""
      )}"
    >

      ${renderProjectHeader(project)}

      <div class="project-viewer-body">

        <div class="project-viewer-content">

          ${renderBlocks(blocks)}

        </div>

      </div>

      ${renderProjectNavigation(
        project,
        navigation
      )}

    </article>
  `;

  document.title =
    `${title} — Baal Studio`;

  initialiseViewerInteractions();

  applyProtectedMedia();

}


/* ============================================================
   CABECERA DEL PROYECTO
   ============================================================ */

function renderProjectHeader(
  project
) {

  const metadata =
    project.metadata || {};

  const title =
    cleanDisplayText(
      metadata.titulo ||
      metadata.title ||
      project.title ||
      project.id ||
      "Proyecto"
    );

  const location =
    metadata.localizacion ||
    metadata.location ||
    "";

  const year =
    metadata.año ||
    metadata.ano ||
    metadata.year ||
    "";

  const category =
    formatMetadataValue(
      metadata.categoria ||
      metadata.category ||
      ""
    );

  const subcategory =
    formatMetadataValue(
      metadata.subcategoria ||
      metadata.subcategory ||
      ""
    );

  const techniques =
    formatMetadataValue(
      metadata.tecnicas ||
      metadata.techniques ||
      ""
    );

  const objectives =
    formatMetadataValue(
      metadata.objetivo ||
      metadata.objective ||
      ""
    );

  const authorship =
    metadata.autoria ||
    metadata.authorship ||
    "";

  const collaboration =
    metadata.colaboracion ||
    metadata.collaboration ||
    "";

  const description =
    metadata.descripcion ||
    metadata.description ||
    "";

  const articles =
    Array.isArray(project.articles)
      ? project.articles
      : [];

  return `

    <header class="project-viewer-intro">

      <div class="project-viewer-intro-inner">

        <div class="project-viewer-title-block">

          <span class="project-viewer-title-en">
            Project
          </span>

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
              ? renderArticlesSummary(
                  articles
                )
              : ""
          }

        </div>

      </div>

    </header>


    ${
      description
        ? `
          <section class="project-viewer-description">

            <div class="project-viewer-description-heading">

              <span>
                Descripción
              </span>

              <small>
                Project description
              </small>

            </div>

            <div class="project-viewer-description-copy">

              ${renderParagraphs(
                description
              )}

            </div>

          </section>
        `
        : ""
    }

  `;

}


/* ============================================================
   METADATO
   ============================================================ */

function renderMetadataItem(
  labelEs,
  labelEn,
  value
) {

  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {

    return "";

  }

  return `

    <div class="project-viewer-summary-item">

      <div class="project-viewer-summary-label">

        <span>
          ${escapeHtml(labelEs)}
        </span>

        <small>
          ${escapeHtml(labelEn)}
        </small>

      </div>

      <div class="project-viewer-summary-value">

        ${escapeHtml(
          cleanDisplayText(value)
        )}

      </div>

    </div>

  `;

}


/* ============================================================
   ARTÍCULOS
   ============================================================ */

function renderArticlesSummary(
  articles
) {

  return `

    <div class="project-viewer-summary-item">

      <div class="project-viewer-summary-label">

        <span>
          Artículos
        </span>

        <small>
          Sources
        </small>

      </div>

      <div class="project-viewer-summary-value">

        <div class="project-summary-links">

          ${
            articles
              .map(
                (
                  url,
                  index
                ) => `
                  <a
                    href="${escapeHtml(url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Fuente ${String(
                      index + 1
                    ).padStart(2, "0")}
                  </a>
                `
              )
              .join("")
          }

        </div>

      </div>

    </div>

  `;

}


/* ============================================================
   PÁRRAFOS
   ============================================================ */

function renderParagraphs(
  text
) {

  const normalized =
    String(text ?? "")
      .replace(
        /\r\n/g,
        "\n"
      )
      .replace(
        /\r/g,
        "\n"
      )
      .trim();

  if (!normalized) {
    return "";
  }

  const paragraphs =
    normalized
      .split(
        /\n\s*\n+/
      )
      .map(
        paragraph =>
          paragraph
            .replace(
              /\n/g,
              " "
            )
            .replace(
              /\s+/g,
              " "
            )
            .trim()
      )
      .filter(Boolean);

  return paragraphs
    .map(
      paragraph =>
        `<p>${escapeHtml(
          paragraph
        )}</p>`
    )
    .join("");

}


/* ============================================================
   BLOQUES
   ============================================================ */

function renderBlocks(
  blocks
) {

  if (!blocks.length) {

    return `
      <section class="project-viewer-empty">

        <h2 class="project-viewer-empty-title">
          Sin contenido disponible
        </h2>

        <span class="project-viewer-empty-en">
          No project content available
        </span>

      </section>
    `;

  }

  return blocks
    .map(
      (
        block,
        index
      ) =>
        renderBlock(
          block,
          index
        )
    )
    .join("");

}


/* ============================================================
   BLOQUE INDIVIDUAL
   ============================================================ */

function renderBlock(
  block,
  index
) {

  if (!block) {
    return "";
  }

  const type =
    String(
      block.type ||
      ""
    ).toLowerCase();

  switch (type) {

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

      console.warn(
        "[Baal Studio] Tipo de bloque no reconocido:",
        block
      );

      return "";

  }

}


/* ============================================================
   IMAGEN SUELTA
   ============================================================ */

function renderImageBlock(
  block,
  index
) {

  const resource =
    getResourceFromBlock(
      block
    );

  if (
    !resource ||
    !resource.url
  ) {

    return "";

  }

  const caption =
    getBlockCaption(
      block
    );

  return `

    <section
      class="project-block project-image-block"
      data-block-index="${index}"
    >

      <div class="project-image-stage protected-media">

        <img
          class="project-main-image protected-image"
          src="${escapeHtml(resource.url)}"
          alt="${escapeHtml(
            resource.file ||
            block.file ||
            "Imagen del proyecto"
          )}"
          loading="${
            index < 2
              ? "eager"
              : "lazy"
          }"
          draggable="false"
        >

      </div>

      ${renderCaption(
        caption,
        "Image"
      )}

    </section>

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
    normalizeImages(
      block.images ||
      block.resources ||
      []
    );

  if (!images.length) {
    return "";
  }

  const carouselId =
    `project-carousel-${index}`;

  const caption =
    getBlockCaption(
      block
    );

  return `

    <section
      class="project-block project-carousel-block"
      data-carousel="${carouselId}"
      data-block-index="${index}"
    >

      <div class="project-block-heading">

        <div>

          <h2>
            ${escapeHtml(
              getCarouselTitle(
                block,
                index
              )
            )}
          </h2>

          <span>
            Image series
          </span>

        </div>

      </div>


      <div class="project-carousel">

        <button
          type="button"
          class="project-carousel-button project-carousel-prev"
          data-carousel-action="prev"
          aria-label="Anterior"
        >
          ←
        </button>


        <div
          class="project-carousel-stage protected-media"
        >

          ${images
            .map(
              (
                image,
                imageIndex
              ) => `

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
                    image.file ||
                    image.name ||
                    `Imagen ${
                      imageIndex + 1
                    }`
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

        </div>


        <button
          type="button"
          class="project-carousel-button project-carousel-next"
          data-carousel-action="next"
          aria-label="Siguiente"
        >
          →
        </button>

      </div>


      <div class="project-carousel-footer">

        <div class="project-carousel-counter">

          <span data-carousel-current>
            01
          </span>

          <span class="project-carousel-separator">
            /
          </span>

          <span>
            ${String(
              images.length
            ).padStart(2, "0")}
          </span>

        </div>

        ${renderCaption(
          caption,
          "Image series"
        )}

      </div>

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
    normalizeImages(
      block.images ||
      block.resources ||
      []
    );

  if (
    images.length < 2
  ) {
    return "";
  }

  const caption =
    getBlockCaption(
      block
    );

  return `

    <section
      class="project-block project-comparator-block"
      data-block-index="${index}"
    >

      <div class="project-block-heading">

        <div>

          <h2>
            Comparador
          </h2>

          <span>
            Comparison
          </span>

        </div>

      </div>


      <div class="project-comparator">

        <figure
          class="project-comparator-panel protected-media"
        >

          <img
            class="protected-image"
            src="${escapeHtml(
              images[0].url
            )}"
            alt="${escapeHtml(
              images[0].file ||
              images[0].name ||
              "Comparación 1"
            )}"
            draggable="false"
          >

          <figcaption>
            <span>
              ${escapeHtml(
                images[0].label ||
                "01"
              )}
            </span>

            <small>
              View 01
            </small>
          </figcaption>

        </figure>


        <div
          class="project-comparator-divider"
          aria-hidden="true"
        ></div>


        <figure
          class="project-comparator-panel protected-media"
        >

          <img
            class="protected-image"
            src="${escapeHtml(
              images[1].url
            )}"
            alt="${escapeHtml(
              images[1].file ||
              images[1].name ||
              "Comparación 2"
            )}"
            draggable="false"
          >

          <figcaption>
            <span>
              ${escapeHtml(
                images[1].label ||
                "02"
              )}
            </span>

            <small>
              View 02
            </small>
          </figcaption>

        </figure>

      </div>


      ${renderCaption(
        caption,
        "Comparison"
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
    normalizeImages(
      block.images ||
      block.resources ||
      []
    );

  if (!images.length) {
    return "";
  }

  const caption =
    getBlockCaption(
      block
    );

  return `

    <section
      class="project-block project-evolution-block"
      data-block-index="${index}"
    >

      <div class="project-block-heading">

        <div>

          <h2>
            Evolución
          </h2>

          <span>
            Process
          </span>

        </div>

      </div>


      <div class="project-evolution">

        ${images
          .map(
            (
              image,
              imageIndex
            ) => `

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
                      image.file ||
                      image.name ||
                      `Paso ${
                        imageIndex + 1
                      }`
                    )}"
                    loading="lazy"
                    draggable="false"
                  >

                </div>


                <figcaption>

                  <span>
                    ${String(
                      imageIndex + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </span>

                  <small>
                    Stage ${
                      imageIndex + 1
                    }
                  </small>

                </figcaption>

              </figure>

            `
          )
          .join("")}

      </div>


      ${renderCaption(
        caption,
        "Process"
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

  let items =
    Array.isArray(block.items)
      ? block.items
      : [];

  if (
    !items.length &&
    Array.isArray(block.urls)
  ) {

    items =
      block.urls.map(
        url => ({
          url
        })
      );

  }

  if (!items.length) {
    return "";
  }

  return `

    <section
      class="project-block project-sketchfab-block"
      data-block-index="${index}"
    >

      <div class="project-block-heading">

        <div>

          <h2>
            Modelos 3D
          </h2>

          <span>
            3D models
          </span>

        </div>

      </div>


      <div class="project-sketchfab-grid">

        ${items
          .map(
            (
              item,
              itemIndex
            ) =>
              renderSketchfabItem(
                item,
                itemIndex
              )
          )
          .join("")}

      </div>

    </section>

  `;

}


/* ============================================================
   ELEMENTO SKETCHFAB
   ============================================================ */

function renderSketchfabItem(
  item,
  index
) {

  const url =
    item?.url ||
    item?.href ||
    "";

  if (!url) {
    return "";
  }

  const thumbnail =
    item?.thumbnail ||
    item?.thumbnail_url ||
    "";

  const embedUrl =
    item?.embed_url ||
    item?.embedUrl ||
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

      <button
        type="button"
        class="project-sketchfab-preview"
        data-sketchfab-load
        aria-label="Cargar modelo 3D ${index + 1}"
      >

        ${
          thumbnail
            ? `
              <img
                src="${escapeHtml(
                  thumbnail
                )}"
                alt=""
                draggable="false"
              >
            `
            : `
              <span class="project-sketchfab-preview-placeholder">
                3D
              </span>
            `
        }


        <span class="project-sketchfab-preview-overlay">

          <span class="project-sketchfab-preview-button">

            <strong>
              Cargar modelo
            </strong>

            <small>
              Load 3D model
            </small>

          </span>

        </span>

      </button>


      <div
        class="project-sketchfab-frame"
        data-sketchfab-frame
        hidden
      ></div>


      <div class="project-sketchfab-info">

        <span class="project-sketchfab-index">
          ${String(
            index + 1
          ).padStart(
            2,
            "0"
          )}
        </span>

        <a
          class="project-sketchfab-link"
          href="${escapeHtml(url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver en Sketchfab
          <span>
            View on Sketchfab
          </span>
        </a>

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
    getResourceFromBlock(
      block
    );

  if (
    !resource ||
    !resource.url
  ) {

    return "";

  }

  const url =
    resource.url;

  const youtubeId =
    extractYoutubeId(
      url
    );

  const caption =
    getBlockCaption(
      block
    );

  if (youtubeId) {

    return `

      <section
        class="project-block project-video-block"
        data-block-index="${index}"
      >

        <div class="project-block-heading">

          <div>

            <h2>
              Vídeo
            </h2>

            <span>
              Video
            </span>

          </div>

        </div>


        <div class="project-video-frame">

          <iframe
            src="https://www.youtube.com/embed/${escapeHtml(
              youtubeId
            )}?rel=0&modestbranding=1"
            title="Vídeo del proyecto"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>

        </div>


        ${renderCaption(
          caption,
          "Video"
        )}

      </section>

    `;

  }

  return `

    <section
      class="project-block project-video-block"
      data-block-index="${index}"
    >

      <div class="project-block-heading">

        <div>

          <h2>
            Vídeo
          </h2>

          <span>
            Video
          </span>

        </div>

      </div>


      <div class="project-video-frame">

        <video
          class="project-video"
          controls
          preload="metadata"
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
        >

          <source
            src="${escapeHtml(
              url
            )}"
          >

          Tu navegador no admite la reproducción de vídeo.

        </video>

      </div>


      ${renderCaption(
        caption,
        "Video"
      )}

    </section>

  `;

}


/* ============================================================
   PDF
   ============================================================ */

function renderPdfBlock(
  block,
  index
) {

  const resource =
    getResourceFromBlock(
      block
    );

  if (
    !resource ||
    !resource.url
  ) {

    return "";

  }

  const caption =
    getBlockCaption(
      block
    );

  const pdfUrl =
    `${resource.url}#toolbar=0&navpanes=0&scrollbar=1`;

  return `

    <section
      class="project-block project-pdf-block"
      data-block-index="${index}"
    >

      <div class="project-block-heading">

        <div>

          <h2>
            Documento
          </h2>

          <span>
            Document
          </span>

        </div>

      </div>


      <div
        class="project-pdf-frame protected-media"
      >

        <iframe
          src="${escapeHtml(
            pdfUrl
          )}"
          title="${escapeHtml(
            block.file ||
            block.reference ||
            "Documento PDF"
          )}"
          loading="lazy"
        ></iframe>

      </div>


      ${renderCaption(
        caption,
        "Document"
      )}

    </section>

  `;

}


/* ============================================================
   PIE DE BLOQUE
   ============================================================ */

function renderCaption(
  caption,
  englishLabel
) {

  if (
    caption === null ||
    caption === undefined ||
    String(caption).trim() === ""
  ) {

    return "";

  }

  return `

    <div class="project-block-caption">

      <span class="project-block-caption-es">
        ${escapeHtml(
          caption
        )}
      </span>

      <span class="project-block-caption-en">
        ${escapeHtml(
          englishLabel
        )}
      </span>

    </div>

  `;

}


/* ============================================================
   TÍTULO CARRUSEL
   ============================================================ */

function getCarouselTitle(
  block,
  index
) {

  const id =
    String(
      block.id ||
      block.number ||
      index + 1
    );

  return `Serie ${id}`;

}


/* ============================================================
   CAPTION
   ============================================================ */

function getBlockCaption(
  block
) {

  return (
    block.caption ||
    block.text ||
    block.description ||
    block.caption_es ||
    ""
  );

}


/* ============================================================
   RECURSOS
   ============================================================ */

function getResourceFromBlock(
  block
) {

  if (
    block.resource &&
    block.resource.url
  ) {

    return block.resource;

  }

  if (
    block.url
  ) {

    return {
      url: block.url,
      file:
        block.file ||
        block.reference ||
        ""
    };

  }

  if (
    block.resource_url
  ) {

    return {
      url:
        block.resource_url,
      file:
        block.file ||
        block.reference ||
        ""
    };

  }

  return null;

}


/* ============================================================
   NORMALIZAR IMÁGENES
   ============================================================ */

function normalizeImages(
  images
) {

  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map(
      image => {

        if (
          typeof image ===
          "string"
        ) {

          return {
            url: image,
            file: ""
          };

        }

        if (
          image &&
          typeof image ===
          "object"
        ) {

          return {
            url:
              image.url ||
              image.signedUrl ||
              image.signed_url ||
              image.src ||
              "",
            file:
              image.file ||
              image.name ||
              image.reference ||
              "",
            label:
              image.label ||
              ""
          };

        }

        return null;

      }
    )
    .filter(
      image =>
        image &&
        image.url
    );

}


/* ============================================================
   LIMPIEZA DE TEXTO
   ============================================================ */

function cleanDisplayText(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


/* ============================================================
   METADATA
   ============================================================ */

function formatMetadataValue(
  value
) {

  if (
    Array.isArray(value)
  ) {

    return value
      .map(
        item =>
          cleanDisplayText(
            item
          )
      )
      .filter(Boolean)
      .join(" · ");

  }

  return cleanDisplayText(
    value
  );

}


/* ============================================================
   NAVEGACIÓN
   ============================================================ */

function renderProjectNavigation(
  project,
  navigation
) {

  let previous =
    navigation?.previous ||
    null;

  let next =
    navigation?.next ||
    null;

  return `

    <nav
      class="project-viewer-navigation"
      aria-label="Navegación entre proyectos"
    >

      <a
        class="project-viewer-navigation-all"
        href="./proyectos.html"
      >

        <span class="project-viewer-navigation-label">
          Todos los proyectos
        </span>

        <span class="project-viewer-navigation-label-en">
          All projects
        </span>

      </a>


      ${
        previous
          ? `
            <a
              class="project-viewer-navigation-previous"
              href="${createProjectUrl(
                previous
              )}"
            >

              <span class="project-viewer-navigation-label">
                Proyecto anterior
              </span>

              <span class="project-viewer-navigation-label-en">
                Previous project
              </span>

              <strong>
                ${escapeHtml(
                  previous.title ||
                  previous.name ||
                  ""
                )}
              </strong>

            </a>
          `
          : ""
      }


      ${
        next
          ? `
            <a
              class="project-viewer-navigation-next"
              href="${createProjectUrl(
                next
              )}"
            >

              <span class="project-viewer-navigation-label">
                Siguiente proyecto
              </span>

              <span class="project-viewer-navigation-label-en">
                Next project
              </span>

              <strong>
                ${escapeHtml(
                  next.title ||
                  next.name ||
                  ""
                )}
              </strong>

            </a>
          `
          : ""
      }

    </nav>


    <a
      class="project-viewer-all-projects"
      href="./proyectos.html"
    >

      <span>
        Ver todos los proyectos
      </span>

      <small>
        View all projects
      </small>

    </a>

  `;

}


/* ============================================================
   URL PROYECTO
   ============================================================ */

function createProjectUrl(
  project
) {

  const name =
    project?.name ||
    project?.id ||
    project?.rawName ||
    project?.folder ||
    "";

  if (!name) {
    return "./proyectos.html";
  }

  return (
    `./visor.html?project=${encodeURIComponent(
      name
    )}`
  );

}


/* ============================================================
   YOUTUBE
   ============================================================ */

function extractYoutubeId(
  url
) {

  const value =
    String(
      url || ""
    );

  const patterns = [

    /youtu\.be\/([^?&/]+)/i,

    /youtube\.com\/watch\?v=([^?&/]+)/i,

    /youtube\.com\/embed\/([^?&/]+)/i

  ];

  for (
    const pattern
    of patterns
  ) {

    const match =
      value.match(
        pattern
      );

    if (match) {
      return match[1];
    }

  }

  return null;

}


/* ============================================================
   CAROUSELES
   ============================================================ */

function initialiseCarousels() {

  const carousels =
    document.querySelectorAll(
      "[data-carousel]"
    );

  carousels.forEach(
    carousel => {

      const images =
        carousel.querySelectorAll(
          ".project-carousel-image"
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
          (
            image,
            imageIndex
          ) => {

            image.classList.toggle(
              "is-active",
              imageIndex ===
              current
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
   SKETCHFAB BAJO DEMANDA
   ============================================================ */

function initialiseSketchfab() {

  const buttons =
    document.querySelectorAll(
      "[data-sketchfab-load]"
    );

  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        async () => {

          const item =
            button.closest(
              ".project-sketchfab-item"
            );

          if (!item) {
            return;
          }

          const frame =
            item.querySelector(
              "[data-sketchfab-frame]"
            );

          if (!frame) {
            return;
          }

          const url =
            item.dataset.sketchfabUrl ||
            "";

          let embedUrl =
            item.dataset.sketchfabEmbed ||
            "";

          button.disabled =
            true;

          button.classList.add(
            "is-loading"
          );

          try {

            if (!embedUrl) {

              embedUrl =
                await resolveSketchfabEmbed(
                  url
                );

            }

            if (!embedUrl) {

              throw new Error(
                "No se pudo obtener el visor 3D."
              );

            }

            frame.innerHTML = `

              <iframe
                src="${escapeHtml(
                  embedUrl
                )}"
                title="Modelo 3D"
                loading="eager"
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowfullscreen
              ></iframe>

            `;

            frame.hidden =
              false;

            button.hidden =
              true;

          } catch (error) {

            console.error(
              "[Baal Studio] Error cargando Sketchfab:",
              error
            );

            button.disabled =
              false;

            button.classList.remove(
              "is-loading"
            );

            button.innerHTML = `
              <span class="project-sketchfab-preview-button">
                <strong>
                  Abrir modelo
                </strong>

                <small>
                  Open model
                </small>
              </span>
            `;

          }

        }
      );

    }
  );

}


/* ============================================================
   RESOLVER SKETCHFAB
   ============================================================ */

async function resolveSketchfabEmbed(
  url
) {

  try {

    const endpoint =
      `https://sketchfab.com/oembed?url=${encodeURIComponent(
        url
      )}&format=json`;

    const response =
      await fetch(
        endpoint,
        {
          method: "GET",
          headers: {
            "Accept":
              "application/json"
          }
        }
      );

    if (!response.ok) {
      return "";
    }

    const data =
      await response.json();

    if (
      data &&
      data.html
    ) {

      const match =
        String(
          data.html
        ).match(
          /src=["']([^"']+)["']/i
        );

      if (match) {
        return match[1];
      }

    }

    if (
      data &&
      data.thumbnail_url
    ) {

      return "";

    }

  } catch (error) {

    console.warn(
      "[Baal Studio] No se pudo resolver Sketchfab:",
      error
    );

  }

  return "";

}


/* ============================================================
   ZOOM DE IMÁGENES
   ============================================================ */

function initialiseImageZoom() {

  const images =
    document.querySelectorAll(
      ".project-main-image, " +
      ".project-carousel-image, " +
      ".project-comparator-panel img, " +
      ".project-evolution-image img"
    );

  images.forEach(
    image => {

      image.addEventListener(
        "click",
        () => {

          openImageZoom(
            image.src,
            image.alt
          );

        }
      );

    }
  );

}


/* ============================================================
   LIGHTBOX
   ============================================================ */

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

      <div class="project-lightbox-inner">

        <img
          class="visor-image-modal-image protected-image"
          src=""
          alt=""
          draggable="false"
        >

        <div class="project-lightbox-caption">

          <span>
            Click image to close
          </span>

        </div>

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
        closeLightbox
      );

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          modal
        ) {

          closeLightbox();

        }

      }
    );

  }

  const modalImage =
    modal.querySelector(
      ".visor-image-modal-image"
    );

  modalImage.src =
    src;

  modalImage.alt =
    alt || "";

  modal.classList.add(
    "is-open"
  );

  document.body.classList.add(
    "lightbox-open"
  );

  applyProtectedMedia();

}


/* ============================================================
   CERRAR LIGHTBOX
   ============================================================ */

function closeLightbox() {

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
   INTERACCIONES
   ============================================================ */

function initialiseViewerInteractions() {

  initialiseCarousels();

  initialiseSketchfab();

  initialiseImageZoom();

  applyProtectedMedia();

}


/* ============================================================
   PROTECCIÓN
   ============================================================ */

function applyProtectedMedia() {

  const images =
    document.querySelectorAll(
      ".protected-image"
    );

  images.forEach(
    image => {

      image.setAttribute(
        "draggable",
        "false"
      );

      if (
        !image.dataset.protectionBound
      ) {

        image.addEventListener(
          "dragstart",
          event => {
            event.preventDefault();
          }
        );

        image.addEventListener(
          "contextmenu",
          event => {
            event.preventDefault();
          }
        );

        image.dataset.protectionBound =
          "true";

      }

    }
  );

  const containers =
    document.querySelectorAll(
      ".protected-media"
    );

  containers.forEach(
    container => {

      if (
        !container.dataset.protectionBound
      ) {

        container.addEventListener(
          "contextmenu",
          event => {

            event.preventDefault();

          }
        );

        container.dataset.protectionBound =
          "true";

      }

    }
  );

}


/* ============================================================
   PROTECCIÓN GLOBAL
   ============================================================ */

function initialiseGlobalProtection() {

  document.addEventListener(
    "contextmenu",
    event => {

      const target =
        event.target;

      if (
        target.closest(
          "input, textarea, select, " +
          "video, audio, iframe, " +
          "a, button"
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
        target instanceof
        HTMLImageElement ||
        target.closest?.(
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
        event.key.toLowerCase();

      const modifier =
        event.ctrlKey ||
        event.metaKey;

      const target =
        event.target;

      if (
        target &&
        target.closest?.(
          "input, textarea, select, " +
          "[contenteditable='true']"
        )
      ) {

        return;

      }

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

      if (
        event.key === "F12"
      ) {

        event.preventDefault();

      }

      if (
        event.key === "Escape"
      ) {

        closeLightbox();

      }

    }
  );

}
