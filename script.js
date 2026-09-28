const SUPABASE_BASE_URL = "https://hlyzyeatnbulyfiiwvsq.supabase.co/functions/v1";
const ASSETS_FUNCTION_URL = `${SUPABASE_BASE_URL}/get-site-assets`;
const PROJECTS_FUNCTION_URL = `${SUPABASE_BASE_URL}/get-projects`; // Nombre de tu función de proyectos

async function loadSiteAssets() {
  try {
    const response = await fetch(ASSETS_FUNCTION_URL);
    const data = await response.json();

    if (!data.success || !data.assets) return;

    const { fondo, logoPrincipal, logoLNS, qr } = data.assets;

    // 1. Inyectar imagen de fondo Hero
    const heroSection = document.querySelector('.hero-section');
    if (heroSection && fondo) {
      heroSection.style.backgroundImage = `url('${fondo}')`;
    }

    // 2. Inyectar Logo principal en la cabecera
    const logoContainer = document.querySelector('.logo-header');
    if (logoContainer && logoPrincipal) {
      logoContainer.innerHTML = `<img src="${logoPrincipal}" alt="Baal Studio Logo" class="brand-logo-img">`;
    }

    // 3. Inyectar Logo secundario (al 12% de opacidad) antes del footer
    const brandSecondaryContainer = document.querySelector('.brand-secondary-container');
    if (brandSecondaryContainer && logoLNS) {
      brandSecondaryContainer.innerHTML = `<img src="${logoLNS}" alt="LNS Logo" class="social-logo-img">`;
    }

    // 4. Inyectar Código QR en el Footer
    const qrContainer = document.querySelector('.footer-qr-container');
    if (qrContainer && qr) {
      qrContainer.innerHTML = `
        <a href="https://linktr.ee/baalstudio" target="_blank" rel="noopener" title="Escanear o hacer clic para abrir Linktree">
          <img src="${qr}" alt="Código QR Linktree Baal Studio" class="footer-qr-img">
        </a>
      `;
    }

  } catch (error) {
    console.error("Error cargando los activos del sitio:", error);
  }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  loadSiteAssets();
  // loadProjects(); // Se invocará cuando tengamos la función de proyectos lista
});
