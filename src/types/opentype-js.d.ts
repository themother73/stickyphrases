// src/types/opentype-js.d.ts
declare module 'opentype.js' {
  interface Glyph {
    advanceWidth: number
  }

  interface Path {
    toPathData?: (decimalPlaces?: number) => string
    toSVG?: () => string
    getBoundingBox?: () => { x1: number; y1: number; x2: number; y2: number }
  }

  interface Font {
    unitsPerEm: number
    stringToGlyphs: (str: string) => Glyph[]
    getPath: (text: string, x: number, y: number, fontSize: number) => Path
  }

  function parse(arrayBuffer: ArrayBuffer): Font

  const opentype: {
    parse: typeof parse
  }

  export default opentype
}
