// src/services/fontLoader.ts
export async function ensureFontLoaded(family: string, url?: string): Promise<void> {
  if (!family) return

  // Vérifie si la police est déjà chargée
  const loaded = Array.from(document.fonts).some(f => f.family === family)
  if (loaded) return

  // Si on a une URL, injecte un <link> pour Google Fonts
  if (url) {
    // Vérifie si le <link> existe déjà
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      document.head.appendChild(link)
    }
  }

  // Attend que la police soit disponible dans document.fonts
  try {
    await document.fonts.load(`1em "${family}"`)
  } catch (e) {
    console.warn('Font load failed:', family, e)
  }
}
