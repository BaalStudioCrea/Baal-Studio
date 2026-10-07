/* ============================================================
   BAAL STUDIO
   PROYECTOS.JS — V01
   LISTADO DINÁMICO DE PROYECTOS
   ============================================================ */


/* ------------------------------------------------------------
   CONFIGURACIÓN SUPABASE
   ------------------------------------------------------------ */

const PROJECTS_FUNCTION =
  "https://hlyzyeatnbulyfiiwvsq.supabase.co/functions/v1/list-projects";


/* ------------------------------------------------------------
   INICIO
   ------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
  loadProjectsPage();
});


/* ------------------------------------------------------------
   CARGA PRINCIPAL DE LA PÁGINA
   ------------------------------------------------------------ */

async function loadProjectsPage() {
  const container = document.getElementById("projects-grid");
  const loading = document.getElementById("projects-loading");
  const emptyState = document.getElementById("projects-empty-state");

  if (!container) {
    console.error("[Baal Studio] No existe #projects-grid.");
    return;
  }

  try {
    console.log("[Baal Studio] Consultando list-projects...");

    const response = await fetch(PROJECTS_FUNCTION, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      cache: "no-store"
    });

    console.log("[Baal Studio] list-projects HTTP:", response.status);

    if (!response.ok) {
      throw new Error(`list-projects respondió ${response.status}`);
    }

    const result = await response.json();
    console.log("[Baal Studio] Respuesta completa de list-projects:", result);

    const projects = normalizeProjectsResponse(result);
    console.log("[Baal Studio] Proyectos normalizados:", projects);

    if (!projects.length) {
      if (loading) loading.style.display = "none";
      if (emptyState) {
        emptyState.classList.add("visible");
        emptyState.setAttribute("aria-hidden", "false");
      }
      return;
    }

    /* Ordenar proyectos */
    projects.sort((a, b) => {
      const orderA = Number(a.order ?? 999);
      const orderB = Number(b.order ?? 999);
      return orderA - orderB;
    });

    console.log(
      "[Baal Studio] Orden final:",
      projects.map(project => ({
        order: project.order,
        name: project.name,
        title: project.displayName
      }))
    );

    /* Limpiar contenedor y actualizar loader */
    container.innerHTML = "";
    if (loading) loading.style.display = "none";
    if (emptyState) {
      emptyState.classList.remove("visible");
      emptyState.setAttribute("aria-hidden", "true");
    }

    /* Crear tarjetas */
    projects.forEach((project, index) => {
      const card = createProjectCard(project, index);
      if (card) container.appendChild(card);
    });

    console.log(`[Baal Studio] ${projects.length} proyectos cargados correctamente.`);

    if (typeof applyProtectionToImages === "function") {
      applyProtectionToImages();
    }

  } catch (error) {
    console.error("[Baal Studio] Error cargando proyectos:", error);

    if (loading) loading.style.display = "none";
    if (emptyState) {
      emptyState.classList.add("visible");
      emptyState.setAttribute("aria-hidden", "false");
    }
  }
}


/* ------------------------------------------------------------
   NORMALIZAR RESPUESTA DE SUPABASE
   ------------------------------------------------------------ */

function normalizeProjectsResponse(result) {
  if (!result) return [];

  let projects = [];

  if (Array.isArray(result)) {
    projects = result;
  } else if (Array.isArray(result.projects)) {
    projects = result.projects;
  } else if (Array.isArray(result.data)) {
    projects = result.data;
  } else if (Array.isArray(result.results)) {
    projects = result.results;
  }

  return projects.map(normalizeProject).filter(Boolean);
}


/* ------------------------------------------------------------
   NORMALIZAR PROYECTO
   ------------------------------------------------------------ */

