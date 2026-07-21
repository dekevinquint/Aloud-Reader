"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { PDFDocumentProxy } from "pdfjs-dist"
import { chunkText, countWords, normalize, type Chunk } from "./text"
import { extractText, openPdf, renderPageToCanvas } from "./pdf"
import {
  fetchEleven,
  fetchOpenAI,
  loadElevenVoices,
  OPENAI_VOICES,
  type CloudConfig,
  type ElevenVoice,
  type Engine,
} from "./tts"

export type LoadingState = {
  active: boolean
  message: string
  showBar: boolean
  barPct: number
  cancellable: boolean
}

const IDLE_LOADING: LoadingState = {
  active: false,
  message: "",
  showBar: false,
  barPct: 0,
  cancellable: false,
}

const DEFAULT_CFG: CloudConfig = {
  openaiKey: "",
  openaiVoice: "coral",
  openaiModel: "gpt-4o-mini-tts",
  elKey: "",
  elVoice: "21m00Tcm4TlvDq8ikWAM",
  elModel: "eleven_multilingual_v2",
}

const DEFAULT_EL_VOICES: ElevenVoice[] = [{ voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (default)" }]

export type LibraryEntry = {
  id: string
  name: string
  text: string
  totalChunks: number
  wordCount: number
  addedAt: number
  updatedAt: number
}

export function useAloud() {
  // ---- reactive state ----
  const [chunks, setChunks] = useState<Chunk[]>([])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [engine, setEngine] = useState<Engine>("device")
  const [rate, setRate] = useState(0.9)
  const [docName, setDocName] = useState("document")
  const [totalWords, setTotalWords] = useState(0)
  const [status, setStatus] = useState("Ready")
  const [hasDoc, setHasDoc] = useState(false)
  const [ocrBannerVisible, setOcrBannerVisible] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [loading, setLoading] = useState<LoadingState>(IDLE_LOADING)
  const [toast, setToast] = useState("")

  const [deviceVoices, setDeviceVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedDeviceVoice, setSelectedDeviceVoice] = useState<string>("")
  const [cfg, setCfg] = useState<CloudConfig>(DEFAULT_CFG)
  const [elVoices, setElVoices] = useState<ElevenVoice[]>(DEFAULT_EL_VOICES)
  const [library, setLibrary] = useState<LibraryEntry[]>([])
  const [isPro, setIsProState] = useState(false)

  // ---- mutable refs (avoid stale closures across async playback) ----
  const sessionRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const chunksRef = useRef<Chunk[]>([])
  const idxRef = useRef(0)
  const rateRef = useRef(0.9)
  const engineRef = useRef<Engine>("device")
  const cfgRef = useRef<CloudConfig>(DEFAULT_CFG)
  const deviceVoicesRef = useRef<SpeechSynthesisVoice[]>([])
  const selectedVoiceRef = useRef<string>(""); const docNameRef = useRef<string>("document")
  const audioCacheRef = useRef<Record<string, Blob>>({})
  const inflightRef = useRef<Record<string, Promise<Blob>>>({})
  const ocrRunningRef = useRef(false)
  const downloadAbortRef = useRef(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reduceMotion = useRef(false)
  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion:reduce)").matches
  }, [])

  // keep refs synced with state
  useEffect(() => {
    chunksRef.current = chunks
  }, [chunks])
  useEffect(() => {
    idxRef.current = idx
  }, [idx])
  useEffect(() => {
    rateRef.current = rate
  }, [rate])
  useEffect(() => {
    engineRef.current = engine
  }, [engine])
  useEffect(() => {
    cfgRef.current = cfg
  }, [cfg])
  useEffect(() => {
    deviceVoicesRef.current = deviceVoices
  }, [deviceVoices])
  useEffect(() => {
    selectedVoiceRef.current = selectedDeviceVoice
  }, [selectedDeviceVoice])

  const synth = () => (typeof window !== "undefined" ? window.speechSynthesis : null)

  // ---- toast ----
  const showToast = useCallback((m: string) => {
    setToast(m)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(""), 4200)
  }, [])

  // ---- device voices ----
  useEffect(() => {
    const s = synth()
    if (!s) return
    const refresh = () => {
      const voices = s.getVoices()
      if (!voices.length) return
      const sorted = [...voices].sort((a, b) => {
        const ae = a.lang.startsWith("en") ? 0 : 1
        const be = b.lang.startsWith("en") ? 0 : 1
        return ae - be || a.name.localeCompare(b.name)
      })
      setDeviceVoices(sorted)
      setSelectedDeviceVoice((cur) => {
        if (cur && sorted.some((v) => v.name === cur)) return cur
        const def =
          sorted.find((v) => v.name.toLowerCase().includes("google") && v.lang.startsWith("en")) ||
          sorted.find((v) => v.name.toLowerCase().includes("google")) ||
          sorted.find((v) => v.default && v.lang.startsWith("en")) ||
          sorted.find((v) => v.lang.startsWith("en")) ||
          sorted[0]
        return def ? def.name : ""
      })
    }
    refresh()
    s.onvoiceschanged = refresh
    return () => {
      s.onvoiceschanged = null
    }
  }, [])

  // The voice list shown in the dock, per active engine.
  const dockVoices = useMemo(() => {
    if (engine === "device") {
      return deviceVoices.map((v) => ({ value: v.name, label: `${v.name} · ${v.lang}` }))
    }
    if (engine === "openai") {
      return OPENAI_VOICES.map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))
    }
    return elVoices.map((v) => ({
      value: v.voice_id,
      label: `${v.name}${v.labels?.accent ? " · " + v.labels.accent : ""}`,
    }))
  }, [engine, deviceVoices, elVoices])

  const dockVoiceValue = useMemo(() => {
    if (engine === "device") return selectedDeviceVoice
    if (engine === "openai") return cfg.openaiVoice
    return cfg.elVoice
  }, [engine, selectedDeviceVoice, cfg.openaiVoice, cfg.elVoice])

  // ---- cloud audio caching ----
  const voiceKey = useCallback(() => {
    const c = cfgRef.current
    return engineRef.current === "openai"
      ? `oa:${c.openaiModel}:${c.openaiVoice}`
      : `el:${c.elModel}:${c.elVoice}`
  }, [])

  const clearCache = useCallback(() => {
    audioCacheRef.current = {}
    inflightRef.current = {}
  }, [])

  const getAudio = useCallback(
    (i: number): Promise<Blob> => {
      const key = `${voiceKey()}#${i}`
      if (audioCacheRef.current[key]) return Promise.resolve(audioCacheRef.current[key])
      if (inflightRef.current[key]) return inflightRef.current[key]
      const text = chunksRef.current[i].text
      const cfgNow = cfgRef.current
      const p = (engineRef.current === "openai" ? fetchOpenAI(text, cfgNow) : fetchEleven(text, cfgNow))
        .then((b) => {
          audioCacheRef.current[key] = b
          delete inflightRef.current[key]
          return b
        })
        .catch((e) => {
          delete inflightRef.current[key]
          throw e
        })
      inflightRef.current[key] = p
      return p
    },
    [voiceKey],
  )

  const prefetch = useCallback(
    (i: number) => {
      if (i < chunksRef.current.length && engineRef.current !== "device") getAudio(i).catch(() => {})
    },
    [getAudio],
  )

  // ---- playback ----
  const cancelAudio = useCallback(() => {
    synth()?.cancel()
    try {
      audioRef.current?.pause()
    } catch {
      /* ignore */
    }
  }, [])

  const finish = useCallback(() => {
    setPlaying(false)
    setPaused(false)
    setStatus("Finished")
  }, [])

  const playChunk = useCallback(
    (i: number) => {
      const list = chunksRef.current
      if (i >= list.length) {
        finish()
        return
      }
      idxRef.current = i
      setIdx(i)
      try {
        localStorage.setItem(`aloud:pos:${docNameRef.current}`, String(i))
      } catch {}
      const mySession = sessionRef.current
      const audio = audioRef.current

      if (engineRef.current === "device") {
        const s = synth()
        if (!s) return
        const u = new SpeechSynthesisUtterance(list[i].text)
        const v = deviceVoicesRef.current.find((x) => x.name === selectedVoiceRef.current)
        if (v) u.voice = v
        u.rate = rateRef.current
        u.pitch = 1
        u.onend = () => {
          if (mySession === sessionRef.current) playChunk(i + 1)
        }
        u.onerror = () => {
          if (mySession === sessionRef.current) playChunk(i + 1)
        }
        s.speak(u)
      } else {
        setStatus("Generating audio…")
        getAudio(i)
          .then((blob) => {
            if (mySession !== sessionRef.current || !audio) return
            audio.src = URL.createObjectURL(blob)
            audio.playbackRate = rateRef.current
            audio.onended = () => {
              if (mySession === sessionRef.current) playChunk(i + 1)
            }
            audio.onerror = () => {
              if (mySession === sessionRef.current) playChunk(i + 1)
            }
            audio
              .play()
              .then(() => {
                if (mySession === sessionRef.current) {
                  setStatus("Reading…")
                  prefetch(i + 1)
                }
              })
              .catch(() => {
                if (mySession === sessionRef.current)
                  showToast("Playback was blocked — press play again.")
              })
          })
          .catch((e) => {
            if (mySession !== sessionRef.current) return
            stopReadingInternal()
            showToast(e?.message || "Couldn't generate audio.")
          })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finish, getAudio, prefetch, showToast],
  )

  const stopReadingInternal = useCallback(() => {
    sessionRef.current++
    cancelAudio()
    setPlaying(false)
    setPaused(false)
  }, [cancelAudio])

  const goHome = useCallback(() => {
    stopReadingInternal()
    setHasDoc(false)
  }, [stopReadingInternal])

  const play = useCallback(() => {
    if (!chunksRef.current.length) return
    const e = engineRef.current
    const c = cfgRef.current
    if ((e === "openai" && !c.openaiKey) || (e === "eleven" && !c.elKey)) {
      showToast(`Add your ${e === "openai" ? "OpenAI" : "ElevenLabs"} API key to use this voice.`)
      return { needKey: true }
    }
    sessionRef.current++
    cancelAudio()
    setPlaying(true)
    setPaused(false)
    const start = idxRef.current >= chunksRef.current.length ? 0 : idxRef.current
    playChunk(start)
    return { needKey: false }
  }, [cancelAudio, playChunk, showToast])

  const pauseReading = useCallback(() => {
    if (engineRef.current === "device") synth()?.pause()
    else audioRef.current?.pause()
    setPaused(true)
    setStatus("Paused")
  }, [])

  const resumeReading = useCallback(() => {
    if (engineRef.current === "device") synth()?.resume()
    else audioRef.current?.play()
    setPaused(false)
    setStatus("Reading…")
  }, [])

  const togglePlay = useCallback(() => {
    setPlaying((wasPlaying) => {
      setPaused((wasPaused) => {
        if (!wasPlaying) {
          play()
        } else if (wasPaused) {
          resumeReading()
        } else {
          pauseReading()
        }
        return wasPaused
      })
      return wasPlaying
    })
  }, [play, pauseReading, resumeReading])

  const jumpTo = useCallback(
    (i: number, thenPlay: boolean) => {
      sessionRef.current++
      cancelAudio()
      idxRef.current = i
      setIdx(i)
      try {
        localStorage.setItem(`aloud:pos:${docNameRef.current}`, String(i))
      } catch {}
      if (thenPlay) {
        play()
      } else {
        setPlaying(false)
        setPaused(false)
      }
    },
    [cancelAudio, play],
  )

  const next = useCallback(
    (isPlaying: boolean) => jumpTo(Math.min(chunksRef.current.length - 1, idxRef.current + 1), isPlaying),
    [jumpTo],
  )
  const prev = useCallback(
    (isPlaying: boolean) => jumpTo(Math.max(0, idxRef.current - 1), isPlaying),
    [jumpTo],
  )

  const seekToFraction = useCallback(
    (pct: number, isPlaying: boolean) => {
      const target = Math.min(chunksRef.current.length - 1, Math.floor(pct * chunksRef.current.length))
      jumpTo(Math.max(0, target), isPlaying)
    },
    [jumpTo],
  )

  // Live rate change: cloud updates immediately; device restarts current chunk.
  const changeRate = useCallback(
    (value: number) => {
      setRate(value)
      rateRef.current = value
      if (engineRef.current !== "device") {
        if (audioRef.current) audioRef.current.playbackRate = value
      }
    },
    [],
  )
  const commitRate = useCallback(() => {
    if (engineRef.current === "device") {
      // restart current chunk at new rate if actively playing
      setPlaying((p) => {
        setPaused((pd) => {
          if (p && !pd) play()
          return pd
        })
        return p
      })
    }
  }, [play])

  // ---- apply extracted text ----
  const applyText = useCallback((clean: string, name: string) => {
    const cks = chunkText(clean)
    chunksRef.current = cks
    setChunks(cks)
    setTotalWords(countWords(clean))
    setDocName(name)
    docNameRef.current = name
    idxRef.current = 0
    setIdx(0)
    clearCache()
    return cks
  }, [clearCache])

  // ---- load a PDF ----
  const loadPDF = useCallback(
    async (file: File) => {
      stopReadingInternal()
      clearCache()
      setLoading({ ...IDLE_LOADING, active: true, message: "Opening your document…" })
      try {
        const buf = await file.arrayBuffer()
        const pdf = await openPdf(buf)
        pdfRef.current = pdf
        const raw = await extractText(pdf, (p, total) =>
          setLoading((l) => ({ ...l, message: `Reading page ${p} of ${total}…` })),
        )
        const base = file.name.replace(/\.pdf$/i, "") || "document"
        const clean = normalize(raw)
        setHasDoc(true)
        setLoading(IDLE_LOADING)
        if (!clean.trim()) {
          applyText("(No selectable text found in this PDF.)", base)
          setOcrBannerVisible(true)
          setStatus("This looks scanned — try OCR")
        } else {
          const cks = applyText(clean, base)
          try {
            const saved = localStorage.getItem(`aloud:pos:${base}`)
            if (saved) {
              const savedIdx = parseInt(saved, 10)
              if (!isNaN(savedIdx) && savedIdx > 0 && savedIdx < cks.length) {
                idxRef.current = savedIdx
                setIdx(savedIdx)
              }
            }
          } catch {}
          try {
            const now = Date.now()
            setLibrary((prev) => {
              const existing = prev.find((e) => e.id === base)
              const entry: LibraryEntry = {
                id: base,
                name: base,
                text: clean,
                totalChunks: cks.length,
                wordCount: countWords(clean),
                addedAt: existing ? existing.addedAt : now,
                updatedAt: now,
              }
              const next = [entry, ...prev.filter((e) => e.id !== base)]
              try {
                localStorage.setItem("aloud:library", JSON.stringify(next))
              } catch {}
              return next
            })
          } catch {}
          const words = countWords(clean)
          setOcrBannerVisible(words < pdf.numPages * 12)
          setStatus(cks.length ? "Ready — press play" : "Ready")
        }
      } catch (err) {
        console.error(err)
        setLoading(IDLE_LOADING)
        showToast("Couldn't read that PDF. It may be encrypted or corrupted.")
      }
    },
    [applyText, clearCache, showToast, stopReadingInternal],
  )

  // ---- library (paid feature) ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem("aloud:library")
      if (raw) setLibrary(JSON.parse(raw))
    } catch {}
    try {
      setIsProState(localStorage.getItem("aloud:pro") === "1")
    } catch {}
  }, [])

  const openLibraryEntry = useCallback(
    (id: string) => {
      const entry = library.find((e) => e.id === id)
      if (!entry) return
      stopReadingInternal()
      clearCache()
      setHasDoc(true)
      const cks = applyText(entry.text, entry.name)
      try {
        const saved = localStorage.getItem(`aloud:pos:${entry.name}`)
        if (saved) {
          const savedIdx = parseInt(saved, 10)
          if (!isNaN(savedIdx) && savedIdx > 0 && savedIdx < cks.length) {
            idxRef.current = savedIdx
            setIdx(savedIdx)
          }
        }
      } catch {}
      setOcrBannerVisible(false)
      setStatus(cks.length ? "Ready — press play" : "Ready")
    },
    [library, stopReadingInternal, clearCache, applyText],
  )

  const removeLibraryEntry = useCallback((id: string) => {
    setLibrary((prev) => {
      const next = prev.filter((e) => e.id !== id)
      try {
        localStorage.setItem("aloud:library", JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const setIsPro = useCallback((v: boolean) => {
    setIsProState(v)
    try {
      localStorage.setItem("aloud:pro", v ? "1" : "0")
    } catch {}
  }, [])

  // ---- OCR ----
  const runOCR = useCallback(async () => {
    const pdf = pdfRef.current
    if (!pdf || ocrRunningRef.current) return
    ocrRunningRef.current = true
    stopReadingInternal()
    setOcrBannerVisible(false)
    let cancelled = false
    const cancel = () => {
      cancelled = true
    }
    setLoading({
      active: true,
      message: "Loading the OCR engine…",
      showBar: true,
      barPct: 0,
      cancellable: true,
    })
    // expose cancel via closure on the loading object
    ocrCancelRef.current = cancel
    try {
      const { createWorker } = await import("tesseract.js")
      const worker = await createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text")
            setLoading((l) => ({ ...l, barPct: Math.round(m.progress * 100) }))
        },
      })
      let all = ""
      for (let p = 1; p <= pdf.numPages; p++) {
        if (cancelled) break
        setLoading((l) => ({ ...l, message: `Scanning page ${p} of ${pdf.numPages}…`, barPct: 0 }))
        const canvas = await renderPageToCanvas(pdf, p, 2)
        const { data } = await worker.recognize(canvas)
        all += (data.text || "") + "\n\n"
      }
      await worker.terminate()
      setLoading(IDLE_LOADING)
      if (cancelled) {
        showToast("OCR cancelled.")
        ocrRunningRef.current = false
        return
      }
      const clean = normalize(all)
      if (!clean.trim()) {
        showToast("OCR didn't find readable text on these pages.")
        ocrRunningRef.current = false
        return
      }
      applyText(clean, docName)
      setStatus("Ready — press play")
      showToast("OCR complete — ready to read.")
    } catch (e) {
      console.error(e)
      setLoading(IDLE_LOADING)
      showToast("OCR couldn't run in this environment. Try opening the file in a regular browser tab.")
    }
    ocrRunningRef.current = false
  }, [applyText, docName, showToast, stopReadingInternal])

  const ocrCancelRef = useRef<() => void>(() => {})

  // ---- download as audio ----
  const canDownload = useMemo(() => {
    const cloud = engine === "openai" || engine === "eleven"
    const hasKey = engine === "openai" ? !!cfg.openaiKey : engine === "eleven" ? !!cfg.elKey : false
    return cloud && hasKey && chunks.length > 0 && !downloading
  }, [engine, cfg.openaiKey, cfg.elKey, chunks.length, downloading])

  const downloadNote = useMemo(() => {
    const cloud = engine === "openai" || engine === "eleven"
    const hasKey = engine === "openai" ? !!cfg.openaiKey : engine === "eleven" ? !!cfg.elKey : false
    if (!cloud)
      return "Audio download needs a cloud voice (OpenAI or ElevenLabs) — browser voices can't be saved to a file."
    if (!hasKey) return "Add your API key above to enable download."
    return "Generates the whole document with the selected cloud voice and saves one .mp3. Uses that provider's credits."
  }, [engine, cfg.openaiKey, cfg.elKey])

  const downloadAudio = useCallback(async () => {
    if (downloading) {
      downloadAbortRef.current = true
      return
    }
    if (engineRef.current !== "openai" && engineRef.current !== "eleven") return
    setDownloading(true)
    downloadAbortRef.current = false
    setLoading({
      active: true,
      message: "Preparing audio — 0%",
      showBar: true,
      barPct: 0,
      cancellable: true,
    })
    ocrCancelRef.current = () => {
      downloadAbortRef.current = true
    }
    const parts: Blob[] = []
    const list = chunksRef.current
    try {
      for (let i = 0; i < list.length; i++) {
        if (downloadAbortRef.current) break
        setLoading((l) => ({
          ...l,
          message: `Generating audio — ${Math.round((i / list.length) * 100)}%  (${i}/${list.length})`,
          barPct: Math.round((i / list.length) * 100),
        }))
        parts.push(await getAudio(i))
      }
      setLoading(IDLE_LOADING)
      if (downloadAbortRef.current) {
        showToast("Export cancelled.")
      } else {
        const blob = new Blob(parts, { type: "audio/mpeg" })
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = `${docName}.mp3`
        document.body.appendChild(a)
        a.click()
        a.remove()
        showToast("Saved — check your downloads.")
      }
    } catch (e) {
      setLoading(IDLE_LOADING)
      showToast((e as Error)?.message || "Export failed.")
    }
    setDownloading(false)
    downloadAbortRef.current = false
  }, [downloading, docName, getAudio, showToast])

  const cancelLoading = useCallback(() => {
    ocrCancelRef.current?.()
  }, [])

  // ---- engine switching ----
  const switchEngine = useCallback(
    (e: Engine) => {
      setEngine(e)
      engineRef.current = e
      stopReadingInternal()
      clearCache()
      setStatus(chunksRef.current.length ? "Ready — press play" : "Ready")
    },
    [clearCache, stopReadingInternal],
  )

  // ---- config setters ----
  const setOpenAIKey = useCallback((v: string) => setCfg((c) => ({ ...c, openaiKey: v.trim() })), [])
  const setOpenAIVoice = useCallback((v: string) => {
    setCfg((c) => ({ ...c, openaiVoice: v }))
    clearCache()
  }, [clearCache])
  const setOpenAIModel = useCallback((v: string) => {
    setCfg((c) => ({ ...c, openaiModel: v }))
    clearCache()
  }, [clearCache])
  const setElKey = useCallback((v: string) => setCfg((c) => ({ ...c, elKey: v.trim() })), [])
  const setElVoice = useCallback((v: string) => {
    setCfg((c) => ({ ...c, elVoice: v }))
    clearCache()
  }, [clearCache])
  const setElModel = useCallback((v: string) => {
    setCfg((c) => ({ ...c, elModel: v }))
    clearCache()
  }, [clearCache])

  const loadMyElevenVoices = useCallback(async () => {
    if (!cfgRef.current.elKey) {
      showToast("Enter your ElevenLabs API key first.")
      return
    }
    try {
      const vs = await loadElevenVoices(cfgRef.current.elKey)
      if (vs.length) {
        setElVoices(vs)
        setCfg((c) => ({ ...c, elVoice: vs[0].voice_id }))
        showToast(`Loaded ${vs.length} voice${vs.length > 1 ? "s" : ""}.`)
      } else {
        showToast("No voices found on that account.")
      }
    } catch (e) {
      showToast((e as Error)?.message || "Couldn't load voices.")
    }
  }, [showToast])

  // dock voice selection
  const selectDockVoice = useCallback(
    (value: string) => {
      if (engineRef.current === "device") {
        setSelectedDeviceVoice(value)
        selectedVoiceRef.current = value
      } else if (engineRef.current === "openai") {
        setCfg((c) => ({ ...c, openaiVoice: value }))
        clearCache()
      } else {
        setCfg((c) => ({ ...c, elVoice: value }))
        clearCache()
      }
      setPlaying((p) => {
        setPaused((pd) => {
          if (p && !pd) play()
          return pd
        })
        return p
      })
    },
    [clearCache, play],
  )

  // ---- derived progress ----
  const progressPct = chunks.length ? (idx / chunks.length) * 100 : 0
  const timeLabel = useMemo(() => {
    if (!chunks.length || idx >= chunks.length) return ""
    const wordsLeft = chunks.slice(idx).reduce((n, c) => n + c.text.split(/\s+/).length, 0)
    const wpm = 155 * rate
    const mins = wordsLeft / wpm
    return mins >= 1 ? `~${Math.round(mins)} min left` : "<1 min left"
  }, [chunks, idx, rate])

  // Chrome truncates long device speech; nudge it along.
  useEffect(() => {
    const t = setInterval(() => {
      const s = synth()
      if (engineRef.current === "device" && playing && !paused && s?.speaking) {
        s.pause()
        s.resume()
      }
    }, 9000)
    return () => clearInterval(t)
  }, [playing, paused])

  // cleanup on unmount
  useEffect(() => {
    return () => {
      synth()?.cancel()
      try {
        audioRef.current?.pause()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return {
    // refs to attach
    audioRef,
    // state
    chunks,
    idx,
    playing,
    paused,
    engine,
    rate,
    docName,
    totalWords,
    status,
    hasDoc,
    ocrBannerVisible,
    downloading,
    loading,
    toast,
    cfg,
    elVoices,
    dockVoices,
    dockVoiceValue,
    reduceMotion,
    canDownload,
    downloadNote,
    progressPct,
    timeLabel,
    // actions
    loadPDF,
    togglePlay,
    next,
    prev,
    jumpTo,
    seekToFraction,
    changeRate,
    commitRate,
    selectDockVoice,
    switchEngine,
    runOCR,
    downloadAudio,
    cancelLoading,
    setOpenAIKey,
    setOpenAIVoice,
    setOpenAIModel,
    setElKey,
    setElVoice,
    setElModel,
    loadMyElevenVoices,
    showToast,
    goHome,
    library,
    isPro,
    openLibraryEntry,
    removeLibraryEntry,
    setIsPro,
  }
}
