import type { PDFDocumentProxy } from "pdfjs-dist"

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null

// Lazily import pdf.js on the client and wire up its worker.
async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString()
      return pdfjs
    })
  }
  return pdfjsPromise
}

export async function openPdf(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfjs()
  return pdfjs.getDocument({ data }).promise
}

// Extract selectable text from every page.
export async function extractText(
  pdf: PDFDocumentProxy,
  onProgress?: (page: number, total: number) => void,
): Promise<string> {
  let raw = ""
  for (let p = 1; p <= pdf.numPages; p++) {
    onProgress?.(p, pdf.numPages)
    const page = await pdf.getPage(p)
    const tc = await page.getTextContent()
    let t = ""
    for (const item of tc.items) {
      // TextItem has `str`; TextMarkedContent does not.
      if (!("str" in item)) continue
      t += item.str
      if (item.hasEOL) t += "\n"
      else if (!item.str.endsWith(" ")) t += " "
    }
    raw += t + "\n\n"
  }
  return raw
}

// Rasterize a page to a canvas for OCR.
export async function renderPageToCanvas(
  pdf: PDFDocumentProxy,
  pageNum: number,
  scale = 2,
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNum)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement("canvas")
  canvas.width = viewport.width
  canvas.height = viewport.height
  const context = canvas.getContext("2d")!
  await page.render({ canvas, canvasContext: context, viewport }).promise
  return canvas
}