function normalizeProject(project) {
  if (!project || typeof project !== "object") return null;

  const rawName =
    project.name ||
    project.title ||
    project.nombre ||
    project.titulo ||
    project.projectName ||
    "";

  let metadata = project?.metadata || null;

  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata);
    } catch (error) {
      console.warn("[Baal Studio] No se pudo interpretar metadata:", error);
      metadata = null;
    }
  }

  const metadataTitle =
    project?.title ||
    metadata?.title ||
    metadata?.titulo ||
    metadata?.nombre ||
    metadata?.name ||
    project?.metadataTitle ||
    project?.metadata_title ||
    "";

  const fallbackName = String(rawName).replace(/\s*\(\d+\)\s*$/i, "").trim();
  const displayName = String(metadataTitle || fallbackName).replace(/\s*[.!?]+\s*$/, "").trim();

  const order = project.order ?? project.orden ?? project.position ?? extractOrderFromName(rawName);
  const cover = extractCover(project);

  const location = metadata?.location || metadata?.localizacion || project.location || project.localizacion || "";
  const year = metadata?.year || metadata?.ano || metadata?.año || project.year || project.año || "";

  const rawCategory = metadata?.category || metadata?.categoria || project.category || project.categoria || "";
  const category = Array.isArray(rawCategory)
    ? rawCategory.slice(0, 2).join(", ")
    : String(rawCategory);

  return {
    ...project,
    metadata,
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
   EXTRAER ORDEN DEL NOMBRE DE CARPETA
   ------------------------------------------------------------ */

function extractOrderFromName(name) {
  const match = String(name || "").match(/\((\d+)\)\s*$/);
  return match ? Number(match[1]) : 999;
}


/* ------------------------------------------------------------
   EXTRAER COVER
   ------------------------------------------------------------ */

function extractCover(project) {
  const directCandidates = [
    project?.cover, project?.coverUrl, project?.cover_url, project?.coverURL,
    project?.image, project?.imageUrl, project?.image_url,
    project?.thumbnail, project?.thumbnailUrl, project?.thumbnail_url,
    project?.portada, project?.portadaUrl, project?.portada_url
  ];

  for (const candidate of directCandidates) {
    const url = extractUrlFromValue(candidate);
    if (isImageUrl(url)) return url;
  }

  return findImageUrl(project) || "";
}


/* ------------------------------------------------------------
   EXTRAER URL DE UN VALOR
   ------------------------------------------------------------ */

function extractUrlFromValue(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";

  const possibleKeys = [
    "url", "signedUrl", "signed_url", "publicUrl", "public_url",
    "downloadUrl", "download_url", "src", "href"
  ];

  for (const key of possibleKeys) {
    if (typeof value[key] === "string" && value[key].trim()) {
      return value[key].trim();
    }
  }

  return "";
}


/* ------------------------------------------------------------
   COMPROBAR SI UNA URL ES UNA IMAGEN
   ------------------------------------------------------------ */

function isImageUrl(url) {
  if (typeof url !== "string" || !url) return false;
  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
  return (
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg") ||
    cleanUrl.endsWith(".png") ||
    cleanUrl.endsWith(".webp") ||
    cleanUrl.endsWith(".avif") ||
    cleanUrl.endsWith(".gif")
  );
}


/* ------------------------------------------------------------
   BÚSQUEDA RECURSIVA DE IMAGEN
   ------------------------------------------------------------ */

function findImageUrl(value, depth = 0) {
  if (depth > 6 || !value) return "";

  const direct = extractUrlFromValue(value);
  if (isImageUrl(direct)) return direct;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImageUrl(item, depth + 1);
      if (found) return found;
    }
    return "";
  }

  if (typeof value !== "object") return "";

  const priorityKeys = [
    "cover", "coverUrl", "cover_url", "image", "imageUrl", "image_url",
    "thumbnail", "thumbnailUrl", "thumbnail_url", "portada", "portadaUrl", "portada_url"
  ];

  for (const key of priorityKeys) {
    if (key in value) {
      const found = findImageUrl(value[key], depth + 1);
      if (found) return found;
    }
  }

  for (const key of Object.keys(value)) {
    if (priorityKeys.includes(key)) continue;
    const found = findImageUrl(value[key], depth + 1);
    if (found) return found;
  }

  return "";
}


/* ------------------------------------------------------------
   CREAR TARJETA DE PROYECTO
   ------------------------------------------------------------ */

