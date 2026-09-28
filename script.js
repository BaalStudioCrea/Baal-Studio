const SUPABASE_BASE_URL = "https://hlyzyeatnbulyfiiwvsq.supabase.co/functions/v1";
const ASSETS_FUNCTION_URL = `${SUPABASE_BASE_URL}/get-site-assets`;

/**
 * Carga los activos estáticos del sitio (Logo, Fondo Hero, Marca de Agua y QR)
 * desde la Edge Function get-site-assets
 */
async function loadSiteAssets() {
  try {
    const response = await fetch(ASSETS_FUNCTION_URL);
    const data = await response.json();

    if (!data.success || !data.assets) {
      console.warn("No se pudieron obtener los activos estáticos:", data);
      return;
    }

    const { fondo, logoPrincipal, logoLNS, qr } = data.assets;

    // 1. Inyectar imagen de fondo en la sección Hero
    const heroSection = document.querySelector('.hero-section');
    if (heroSection && fondo) {
      heroSection.style.backgroundImage = `url('${fondo}')`;
    }

    // 2. Inyectar Logo Principal en el Header
    const logoContainer = document.querySelector('.logo-header');
    if (logoContainer && logoPrincipal) {
      logoContainer.innerHTML = `<img src="${logoPrincipal}" alt="Baal Studio Logo" class="brand-logo-img">`;
    }

    // 3. Inyectar Logo Secundario (Marca de Agua)
    const brandSecondaryContainer = document.querySelector('.brand-secondary-container');
    if (brandSecondaryContainer && logoLNS) {
      brandSecondaryContainer.innerHTML = `<img src="${logoLNS}" alt="LNS Logo" class="social-logo-img">`;
    }

    // 4. Inyectar Código QR en el Footer con enlace
    const qrContainer = document.querySelector('.footer-qr-container');
    if (qrContainer && qr) {
      qrContainer.innerHTML = `
        <a href="https://linktr.ee/baalstudio" target="_blank" rel="noopener noreferrer" title="Escanear o hacer clic para abrir Linktree">
          <img src="${qr}" alt="Código QR Linktree Baal Studio" class="footer-qr-img">
        </a>
      `;
    }

  } catch (error) {
    console.error("Error al conectar con la Edge Function get-site-assets:", error);
  }
}

// Inicialización cuando la página esté completamente cargada
document.addEventListener("DOMContentLoaded", () => {
  loadSiteAssets();
});
