/* ============================================================
   BAAL STUDIO
   VISOR.JS
   VISOR DINÁMICO DE PROYECTOS
   ============================================================ */


/* ------------------------------------------------------------
   CONFIGURACIÓN
   ------------------------------------------------------------ */

const SUPABASE_URL =
  "https://hlyzyeatnbulyfiiwvsq.supabase.co";

const VISOR_FUNCTION =
  `${SUPABASE_URL}/functions/v1/visor`;


/* ------------------------------------------------------------
   INICIO
   ------------------------------------------------------------ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadProjectViewer();

  }
);


/* ============================================================
   OBTENER PARÁMETRO DEL PROYECTO
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
   NORMALIZAR TEXTO
   ============================================================ */

function normalizeText(
  value
) {

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
   ESCAPAR HTML
   ============================================================ */

function escapeHtml(
  value
) {

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
   ELEMENTO PRINCIPAL DEL VISOR
   ============================================================ */

function getViewerContainer() {

  const possibleIds = [

    "project-viewer",

    "visor-content",

    "project-content",

    "viewer-content",

    "project-detail",

    "project-detail-content",

  ];


  for (
    const id of possibleIds
  ) {

    const element =
      document.getElementById(
        id
      );

    if (element) {
      return element;
    }
  }


  /*
    Si el HTML no tiene un contenedor
    específico, utilizamos <main>.
  */

  const main =
    document.querySelector(
      "main"
    );

  if (main) {
    return main;
  }


  return null;
}


/* ============================================================
   MOSTRAR ESTADO
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
      class="visor-state visor-state-${escapeHtml(type)}"
    >

      <p>
        ${escapeHtml(message)}
      </p>

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

          cache:
            "no-store"
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
   RENDERIZAR PROYECTO
   ============================================================ */

function renderProject(
  project
) {

  const container =
    getViewerContainer();


  if (!container) {

    console.error(
      "[Baal Studio] No se encontró el contenedor del visor."
    );

    return;
  }


  const metadata =
    project.metadata ||
    {};


  const blocks =
    Array.isArray(
      project.blocks
    )
      ? project.blocks
      : [];


  console.log(
    "[Baal Studio] Bloques recibidos:",
    blocks
  );


  const title =
    metadata.titulo ||
    project.id ||
    "Proyecto";


  /*
    El título que aparece en el visor
    procede de proyecto.txt.

    No utilizamos el nombre de carpeta
    salvo como respaldo.
  */


  container.innerHTML = `

    <article
      class="project-viewer"
      data-project-id="${escapeHtml(
        project.id
      )}"
    >

      ${renderProjectHeader(
        project
      )}

      <div
        class="project-viewer-content"
      >

        ${renderBlocks(
          blocks
        )}

      </div>

    </article>

  `;


  document.title =
    `${title} — Baal Studio`;


  applyProtectedMedia();


  initialiseViewerInteractions();
}


/* ============================================================
   CABECERA DEL PROYECTO
   ============================================================ */

function renderProjectHeader(
  project
) {

  const metadata =
    project.metadata ||
    {};


  const title =
    metadata.titulo ||
    project.id ||
    "Proyecto";


  const location =
    metadata.localizacion ||
    "";


  const year =
    metadata.año ||
    "";


  const category =
    Array.isArray(
      metadata.categoria
    )
      ? metadata.categoria.join(
          " · "
        )
      : (
          metadata.categoria ||
          ""
        );


  const subcategory =
    Array.isArray(
      metadata.subcategoria
    )
      ? metadata.subcategoria.join(
          " · "
        )
      : (
          metadata.subcategoria ||
          ""
        );


  const description =
    metadata.descripcion ||
    "";


  const techniques =
    Array.isArray(
      metadata.tecnicas
    )
      ? metadata.tecnicas
      : [];


  const objectives =
    Array.isArray(
      metadata.objetivo
    )
      ? metadata.objetivo
      : [];


  const authorship =
    metadata.autoria ||
    "";


  const collaboration =
    metadata.colaboracion ||
    "";


  const articles =
    Array.isArray(
      project.articles
    )
      ? project.articles
      : [];


  const sketchfab =
    Array.isArray(
      project.sketchfab
    )
      ? project.sketchfab
      : [];


  return `

    <header
      class="project-viewer-header"
    >

      <div
        class="project-viewer-heading"
      >

        <p
          class="project-viewer-kicker"
        >
          Proyecto
        </p>

        <h1
          class="project-viewer-title"
        >
          ${escapeHtml(
            title
          )}
        </h1>

        <p
          class="project-viewer-title-en"
        >
          Project
        </p>

      </div>


      <div
        class="project-viewer-introduction"
      >

        ${
          description
            ? `
              <div
                class="project-viewer-description"
              >
                ${renderParagraphs(
                  description
                )}
              </div>
            `
            : ""
        }


        <div
          class="project-viewer-metadata"
        >

          ${renderMetadataItem(
            "Localización",
            location
          )}

          ${renderMetadataItem(
            "Categoría",
            category
          )}

          ${renderMetadataItem(
            "Subcategoría",
            subcategory
          )}

          ${renderMetadataItem(
            "Año",
            year
          )}

          ${renderMetadataItem(
            "Técnicas",
            techniques.join(
              " · "
            )
          )}

          ${renderMetadataItem(
            "Objetivo",
            objectives.join(
              " · "
            )
          )}

          ${renderMetadataItem(
            "Autoría",
            authorship
          )}

          ${renderMetadataItem(
            "Colaboración",
            collaboration
          )}

        </div>


        ${
          articles.length
            ? `
              <div
                class="project-viewer-links"
              >

                <span>
                  Artículos
                </span>

                ${articles
                  .map(
                    (
                      url,
                      index
                    ) => `
                      <a
                        href="${escapeHtml(
                          url
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Fuente ${index + 1}
                      </a>
                    `
                  )
                  .join("")
                }

              </div>
            `
            : ""
        }

      </div>

    </header>

  `;
}


/* ============================================================
   METADATO
   ============================================================ */

function renderMetadataItem(
  label,
  value
) {

  if (!value) {
    return "";
  }


  return `

    <div
      class="project-viewer-meta-item"
    >

      <span
        class="project-viewer-meta-label"
      >
        ${escapeHtml(
          label
        )}
      </span>

      <span
        class="project-viewer-meta-value"
      >
        ${escapeHtml(
          value
        )}
      </span>

    </div>

  `;
}


/* ============================================================
   PÁRRAFOS
   ============================================================ */

function renderParagraphs(
  text
) {

  return String(text)
    .split(
      /\n{2,}/
    )
    .map(
      paragraph =>
        `
          <p>
            ${escapeHtml(
              paragraph
            )}
          </p>
        `
    )
    .join("");
}


/* ============================================================
   RENDERIZAR BLOQUES
   ============================================================ */

function renderBlocks(
  blocks
) {

  if (!blocks.length) {

    return `

      <section
        class="project-viewer-empty"
      >

        <p>
          No hay contenido disponible
          para este proyecto.
        </p>

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
   RENDERIZAR BLOQUE INDIVIDUAL
   ============================================================ */

function renderBlock(
  block,
  index
) {

  if (!block) {
    return "";
  }


  switch (
    block.type
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

      console.warn(
        "[Baal Studio] Tipo de bloque desconocido:",
        block.type
      );

      return "";
  }
}


/* ============================================================
   IMAGEN
   ============================================================ */

function renderImageBlock(
  block,
  index
) {

  if (
    !block.resource ||
    !block.resource.url
  ) {

    console.warn(
      "[Baal Studio] Imagen no resuelta:",
      block.reference
    );

    return `
      <section
        class="project-block project-block-error"
      >
        <p>
          No se pudo cargar la imagen
          ${escapeHtml(
            block.reference
          )}
        </p>
      </section>
    `;
  }


  return `

    <figure
      class="project-block project-image-block"
      data-block-index="${index}"
    >

      <div
        class="project-image-frame protected-media"
      >

        <img
          class="project-main-image protected-image"
          src="${escapeHtml(
            block.resource.url
          )}"
          alt="${escapeHtml(
            block.reference
          )}"
          loading="lazy"
          draggable="false"
        >

      </div>

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
    Array.isArray(
      block.images
    )
      ? block.images
      : [];


  if (!images.length) {

    return `
      <section
        class="project-block project-block-error"
      >
        <p>
          No se encontraron imágenes
          para el carrusel
          ${escapeHtml(
            block.number
          )}
        </p>
      </section>
    `;
  }


  const carouselId =
    `project-carousel-${index}`;


  return `

    <section
      class="project-block project-carousel-block"
      data-carousel="${carouselId}"
    >

      <div
        class="project-carousel"
      >

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
                    image.name
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
            .join("")
          }

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


      <div
        class="project-carousel-counter"
      >
        <span
          data-carousel-current
        >
          01
        </span>

        /

        <span>
          ${String(
            images.length
          ).padStart(
            2,
            "0"
          )}
        </span>
      </div>


      ${
        block.text
          ? `
            <p
              class="project-block-caption"
            >
              ${escapeHtml(
                block.text
              )}
            </p>
          `
          : ""
      }

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
    Array.isArray(
      block.images
    )
      ? block.images
      : [];


  if (
    images.length < 2
  ) {

    return `
      <section
        class="project-block project-block-error"
      >
        <p>
          El comparador
          ${escapeHtml(
            block.number
          )}
          necesita al menos dos imágenes.
        </p>
      </section>
    `;
  }


  return `

    <section
      class="project-block project-comparator-block"
      data-block-index="${index}"
    >

      <div
        class="project-comparator protected-media"
      >

        <div
          class="project-comparator-image"
        >

          <img
            class="protected-image"
            src="${escapeHtml(
              images[0].url
            )}"
            alt="${escapeHtml(
              images[0].name
            )}"
            draggable="false"
          >

        </div>


        <div
          class="project-comparator-divider"
        ></div>


        <div
          class="project-comparator-image"
        >

          <img
            class="protected-image"
            src="${escapeHtml(
              images[1].url
            )}"
            alt="${escapeHtml(
              images[1].name
            )}"
            draggable="false"
          >

        </div>

      </div>


      ${
        block.text
          ? `
            <p
              class="project-block-caption"
            >
              ${escapeHtml(
                block.text
              )}
            </p>
          `
          : ""
      }

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
    Array.isArray(
      block.images
    )
      ? block.images
      : [];


  if (!images.length) {

    return `
      <section
        class="project-block project-block-error"
      >
        <p>
          No se encontraron imágenes
          para la evolución
          ${escapeHtml(
            block.number
          )}
        </p>
      </section>
    `;
  }


  return `

    <section
      class="project-block project-evolution-block"
      data-block-index="${index}"
    >

      <div
        class="project-evolution"
      >

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
                      image.name
                    )}"
                    loading="lazy"
                    draggable="false"
                  >

                </div>


                <figcaption>
                  ${String(
                    imageIndex + 1
                  ).padStart(
                    2,
                    "0"
                  )}
                </figcaption>

              </figure>

            `
          )
          .join("")
        }

      </div>


      ${
        block.text
          ? `
            <p
              class="project-block-caption"
            >
              ${escapeHtml(
                block.text
              )}
            </p>
          `
          : ""
      }

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
    Array.isArray(
      block.items
    )
      ? block.items
      : [];


  if (!items.length) {
    return "";
  }


  return `

    <section
      class="project-block project-sketchfab-block"
      data-block-index="${index}"
    >

      <div
        class="project-sketchfab-grid"
      >

        ${items
          .map(
            (
              item,
              sketchIndex
            ) =>
              renderSketchfabItem(
                item,
                sketchIndex
              )
          )
          .join("")
        }

      </div>

    </section>

  `;
}


