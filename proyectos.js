/* ============================================================
   BAAL STUDIO
   PROYECTOS.JS — LISTADO DINÁMICO DE PROYECTOS
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

    if (!response.ok) {
      throw new Error(`list-projects respondió ${response.status}`);
    }

    const result = await response.json();
    console.log("[Baal Studio] Respuesta de list-projects:", result);

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

    /* Ordenar según la carpeta/order */
    projects.sort((a, b) => Number(a.order ?? 999) - Number(b.order ?? 999));

    /* Limpiar contenedor y ocultar loading */
    container.innerHTML = "";
    if (loading) loading.style.display = "none";
    if (emptyState) {
      emptyState.classList.remove("visible");
      emptyState.setAttribute("aria-hidden", "true");
    }

    /* Renderizar tarjetas */
    projects.forEach((project, index) => {
      const card = createProjectCard(project, index);
      if (card) container.appendChild(card);
    });

    console.log(`[Baal Studio] ${projects.length} proyectos cargados.`);

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
   NORMALIZAR PROYECTO Y EXTRAER CAMPOS DE PROYECTO.TXT
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

  /* CAMPOS REQUERIDOS DESDE PROYECTO.TXT / METADATA */

  // 1. TÍTULO
  const metadataTitle =
    project?.title ||
    metadata?.title ||
    metadata?.titulo ||
    metadata?.TÍTULO ||
    metadata?.TITULO ||
    metadata?.nombre ||
    metadata?.name ||
    "";

  const fallbackName = String(rawName).replace(/\s*\(\d+\)\s*$/i, "").trim();
  const displayName = String(metadataTitle || fallbackName).replace(/\s*[.!?]+\s*$/, "").trim();

  // 2. CATEGORÍA
  const rawCategory =
    metadata?.category ||
    metadata?.categoria ||
    metadata?.CATEGORÍA ||
    metadata?.CATEGORIA ||
    project?.category ||
    project?.categoria ||
    "";

  const category = Array.isArray(rawCategory) ? rawCategory.join(", ") : String(rawCategory).trim();

  // 3. TÉCNICAS
  const rawTechniques =
    metadata?.techniques ||
    metadata?.tecnicas ||
    metadata?.TÉCNICAS ||
    metadata?.TECNICAS ||
    project?.techniques ||
    project?.tecnicas ||
    "";

  const techniques = Array.isArray(rawTechniques) ? rawTechniques.join(", ") : String(rawTechniques).trim();

  // 4. OBJETIVO
  const rawObjective =
    metadata?.objective ||
    metadata?.objetivo ||
    metadata?.OBJETIVO ||
    project?.objective ||
    project?.objetivo ||
    "";

  const objective = String(rawObjective).trim();

  // OTROS CAMPOS DE APOYO
  const order = project.order ?? project.orden ?? extractOrderFromName(rawName);
  const cover = extractCover(project);

  return {
    ...project,
    metadata,
    name: rawName,
    displayName,
    category,
    techniques,
    objective,
    order,
    cover
  };
}


/* ------------------------------------------------------------
   EXTRAER ORDEN Y PORTADA
   ------------------------------------------------------------ */

function extractOrderFromName(name) {
  const match = String(name || "").match(/\((\d+)\)\s*$/);
  return match ? Number(match[1]) : 999;
}

function extractCover(project) {
  const candidates = [
    project?.cover, project?.coverUrl, project?.cover_url,
    project?.image, project?.imageUrl, project?.image_url,
    project?.portada, project?.portadaUrl, project?.portada_url
  ];

  for (const candidate of candidates) {
    const url = extractUrlFromValue(candidate);
    if (isImageUrl(url)) return url;
  }

  return findImageUrl(project) || "";
}

function extractUrlFromValue(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";

  const keys = ["url", "signedUrl", "signed_url", "publicUrl", "public_url", "src", "href"];
  for (const k of keys) {
    if (typeof value[k] === "string" && value[k].trim()) return value[k].trim();
  }
  return "";
}

function isImageUrl(url) {
  if (typeof url !== "string" || !url) return false;
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"].some(ext => clean.endsWith(ext));
}

function findImageUrl(value, depth = 0) {
  if (depth > 5 || !value) return "";
  const direct = extractUrlFromValue(value);
  if (isImageUrl(direct)) return direct;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImageUrl(item, depth + 1);
      if (found) return found;
    }
    return "";
  }

  if (typeof value === "object") {
    for (const k of Object.keys(value)) {
      const found = findImageUrl(value[k], depth + 1);
      if (found) return found;
    }
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

  /* PORTADA */
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
  }

  media.appendChild(image);

  /* INFORMACIÓN */
  const info = document.createElement("div");
  info.className = "project-page-card-info";

  const header = document.createElement("div");
  header.className = "project-page-card-header";

  /* Texto Fijo encima del Título */
  const kicker = document.createElement("p");
  kicker.className = "project-page-card-kicker";
  kicker.textContent = "Selección de proyectos";
  header.appendChild(kicker);

  /* Campo: TÍTULO */
  const title = document.createElement("h2");
  title.className = "project-page-card-title";
  title.textContent = project.displayName || "Proyecto";
  header.appendChild(title);

  /* Título en Inglés (si existe) */
  const englishTitle =
    project?.metadata?.title_en ||
    project?.metadata?.titulo_en ||
    project?.metadata?.englishTitle ||
    "";

  if (englishTitle) {
    const titleEn = document.createElement("p");
    titleEn.className = "project-page-card-title-en";
    titleEn.textContent = englishTitle;
    header.appendChild(titleEn);
  }

  info.appendChild(header);

  /* METADATOS: CATEGORÍA, TÉCNICAS Y OBJETIVO */
  const meta = document.createElement("div");
  meta.className = "project-page-card-meta";

  addMetadataRow(meta, "Categoría", project.category);
  addMetadataRow(meta, "Técnicas", project.techniques);
  addMetadataRow(meta, "Objetivo", project.objective);

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
   URL DEL PROYECTO COMPLETO
   ------------------------------------------------------------ */

function createProjectUrl(project) {
  const projectName = project?.name || project?.displayName || "";
  if (!projectName) return "#";
  return `./proyecto.html?project=${encodeURIComponent(projectName)}`;
}
