const SUPABASE_FUNCTION_BASE =
  "https://hlyzyeatnbulyfiiwvsq.supabase.co/functions/v1";


async function loadSiteAssets() {

  try {

    const response = await fetch(
      `${SUPABASE_FUNCTION_BASE}/get-site-assets`
    );

    if (!response.ok) {
      throw new Error(
        `Error HTTP ${response.status}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.error || "No se pudieron obtener los recursos del sitio."
      );
    }

    return data.assets;

  } catch (error) {

    console.error(
      "Error cargando los recursos del sitio:",
      error
    );

    return null;
  }
}


async function initHome() {

  const assets = await loadSiteAssets();

  if (!assets) {
    console.error(
      "No se pudieron cargar los recursos de Baal Studio."
    );

    return;
  }


  /* =========================
     LOGO PRINCIPAL
     ========================= */

  const logo = document.getElementById("site-logo");

  if (logo && assets.logoPrincipal) {

    logo.src = assets.logoPrincipal;

  }


  /* =========================
     FONDO PRINCIPAL
     ========================= */

  const hero = document.getElementById("hero");

  if (hero && assets.fondo) {

    hero.style.backgroundImage =
      `url("${assets.fondo}")`;

  }

}


document.addEventListener(
  "DOMContentLoaded",
  initHome
);