/* ============================================================
   SKETCHFAB INDIVIDUAL
   ============================================================ */

function renderSketchfabItem(
  item,
  index
) {

  const url =
    item?.url ||
    "";


  if (!url) {
    return "";
  }


  const sketchfabId =
    extractSketchfabId(
      url
    );


  if (!sketchfabId) {

    return `

      <div
        class="project-sketchfab-item"
      >

        <a
          href="${escapeHtml(
            url
          )}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver modelo 3D
        </a>

      </div>

    `;
  }


  return `

    <div
      class="project-sketchfab-item"
    >

      <div
        class="project-sketchfab-frame"
      >

        <iframe
          src="https://sketchfab.com/models/${escapeHtml(
            sketchfabId
          )}/embed"
          title="Modelo 3D ${index + 1}"
          loading="lazy"
          allow="
            autoplay;
            fullscreen;
            xr-spatial-tracking;
          "
          allowfullscreen
        ></iframe>

      </div>

    </div>

  `;
}


/* ============================================================
   EXTRAER ID SKETCHFAB
   ============================================================ */

function extractSketchfabId(
  url
) {

  const value =
    String(
      url ?? ""
    ).trim();


  /*
    Formato:
    https://skfb.ly/pIVnQ

    Sketchfab redirige este enlace
    a la página del modelo.

    No podemos obtener el ID largo
    mediante una petición desde aquí
    de forma fiable.

    Por tanto, devolvemos el identificador
    corto como referencia solo si la URL
    ya es un formato /models/...
  */


  const modelMatch =
    value.match(
      /sketchfab\.com\/models\/([a-zA-Z0-9]+)/
    );


  if (modelMatch) {
    return modelMatch[1];
  }


  return null;
}


