/* ============================================================
   BAAL STUDIO
   VISOR.JS
   VISOR DINÁMICO DE PROYECTOS
   ============================================================ */

(() => {

  "use strict";


  /* ----------------------------------------------------------
     PROTECCIÓN CONTRA DOBLE CARGA
     ---------------------------------------------------------- */

  if (window.__BAAL_VISOR_JS_LOADED__) {
    return;
  }

  window.__BAAL_VISOR_JS_LOADED__ = true;


  /* ----------------------------------------------------------
     CONFIGURACIÓN
     ---------------------------------------------------------- */

  const SUPABASE_URL =
    "https://hlyzyeatnbulyfiiwvsq.supabase.co";

  const PROJECT_FUNCTION =
    `${SUPABASE_URL}/functions/v1/get-projects`;


  /* ----------------------------------------------------------
     INICIO
     ---------------------------------------------------------- */

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      initializeViewer();

    }
  );


  /* ----------------------------------------------------------
     INICIALIZAR
     ---------------------------------------------------------- */

  async function initializeViewer() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const projectName =
      params.get("project");


    if (!projectName) {

      showError(
        "No se ha especificado ningún proyecto."
      );

      return;
    }


    console.log(
      "[Baal Studio] Proyecto solicitado:",
      projectName
    );


    try {

      const project =
        await loadProject(
          projectName
        );

      if (!project) {
        throw new Error(
          "El proyecto no existe."
        );
      }


      renderProject(
        project
      );


    } catch (error) {

      console.error(
        "[Baal Studio] Error cargando visor:",
        error
      );

      showError(
        error.message
      );
    }
  }


  /* ----------------------------------------------------------
     CARGAR PROYECTO
     ---------------------------------------------------------- */

  async function loadProject(
    projectName
  ) {

    /*
     * Enviamos el nombre de la carpeta como parámetro.
     *
     * La Edge Function debe encargarse de:
     * - localizar la carpeta
     * - leer proyecto.txt
     * - resolver URLs firmadas
     * - devolver los recursos
     */

    const url =
      PROJECT_FUNCTION +
      "?project=" +
      encodeURIComponent(
        projectName
      );


    console.log(
      "[Baal Studio] Consultando:",
      url
    );


    const response =
      await fetch(
        url,
        {
          method: "GET",
          cache: "no-store"
        }
      );


    console.log(
      "[Baal Studio] get-projects HTTP:",
      response.status
    );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );
    }


    const data =
      await response.json();


    console.log(
      "[Baal Studio] Respuesta get-projects:",
      data
    );


    if (
      data &&
      data.success === false
    ) {

      throw new Error(
        data.error ||
        "La función no pudo cargar el proyecto."
      );
    }


    return normalizeProjectResponse(
      data
    );
  }


  /* ----------------------------------------------------------
     NORMALIZAR RESPUESTA
     ---------------------------------------------------------- */

  function normalizeProjectResponse(
    data
  ) {

    if (!data) {
      return null;
    }


    if (
      data.project &&
      typeof data.project === "object"
    ) {

      return data.project;
    }


    if (
      data.data &&
      data.data.project &&
      typeof data.data.project === "object"
    ) {

      return data.data.project;
    }


    if (
      data.data &&
      typeof data.data === "object" &&
      !Array.isArray(data.data)
    ) {

      return data.data;
    }


    return data;
  }


  /* ----------------------------------------------------------
     RENDERIZAR PROYECTO
     ---------------------------------------------------------- */

  function renderProject(
    project
  ) {

    const normalized =
      normalizeProject(
        project
      );


    /*
     * Título
     */

    setText(
      "visor-title",
      normalized.title
    );


    setText(
      "visor-title-en",
      normalized.titleEn
    );


    /*
     * Datos
     */

    setText(
      "visor-category",
      normalized.category
    );

    setText(
      "visor-techniques",
      normalized.techniques
    );

    setText(
      "visor-objective",
      normalized.objective
    );


    /*
     * Descripción
     */

    renderDescription(
      normalized.description
    );


    /*
     * Recursos
     */

    renderResources(
      normalized
    );


    /*
     * Título del navegador
     */

    document.title =
      normalized.title
        ? `${normalized.title} — Baal Studio`
        : "Baal Studio — Proyecto";


    /*
     * Mostrar página
     */

    const loading =
      document.getElementById(
        "visor-loading"
      );

    const projectContainer =
      document.getElementById(
        "visor-project"
      );

    if (loading) {
      loading.style.display = "none";
    }

    if (projectContainer) {
      projectContainer.hidden = false;
    }
  }


  /* ----------------------------------------------------------
     NORMALIZAR PROYECTO
     ---------------------------------------------------------- */

  function normalizeProject(
    project
  ) {

    const metadata =
      project.metadata &&
      typeof project.metadata === "object"
        ? project.metadata
        : project;


    return {

      title:
        cleanText(
          metadata.titulo ||
          metadata.title ||
          metadata.nombre ||
          project.titulo ||
          project.title ||
          project.nombre ||
          project.name ||
          "Proyecto"
        ),


      titleEn:
        cleanText(
          metadata.titulo_en ||
          metadata.title_en ||
          metadata.titleEn ||
          project.titulo_en ||
          project.title_en ||
          project.titleEn ||
          ""
        ),


      category:
        cleanText(
          metadata.categoria ||
          metadata.category ||
          project.categoria ||
          project.category ||
          ""
        ),


      techniques:
        cleanText(
          metadata.tecnicas ||
          metadata.técnicas ||
          metadata.techniques ||
          project.tecnicas ||
          project.técnicas ||
          project.techniques ||
          ""
        ),


      objective:
        cleanText(
          metadata.objetivo ||
          metadata.objective ||
          project.objetivo ||
          project.objective ||
          ""
        ),


      description:
        metadata.descripcion ||
        metadata.description ||
        project.descripcion ||
        project.description ||
        project.text ||
        "",


      /*
       * Recursos.
       *
       * Se aceptan distintas estructuras porque
       * get-projects puede devolverlas agrupadas.
       */

      resources:
        collectResources(
          project
        )

    };
  }


  /* ----------------------------------------------------------
     DESCRIPCIÓN
     ---------------------------------------------------------- */

  function renderDescription(
    description
  ) {

    const container =
      document.getElementById(
        "visor-description"
      );

    if (!container) {
      return;
    }


    container.innerHTML = "";


    if (!description) {

      const section =
        document.querySelector(
          ".visor-description"
        );

      if (section) {
        section.style.display = "none";
      }

      return;
    }


    /*
     * Si llega como array,
     * cada elemento se convierte en párrafo.
     */

    if (
      Array.isArray(description)
    ) {

      description.forEach(
        paragraph => {

          const p =
            document.createElement("p");

          p.textContent =
            cleanText(
              paragraph
            );

          if (p.textContent) {
            container.appendChild(p);
          }

        }
      );

      return;
    }


    /*
     * Si llega como texto,
     * respetamos saltos de línea.
     */

    const paragraphs =
      String(description)
        .split(/\n\s*\n/);


    paragraphs.forEach(
      paragraph => {

        const text =
          paragraph.trim();

        if (!text) {
          return;
        }

        const p =
          document.createElement("p");

        p.textContent =
          text;

        container.appendChild(
          p
        );
      }
    );
  }


  /* ----------------------------------------------------------
     RECURSOS
     ---------------------------------------------------------- */

  function collectResources(
    project
  ) {

    const resources = [];


    /*
     * Estructuras habituales
     */

    const possibleArrays = [

      project.resources,

      project.recursos,

      project.blocks,

      project.bloques,

      project.media,

      project.images,

      project.imagenes

    ];


    possibleArrays.forEach(
      value => {

        if (
          Array.isArray(value)
        ) {

          value.forEach(
            resource => {

              resources.push(
                normalizeResource(
                  resource
                )
              );

            }
          );
        }

      }
    );


    /*
     * Recursos individuales
     */

    const individualKeys = [

      "cover",
      "coverUrl",
      "cover_url",

      "video",
      "videoUrl",
      "video_url",

      "sketchfab",
      "sketchfabUrl",
      "sketchfab_url",

      "pdf",
      "pdfUrl",
      "pdf_url"

    ];


    individualKeys.forEach(
      key => {

        if (
          project[key]
        ) {

          resources.push(
            normalizeResource(
              project[key],
              key
            )
          );
        }

      }
    );


    return resources.filter(
      resource =>
        resource &&
        (
          resource.url ||
          resource.items.length
        )
    );
  }


  /* ----------------------------------------------------------
     NORMALIZAR RECURSO
     ---------------------------------------------------------- */

  function normalizeResource(
    resource,
    fallbackType = ""
  ) {

    if (
      typeof resource === "string"
    ) {

      return {

        type:
          detectResourceType(
            resource,
            fallbackType
          ),

        url:
          resource,

        title:
          "",

        caption:
          "",

        items:
          []

      };
    }


    if (
      !resource ||
      typeof resource !== "object"
    ) {

      return null;
    }


    const url =
      extractUrl(
        resource
      );


    const items =
      extractItems(
        resource
      );


    const type =
      resource.type ||
      resource.tipo ||
      resource.kind ||
      detectResourceType(
        url,
        fallbackType
      );


    return {

      type:
        String(type || "image")
          .toLowerCase(),

      url,

      title:
        cleanText(
          resource.title ||
          resource.titulo ||
          resource.name ||
          resource.nombre ||
          ""
        ),

      caption:
        cleanText(
          resource.caption ||
          resource.caption_es ||
          resource.descripcion ||
          resource.description ||
          resource.text ||
          ""
        ),

      items

    };
  }


  /* ----------------------------------------------------------
     EXTRAER ITEMS
     ---------------------------------------------------------- */

  function extractItems(
    resource
  ) {

    const values = [

      resource.items,

      resource.images,

      resource.imagenes,

      resource.files,

      resource.archivos,

      resource.gallery,

      resource.galeria

    ];


    for (
      const value of values
    ) {

      if (
        Array.isArray(value)
      ) {

        return value
          .map(
            item =>
              normalizeResource(
                item
              )
          )
          .filter(Boolean);
      }
    }


    return [];
  }


  /* ----------------------------------------------------------
     RENDERIZAR RECURSOS
     ---------------------------------------------------------- */

  function renderResources(
    project
  ) {

    const container =
      document.getElementById(
        "visor-resources"
      );


    if (!container) {
      return;
    }


    container.innerHTML = "";


    const resources =
      project.resources || [];


    if (!resources.length) {

      const message =
        document.createElement("p");

      message.className =
        "visor-resource-caption";

      message.textContent =
        "No hay recursos adicionales disponibles.";

      container.appendChild(
        message
      );

      return;
    }


    resources.forEach(
      resource => {

        renderResource(
          container,
          resource
        );

      }
    );
  }


  /* ----------------------------------------------------------
     RENDERIZAR UN RECURSO
     ---------------------------------------------------------- */

  function renderResource(
    container,
    resource
  ) {

    if (!resource) {
      return;
    }


    const wrapper =
      document.createElement("article");

    wrapper.className =
      "visor-resource";


    /*
     * Cabecera del recurso
     */

    if (
      resource.title ||
      resource.caption
    ) {

      const header =
        document.createElement("div");

      header.className =
        "visor-resource-header";


      if (resource.title) {

        const title =
          document.createElement("h2");

        title.className =
          "visor-resource-title";

        title.textContent =
          resource.title;

        header.appendChild(
          title
        );
      }


      if (resource.caption) {

        const caption =
          document.createElement("p");

        caption.className =
          "visor-resource-caption";

        caption.textContent =
          resource.caption;

        header.appendChild(
          caption
        );
      }


      wrapper.appendChild(
        header
      );
    }


    /*
     * GALERÍA
     */

    if (
      resource.items &&
      resource.items.length > 1
    ) {

      renderGallery(
        wrapper,
        resource.items
      );

      container.appendChild(
        wrapper
      );

      return;
    }


    /*
     * RECURSO INDIVIDUAL
     */

    const type =
      resource.type;


    if (
      type.includes("image") ||
      type === "imagen" ||
      type === "photo" ||
      type === "fotografia"
    ) {

      renderImage(
        wrapper,
        resource.url
      );

    } else if (
      type.includes("video")
    ) {

      renderVideo(
        wrapper,
        resource.url
      );

    } else if (
      type.includes("pdf") ||
      type.includes("document")
    ) {

      renderDocument(
        wrapper,
        resource.url
      );

    } else if (
      type.includes("sketchfab") ||
      type.includes("iframe") ||
      type.includes("embed")
    ) {

      renderEmbed(
        wrapper,
        resource.url
      );

    } else if (
      resource.url
    ) {

      renderImage(
        wrapper,
        resource.url
      );
    }


    container.appendChild(
      wrapper
    );
  }


  /* ----------------------------------------------------------
     IMAGEN
     ---------------------------------------------------------- */

  function renderImage(
    container,
    url
  ) {

    if (!url) {
      return;
    }


    const media =
      document.createElement("div");

    media.className =
      "visor-resource-image protected-media";


    const image =
      document.createElement("img");

    image.className =
      "protected-image";

    image.src =
      url;

    image.loading =
      "lazy";

    image.decoding =
      "async";

    image.draggable =
      false;


    media.appendChild(
      image
    );

    container.appendChild(
      media
    );
  }


  /* ----------------------------------------------------------
     GALERÍA / CARRUSEL
     ---------------------------------------------------------- */

  function renderGallery(
    container,
    items
  ) {

    const gallery =
      document.createElement("div");

    gallery.className =
      "visor-gallery";


    const stage =
      document.createElement("div");

    stage.className =
      "visor-gallery-stage";


    const image =
      document.createElement("img");

    image.className =
      "visor-gallery-image protected-image";

    image.draggable =
      false;


    const controls =
      document.createElement("div");

    controls.className =
      "visor-gallery-controls";


    const previous =
      document.createElement("button");

    previous.className =
      "visor-gallery-button";

    previous.type =
      "button";

    previous.textContent =
      "← Anterior";


    const counter =
      document.createElement("span");

    counter.className =
      "visor-gallery-counter";


    const next =
      document.createElement("button");

    next.className =
      "visor-gallery-button";

    next.type =
      "button";

    next.textContent =
      "Siguiente →";


    let current =
      0;


    function getImageUrl(
      item
    ) {

      if (
        typeof item ===
        "string"
      ) {
        return item;
      }

      return extractUrl(
        item
      );
    }


    function update() {

      const url =
        getImageUrl(
          items[current]
        );


      image.src =
        url;


      counter.textContent =
        `${current + 1} / ${items.length}`;
    }


    previous.addEventListener(
      "click",
      () => {

        current =
          (
            current -
            1 +
            items.length
          ) %
          items.length;

        update();
      }
    );


    next.addEventListener(
      "click",
      () => {

        current =
          (
            current +
            1
          ) %
          items.length;

        update();
      }
    );


    stage.appendChild(
      image
    );


    controls.appendChild(
      previous
    );

    controls.appendChild(
      counter
    );

    controls.appendChild(
      next
    );


    gallery.appendChild(
      stage
    );

    gallery.appendChild(
      controls
    );


    container.appendChild(
      gallery
    );


    update();
  }


  /* ----------------------------------------------------------
     VIDEO
     ---------------------------------------------------------- */

  function renderVideo(
    container,
    url
  ) {

    if (!url) {
      return;
    }


    const wrapper =
      document.createElement("div");

    wrapper.className =
      "visor-video";


    const video =
      document.createElement("video");

    video.src =
      url;

    video.controls =
      true;

    video.preload =
      "metadata";

    video.playsInline =
      true;


    wrapper.appendChild(
      video
    );

    container.appendChild(
      wrapper
    );
  }


  /* ----------------------------------------------------------
     PDF
     ---------------------------------------------------------- */

  function renderDocument(
    container,
    url
  ) {

    if (!url) {
      return;
    }


    const wrapper =
      document.createElement("div");

    wrapper.className =
      "visor-document";


    const iframe =
      document.createElement("iframe");

    iframe.src =
      url;

    iframe.loading =
      "lazy";

    iframe.title =
      "Documento del proyecto";


    wrapper.appendChild(
      iframe
    );

    container.appendChild(
      wrapper
    );
  }


  /* ----------------------------------------------------------
     EMBED / SKETCHFAB
     ---------------------------------------------------------- */

  function renderEmbed(
    container,
    url
  ) {

    if (!url) {
      return;
    }


    const wrapper =
      document.createElement("div");

    wrapper.className =
      "visor-embed";


    const iframe =
      document.createElement("iframe");

    iframe.src =
      url;

    iframe.loading =
      "lazy";

    iframe.allow =
      "autoplay; fullscreen; xr-spatial-tracking";

    iframe.allowFullscreen =
      true;

    iframe.title =
      "Visor del proyecto";


    wrapper.appendChild(
      iframe
    );

    container.appendChild(
      wrapper
    );
  }


  /* ----------------------------------------------------------
     EXTRAER URL
     ---------------------------------------------------------- */

  function extractUrl(
    value
  ) {

    if (
      typeof value ===
      "string"
    ) {

      return value.trim();
    }


    if (
      !value ||
      typeof value !==
      "object"
    ) {

      return "";
    }


    const keys = [

      "url",
      "signedUrl",
      "signed_url",
      "publicUrl",
      "public_url",
      "href",
      "src"

    ];


    for (
      const key of keys
    ) {

      if (
        typeof value[key] ===
        "string"
      ) {

        return value[key].trim();
      }
    }


    return "";
  }


  /* ----------------------------------------------------------
     DETECTAR TIPO
     ---------------------------------------------------------- */

  function detectResourceType(
    url,
    fallback = ""
  ) {

    if (!url) {
      return fallback || "image";
    }


    const clean =
      url
        .split("?")[0]
        .split("#")[0]
        .toLowerCase();


    if (
      clean.endsWith(".jpg") ||
      clean.endsWith(".jpeg") ||
      clean.endsWith(".png") ||
      clean.endsWith(".webp") ||
      clean.endsWith(".avif") ||
      clean.endsWith(".gif")
    ) {
      return "image";
    }


    if (
      clean.endsWith(".mp4") ||
      clean.endsWith(".webm") ||
      clean.endsWith(".mov")
    ) {
      return "video";
    }


    if (
      clean.endsWith(".pdf")
    ) {
      return "pdf";
    }


    if (
      clean.includes("sketchfab.com")
    ) {
      return "sketchfab";
    }


    return fallback || "image";
  }


  /* ----------------------------------------------------------
     TEXTO
     ---------------------------------------------------------- */

  function cleanText(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }


    if (
      Array.isArray(value)
    ) {

      return value
        .map(
          item =>
            cleanText(item)
        )
        .filter(Boolean)
        .join(", ");
    }


    if (
      typeof value ===
      "object"
    ) {

      return (
        value.es ||
        value.ES ||
        value.value ||
        value.text ||
        value.title ||
        ""
      )
        .toString()
        .trim();
    }


    return String(value)
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  }


  /* ----------------------------------------------------------
     SET TEXT
     ---------------------------------------------------------- */

  function setText(
    id,
    value
  ) {

    const element =
      document.getElementById(
        id
      );

    if (!element) {
      return;
    }


    element.textContent =
      value || "";
  }


  /* ----------------------------------------------------------
     ERROR
     ---------------------------------------------------------- */

  function showError(
    message
  ) {

    const loading =
      document.getElementById(
        "visor-loading"
      );

    const error =
      document.getElementById(
        "visor-error"
      );


    if (loading) {
      loading.style.display = "none";
    }


    if (error) {

      error.hidden =
        false;


      const paragraph =
        error.querySelector(
          "p"
        );


      if (paragraph) {

        paragraph.textContent =
          message ||
          "No ha sido posible cargar el proyecto.";
      }
    }
  }


})();
