import { ensureFontLoaded } from './fontLoader'

interface ExportParams {
  text: string[]      // tableau de mots
  fontUrl: string
  wghts: number[]
  baseFontSize: number
}

export const exportTextToSvg = async (params: ExportParams): Promise<{ blob: Blob, filename: string }> => {
  const { text, fontUrl, wghts, baseFontSize } = params

  // Charger la police
  await ensureFontLoaded('', fontUrl) // nom non nécessaire ici

  // Calculer largeur/hauteur approximative
  const svgParts: string[] = []
  let x = 0
  const y = baseFontSize

  text.forEach((word, i) => {
    const wght = wghts[i]
    const fontSize = baseFontSize
    svgParts.push(
      `<text x="${x}" y="${y}" font-family="CustomFont" font-size="${fontSize}" font-weight="${wght}">${word}</text>`
    )
    x += word.length * fontSize * 0.6 + fontSize * 0.2 // espacement approximatif
  })

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg">
    ${svgParts.join('\n')}
  </svg>`

  const blob = new Blob([svgContent], { type: 'image/svg+xml' })
  const filename = 'stickyphrases.svg'
  return { blob, filename }
}