function createProjectCard(project, index) {
  if (!project) return null;

  const card = document.createElement("article");
  card.className = "project-page-card";

  /* MEDIA */
  const media = document.createElement("div");
  media.className = "project-page-card-media protected-media";

  const image = document.createElement("img");
  image.className = "protected-image";
  image.alt = `${project.displayName || "Proyecto"} — Baal Studio`;
  image.loading = index === 0 ? "eager" : "lazy";
  image.decoding = "async";
  image.draggable = false;

  if (project.cover) {
    image.src = project.cover;
    console.log(`[Baal Studio] Cover asignado: ${project.displayName}`, project.cover);
  } else {
    console.warn(`[Baal Studio] El proyecto no tiene cover: ${project.displayName}`);
  }

  image.addEventListener("load", () => {
    console.log(`[Baal Studio] Cover cargado: ${project.displayName}`, {
      width: image.naturalWidth,
      height: image.naturalHeight
    });
  });

  image.addEventListener("error", () => {
    console.error(`[Baal Studio] ERROR cargando cover: ${project.displayName}`, image.src);
  });

  media.appendChild(image);

  /* INFORMACIÓN */
  const info = document.createElement("div");
  info.className = "project-page-card-info";

  const header = document.createElement("div");
  header.className = "project-page-card-header";

  if (project.category) {
    const kicker = document.createElement("p");
    kicker.className = "project-page-card-kicker";
    kicker.textContent = project.category;
    header.appendChild(kicker);
  }

  const title = document.createElement("h2");
  title.className = "project-page-card-title";
  title.textContent = project.displayName || "Proyecto";
  header.appendChild(title);

  const englishTitle =
    project?.metadata?.title_en ||
    project?.metadata?.titulo_en ||
    project?.metadata?.englishTitle ||
    project?.metadata?.nombre_en ||
    project?.title_en ||
    project?.titulo_en ||
    "";

  if (englishTitle) {
    const titleEn = document.createElement("p");
    titleEn.className = "project-page-card-title-en";
    titleEn.textContent = englishTitle;
    header.appendChild(titleEn);
  }

  info.appendChild(header);

  /* METADATOS */
  const meta = document.createElement("div");
  meta.className = "project-page-card-meta";

  addMetadataRow(meta, "Ubicación", project.location);
  addMetadataRow(meta, "Año", project.year);
  addMetadataRow(meta, "Categoría", project.category);

  info.appendChild(meta);

  /* FOOTER TARJETA */
  const footer = document.createElement("div");
  footer.className = "project-page-card-footer";

  const projectIndex = document.createElement("span");
  projectIndex.className = "project-page-card-index";
  projectIndex.textContent = String(project.order || index + 1).padStart(2, "0");
  footer.appendChild(projectIndex);

  const link = document.createElement("a");
  link.className = "project-page-card-link";
  link.href = createProjectUrl(project);
  link.innerHTML = `
    <span class="project-page-card-link-main">Ver proyecto</span>
    <span class="project-page-card-link-en">View project</span>
  `;
  footer.appendChild(link);

  info.appendChild(footer);

  card.appendChild(media);
  card.appendChild(info);

  return card;
}


/* ------------------------------------------------------------
   AÑADIR FILA DE METADATO
   ------------------------------------------------------------ */

function addMetadataRow(container, label, value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return;
  }

  const row = document.createElement("div");
  row.className = "project-page-card-meta-item";

  const labelElement = document.createElement("span");
  labelElement.className = "project-page-card-meta-label";
  labelElement.textContent = label;

  const valueElement = document.createElement("span");
  valueElement.className = "project-page-card-meta-value";
  valueElement.textContent = value;

  row.appendChild(labelElement);
  row.appendChild(valueElement);
  container.appendChild(row);
}


/* ------------------------------------------------------------
   URL DEL PROYECTO
   ------------------------------------------------------------ */

function createProjectUrl(project) {
  const projectName = project?.name || project?.displayName || "";
  if (!projectName) return "#";
  return `./proyecto.html?project=${encodeURIComponent(projectName)}`;
}
