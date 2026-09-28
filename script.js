// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = "https://hlyzyeatnbulyfiiwvsq.supabase.co";
// Reemplaza esta variable con tu clave pública anon Key de Supabase si la tienes a mano
const SUPABASE_ANON_KEY = "TU_SUPABASE_ANON_KEY"; 

document.addEventListener("DOMContentLoaded", () => {
  cargarRecursosEstaticos();
  cargarProyectos();
});

/**
 * 1. Carga los logos, imagen Hero y QR desde tu Storage o servidor
 */
function cargarRecursosEstaticos() {
  // Ajusta estas rutas a las URLs públicas o firmadas de tus imágenes base
  const logoHeaderUrl = `${SUPABASE_URL}/storage/v1/object/public/site/NEWBaal_Logo_White.png`;
  const logoSecondaryUrl = `${SUPABASE_URL}/storage/v1/object/public/site/LNS_LOGO_WHITE.png`;
  const qrUrl = `${SUPABASE_URL}/storage/v1/object/public/site/QRBAAL.png`;
  const heroBgUrl = `${SUPABASE_URL}/storage/v1/object/public/site/fondo.webp`;

  // Inyectar Logo Header
  const headerLogoContainer = document.querySelector(".logo-header");
  if (headerLogoContainer) {
    headerLogoContainer.innerHTML = `<img src="${logoHeaderUrl}" alt="Baal Studio" class="brand-logo-img">`;
  }

  // Inyectar Fondo Hero
  const heroSection = document.querySelector(".hero-section");
  if (heroSection) {
    heroSection.style.backgroundImage = `url('${heroBgUrl}')`;
  }

  // Inyectar Logo Secundario (Marca de agua 12%)
  const secondaryLogoContainer = document.querySelector(".brand-secondary-container");
  if (secondaryLogoContainer) {
    secondaryLogoContainer.innerHTML = `<img src="${logoSecondaryUrl}" alt="Baal Studio Secondary Logo" class="social-logo-img">`;
  }

  // Inyectar QR en el Footer
  const qrContainer = document.querySelector(".footer-qr-container");
  if (qrContainer) {
    qrContainer.innerHTML = `<a href="https://linktr.ee/baalstudio" target="_blank" rel="noopener"><img src="${qrUrl}" alt="QR Linktree Baal Studio" class="footer-qr-img"></a>`;
  }
}

/**
 * 2. Llama a la Edge Function para renderizar las tarjetas de proyectos
 */
async function cargarProyectos() {
  const projectsGrid = document.getElementById("projects-grid");
  if (!projectsGrid) return;

  try {
    // Reemplaza por el nombre exacto de la Edge Function que probaste (list-projects o get-projects)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-projects`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!data.projects || data.projects.length === 0) {
      projectsGrid.innerHTML = "<p>No hay proyectos disponibles en este momento.</p>";
      return;
    }

    // Limpiar contenedor
    projectsGrid.innerHTML = "";

    // Inyectar cada tarjeta de proyecto
    data.projects.forEach((project) => {
      const card = document.createElement("div");
      card.className = "project-card";

      const imageUrl = project.signed_image_url || "https://via.placeholder.com/600x400?text=Sin+Imagen";

      card.innerHTML = `
        <div class="project-thumb-container">
          <img src="${imageUrl}" alt="${project.title}" class="project-thumb" loading="lazy">
        </div>
        <div class="project-info">
          <h3 class="project-title">${project.title}</h3>
          <p class="project-meta">Documentación Patrimonial</p>
        </div>
      `;

      projectsGrid.appendChild(card);
    });

  } catch (error) {
    console.error("Error al cargar los proyectos:", error);
    projectsGrid.innerHTML = "<p>Ocurrió un error al cargar los proyectos.</p>";
  }
}
