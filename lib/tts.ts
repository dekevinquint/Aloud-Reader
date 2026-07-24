export type Engine = "device" | "openai" | "eleven"

export const OPENAI_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "onyx",
  "nova",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar",
]

export type CloudConfig = {
  openaiKey: string
  openaiVoice: string
  openaiModel: string
  elKey: string
  elVoice: string
  elModel: string
}

async function errMsg(res: Response, who: string): Promise<string> {
  let d = ""
  try {
    const j = await res.json()
    d = j.error?.message || j.detail?.message || JSON.stringify(j.detail || "")
  } catch {
    /* ignore */
  }
  if (res.status === 401) return `${who}: invalid API key.`
  if (res.status === 429) return `${who}: rate limit or quota reached.`
  return `${who} error ${res.status}${d ? ": " + d : ""}`
}

export async function fetchOpenAI(text: string, cfg: CloudConfig): Promise<Blob> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + cfg.openaiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: cfg.openaiModel,
      voice: cfg.openaiVoice,
      input: text,
      response_format: "mp3",
    }),
  })
  if (!res.ok) throw new Error(await errMsg(res, "OpenAI"))
  return res.blob()
}

export async function fetchEleven(text: string, cfg: CloudConfig): Promise<Blob> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${cfg.elVoice}?output_format=mp3_44100_128`
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": cfg.elKey, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: cfg.elModel }),
  })
  if (!res.ok) throw new Error(await errMsg(res, "ElevenLabs"))
  return res.blob()
}

export type ElevenVoice = { voice_id: string; name: string; labels?: { accent?: string } }

export async function loadElevenVoices(key: string): Promise<ElevenVoice[]> {
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": key },
  })
  if (!res.ok) throw new Error(await errMsg(res, "ElevenLabs"))
  const data = await res.json()
  return data.voices || []
}
