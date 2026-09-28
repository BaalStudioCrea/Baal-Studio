// Configuración de tu función de Supabase
// REEMPLAZA esta URL por el enlace real de tu Edge Function / API de Supabase
const SUPABASE_FUNCTION_URL = "https://TU-PROYECTO.supabase.co/functions/v1/TU-FUNCION";

async function loadProjects() {
  const container = document.getElementById("projects-grid");
  if (!container) return;

  try {
    const response = await fetch(SUPABASE_FUNCTION_URL);
    const data = await response.json();

    if (!data.success || !data.projects) {
      container.innerHTML = "<p>No se pudieron cargar los proyectos.</p>";
      return;
    }

    // Limpiamos el mensaje de carga
    container.innerHTML = "";

    // Ordenamos los proyectos por el campo 'order'
    const sortedProjects = data.projects.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Generamos cada tarjeta de proyecto con datos reales de Supabase
    sortedProjects.forEach((project) => {
      const card = document.createElement("a");
      card.className = "project-card";
      // Enlace para ir al detalle del proyecto pasando su nombre por URL
      card.href = `proyecto.html?name=${encodeURIComponent(project.name)}`;

      // Extracción limpia de metadatos devueltos por tu función
      const title = project.metadata?.title || project.name;
      const location = project.metadata?.location || "";
      const year = project.metadata?.year || "";
      const coverUrl = project.cover?.url || "";

      // Renderizado con Lazy Loading en las imágenes para máxima velocidad
      card.innerHTML = `
        <img src="${coverUrl}" alt="${title}" loading="lazy" decoding="async" />
        <div class="project-info">
          <h3 class="project-title">${title}</h3>
          <p class="project-meta">${[location, year].filter(Boolean).join(" — ")}</p>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (error) {
    console.error("Error al obtener los proyectos:", error);
    container.innerHTML = "<p>Ocurrió un error al cargar la galería.</p>";
  }
}

// Ejecutar cuando la página esté lista
document.addEventListener("DOMContentLoaded", loadProjects);