/* ============================================================
   VIDEO
   ============================================================ */

function renderVideoBlock(
  block,
  index
) {

  const resource =
    block.resource;


  if (
    !resource ||
    !resource.url
  ) {

    return `
      <section
        class="project-block project-block-error"
      >
        <p>
          No se pudo localizar el vídeo
          ${escapeHtml(
            block.reference
          )}
        </p>
      </section>
    `;
  }


  const url =
    resource.url;


  if (
    /youtube\.com|youtu\.be/i.test(
      url
    )
  ) {

    const youtubeId =
      extractYoutubeId(
        url
      );


    if (youtubeId) {

      return `

        <section
          class="project-block project-video-block"
          data-block-index="${index}"
        >

          <div
            class="project-video-frame"
          >

            <iframe
              src="https://www.youtube.com/embed/${escapeHtml(
                youtubeId
              )}"
              title="Vídeo del proyecto"
              loading="lazy"
              allow="
                accelerometer;
                autoplay;
                clipboard-write;
                encrypted-media;
                gyroscope;
                picture-in-picture;
                web-share;
              "
              allowfullscreen
            ></iframe>

          </div>

        </section>

      `;
    }
  }


  return `

    <section
      class="project-block project-video-block"
      data-block-index="${index}"
    >

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

    </section>

  `;
}


