"use client"

import { useState } from "react"
import type { CloudConfig, ElevenVoice, Engine } from "@/lib/tts"
import { OPENAI_VOICES } from "@/lib/tts"
import { CloseIcon, DownloadIcon, LockIcon } from "./icons"

export function SettingsPanel({
  open,
  engine,
  cfg,
  elVoices,
  canDownload,
  downloading,
  downloadNote,
  isPro,
  fontScale,
  dyslexiaFont,
  onClose,
  onSwitchEngine,
  onOpenAIKey,
  onOpenAIVoice,
  onOpenAIModel,
  onElKey,
  onElVoice,
  onElModel,
  onLoadElVoices,
  onRunOCR,
  onDownload,
  onUpgrade,
  onFontScale,
  onDyslexiaFont,
}: {
  open: boolean
  engine: Engine
  cfg: CloudConfig
  elVoices: ElevenVoice[]
  canDownload: boolean
  downloading: boolean
  downloadNote: string
  isPro: boolean
  fontScale: number
  dyslexiaFont: boolean
  onClose: () => void
  onSwitchEngine: (e: Engine) => void
  onOpenAIKey: (v: string) => void
  onOpenAIVoice: (v: string) => void
  onOpenAIModel: (v: string) => void
  onElKey: (v: string) => void
  onElVoice: (v: string) => void
  onElModel: (v: string) => void
  onUpgrade: () => void
  onFontScale: (v: number) => void
  onDyslexiaFont: (v: boolean) => void
  onLoadElVoices: () => Promise<void>
  onRunOCR: () => void
  onDownload: () => void
}) {
  const [loadingVoices, setLoadingVoices] = useState(false)

  return (
    <>
      <div className={`scrim${open ? " open" : ""}`} onClick={onClose} />
      <aside className={`panel${open ? " open" : ""}`} aria-label="Voice and settings" aria-hidden={!open}>
        <div className="panel-head">
          <h2>Voice &amp; settings</h2>
          <button className="panel-close" aria-label="Close" onClick={onClose}>
            <CloseIcon width={20} height={20} style={{ fill: "currentColor" }} />
          </button>
        </div>
        <div className="panel-body">
          <div className="grp">
            <div className="grp-title">Voice engine</div>
            <div className="seg">
              {(["device", "openai", "eleven"] as Engine[]).map((e) => {
                const locked = e !== "device" && !isPro
                return (
                  <button
                    key={e}
                    className={engine === e ? "on" : ""}
                    onClick={() => (locked ? onUpgrade() : onSwitchEngine(e))}
                  >
                    {e === "device" ? "Device" : e === "openai" ? "OpenAI" : "ElevenLabs"}
                    {locked && <LockIcon width={11} height={11} style={{ fill: "currentColor", marginLeft: 4 }} />}
                  </button>
                )
              })}
            </div>
          </div>

          {engine === "openai" && (
            <div className="grp">
              <div className="field">
                <label htmlFor="openaiKey">OpenAI API key</label>
                <input
                  type="password"
                  id="openaiKey"
                  placeholder="sk-..."
                  autoComplete="off"
                  value={cfg.openaiKey}
                  onChange={(e) => onOpenAIKey(e.target.value)}
                />
                <div className="hint">
                  Kept in this tab only, sent straight to OpenAI. Get one at{" "}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
                    platform.openai.com
                  </a>
                  .
                </div>
              </div>
              <div className="field">
                <label htmlFor="openaiVoice">Voice</label>
                <select id="openaiVoice" value={cfg.openaiVoice} onChange={(e) => onOpenAIVoice(e.target.value)}>
                  {OPENAI_VOICES.map((v) => (
                    <option key={v} value={v}>
                      {v[0].toUpperCase() + v.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="openaiModel">Model</label>
                <select id="openaiModel" value={cfg.openaiModel} onChange={(e) => onOpenAIModel(e.target.value)}>
                  <option value="gpt-4o-mini-tts">gpt-4o-mini-tts (natural)</option>
                  <option value="tts-1-hd">tts-1-hd (higher fidelity)</option>
                  <option value="tts-1">tts-1 (fastest)</option>
                </select>
              </div>
            </div>
          )}

          {engine === "eleven" && (
            <div className="grp">
              <div className="field">
                <label htmlFor="elKey">ElevenLabs API key</label>
                <input
                  type="password"
                  id="elKey"
                  placeholder="sk_..."
                  autoComplete="off"
                  value={cfg.elKey}
                  onChange={(e) => onElKey(e.target.value)}
                />
                <div className="hint">
                  Kept in this tab only, sent straight to ElevenLabs. Get one at{" "}
                  <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noreferrer">
                    elevenlabs.io
                  </a>
                  .
                </div>
              </div>
              <div className="field">
                <label htmlFor="elVoice">Voice</label>
                <select id="elVoice" value={cfg.elVoice} onChange={(e) => onElVoice(e.target.value)}>
                  {elVoices.map((v) => (
                    <option key={v.voice_id} value={v.voice_id}>
                      {v.name}
                      {v.labels?.accent ? " · " + v.labels.accent : ""}
                    </option>
                  ))}
                </select>
                <div className="rowbtn">
                  <button
                    className="mini-btn"
                    disabled={loadingVoices}
                    onClick={async () => {
                      setLoadingVoices(true)
                      await onLoadElVoices()
                      setLoadingVoices(false)
                    }}
                  >
                    {loadingVoices ? "Loading…" : "Load my voices"}
                  </button>
                </div>
              </div>
              <div className="field">
                <label htmlFor="elModel">Model</label>
                <select id="elModel" value={cfg.elModel} onChange={(e) => onElModel(e.target.value)}>
                  <option value="eleven_multilingual_v2">Multilingual v2 (quality)</option>
                  <option value="eleven_flash_v2_5">Flash v2.5 (fast)</option>
                </select>
              </div>
            </div>
          )}

          <div className="grp">
            <div className="grp-title">Scanned documents</div>
            {isPro ? (
              <>
                <button
                  className="mini-btn"
                  onClick={() => {
                    onClose()
                    onRunOCR()
                  }}
                >
                  Read this PDF with OCR
                </button>
                <div className="hint" style={{ fontSize: "11.5px", color: "var(--on-dark-soft)" }}>
                  Turns page images into readable text. Useful when a PDF has no selectable text.
                </div>
              </>
            ) : (
              <button className="mini-btn locked" onClick={onUpgrade}>
                <LockIcon width={13} height={13} style={{ fill: "currentColor" }} />
                OCR for scanned PDFs — Pro
              </button>
            )}
          </div>

          <div className="grp">
            <div className="grp-title">Export</div>
            {isPro ? (
              <>
                <button className="dl-btn" disabled={!canDownload && !downloading} onClick={onDownload}>
                  {downloading ? (
                    "Cancel export"
                  ) : (
                    <>
                      <DownloadIcon style={{ fill: "currentColor" }} />
                      Download as audio (.mp3)
                    </>
                  )}
                </button>
                <div className="note">{downloadNote}</div>
              </>
            ) : (
              <button className="dl-btn locked" onClick={onUpgrade}>
                <LockIcon width={13} height={13} style={{ fill: "currentColor" }} />
                Download as audio — Pro
              </button>
            )}
          </div>

          <div className="grp">
            <div className="grp-title">Focus mode</div>
            {isPro ? (
              <>
                <div className="seg focus-seg">
                  <button onClick={() => onFontScale(fontScale - 0.1)}>A-</button>
                  <button onClick={() => onFontScale(1)}>Reset</button>
                  <button onClick={() => onFontScale(fontScale + 0.1)}>A+</button>
                </div>
                <label className="check-row">
                  <input type="checkbox" checked={dyslexiaFont} onChange={(e) => onDyslexiaFont(e.target.checked)} />
                  Dyslexia-friendly font
                </label>
              </>
            ) : (
              <button className="mini-btn locked" onClick={onUpgrade}>
                <LockIcon width={13} height={13} style={{ fill: "currentColor" }} />
                Text size and dyslexia-friendly font — Pro
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
