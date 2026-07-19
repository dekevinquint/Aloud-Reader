export type Chunk = { text: string; para: boolean }

// Join hyphenated line breaks, collapse whitespace, tidy paragraph gaps.
export function normalize(t: string): string {
  return t
    .replace(/\r/g, "\n")
    .replace(/([A-Za-z])-\n([a-z])/g, "$1$2")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

// Split a very long sentence on soft boundaries so a single utterance isn't huge.
function splitLong(s: string): string[] {
  const MAX = 260
  if (s.length <= MAX) return [s]
  const pieces: string[] = []
  let rest = s
  while (rest.length > MAX) {
    let cut = rest.lastIndexOf(", ", MAX)
    if (cut < 60) cut = rest.lastIndexOf("; ", MAX)
    if (cut < 60) cut = rest.lastIndexOf(" ", MAX)
    if (cut < 60) cut = MAX
    pieces.push(rest.slice(0, cut + 1).trim())
    rest = rest.slice(cut + 1)
  }
  if (rest.trim()) pieces.push(rest.trim())
  return pieces
}

// Break normalized text into sentence-sized chunks, marking paragraph starts.
export function chunkText(text: string): Chunk[] {
  const out: Chunk[] = []
  const paras = text.split(/\n{2,}/)
  for (const para of paras) {
    const flat = para.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim()
    if (!flat) continue
    const sentences = flat.match(/[^.!?…]+[.!?…]+["'”’)\]]*\s*|[^.!?…]+$/g) || [flat]
    let first = true
    for (let s of sentences) {
      s = s.trim()
      if (!s) continue
      for (const piece of splitLong(s)) {
        out.push({ text: piece, para: first })
        first = false
      }
    }
  }
  return out
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}