/* ============================================================
   EXTRAER ID YOUTUBE
   ============================================================ */

function extractYoutubeId(
  url
) {

  const value =
    String(
      url ?? ""
    );


  const patterns = [

    /youtu\.be\/([^?&/]+)/i,

    /youtube\.com\/watch\?v=([^?&/]+)/i,

    /youtube\.com\/embed\/([^?&/]+)/i,

  ];


  for (
    const pattern of patterns
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
   PDF
   ============================================================ */

function renderPdfBlock(
  block,
  index
) {

  const resource =
    block.resource;


  if (
    !resource ||
    !resource.url
  ) {

    return `
      <section
        class="project-block project-block-error"
      >
        <p>
          No se pudo localizar el PDF
          ${escapeHtml(
            block.reference
          )}
        </p>
      </section>
    `;
  }


  return `

    <section
      class="project-block project-pdf-block"
      data-block-index="${index}"
    >

      <div
        class="project-pdf-header"
      >

        <span>
          Documento
        </span>

        <a
          href="${escapeHtml(
            resource.url
          )}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir PDF
        </a>

      </div>


      <div
        class="project-pdf-frame"
      >

        <iframe
          src="${escapeHtml(
            resource.url
          )}"
          title="${escapeHtml(
            block.reference
          )}"
          loading="lazy"
        ></iframe>

      </div>

    </section>

  `;
}


/* ============================================================
   INTERACCIONES
   ============================================================ */

function initialiseViewerInteractions() {

  initialiseCarousels();

  initialiseImageZoom();

}


/* ============================================================
   CARRUSELES
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


      let current =
        0;


      function update() {

        images.forEach(
          (
            image,
            index
          ) => {

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
   ZOOM DE IMÁGENES
   ============================================================ */

function initialiseImageZoom() {

  const images =
    document.querySelectorAll(
      ".project-main-image, .project-carousel-image, .project-comparator-image img, .project-evolution-image img"
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
   MODAL ZOOM
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
      "visor-image-modal";


    modal.innerHTML = `

      <button
        type="button"
        class="visor-image-modal-close"
        aria-label="Cerrar"
      >
        ×
      </button>

      <div
        class="visor-image-modal-stage"
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
        ".visor-image-modal-close"
      )
      .addEventListener(
        "click",
        () => {

          modal.classList.remove(
            "is-open"
          );

        }
      );


    modal.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          modal
        ) {

          modal.classList.remove(
            "is-open"
          );

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


  applyProtectedMedia();
}


/* ============================================================
   PROTECCIÓN DE MEDIOS
   ============================================================ */

function applyProtectedMedia() {

  const protectedImages =
    document.querySelectorAll(
      ".protected-image"
    );


  protectedImages.forEach(
    image => {

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


      image.addEventListener(
        "contextmenu",
        event => {

          event.preventDefault();

        }
      );

    }
  );


  const protectedContainers =
    document.querySelectorAll(
      ".protected-media"
    );


  protectedContainers.forEach(
    container => {

      container.addEventListener(
        "contextmenu",
        event => {

          event.preventDefault();

        }
      );

    }
  );
}


/* ============================================================
   TECLADO
   ============================================================ */

document.addEventListener(
  "keydown",
  event => {

    /*
      Escape cierra el zoom.
    */

    if (
      event.key ===
      "Escape"
    ) {

      const modal =
        document.getElementById(
          "visor-image-modal"
        );

      if (modal) {

        modal.classList.remove(
          "is-open"
        );

      }

    }

  }
);
