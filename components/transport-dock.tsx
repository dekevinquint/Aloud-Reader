"use client"

import { NextIcon, PauseIcon, PlayIcon, PrevIcon } from "./icons"

export function TransportDock({
  playing,
  paused,
  canPlay,
  status,
  timeLabel,
  progressPct,
  rate,
  voices,
  voiceValue,
  onToggle,
  onPrev,
  onNext,
  onSeek,
  onRateInput,
  onRateCommit,
  onVoiceChange,
}: {
  playing: boolean
  paused: boolean
  canPlay: boolean
  status: string
  timeLabel: string
  progressPct: number
  rate: number
  voices: { value: string; label: string }[]
  voiceValue: string
  onToggle: () => void
  onPrev: () => void
  onNext: () => void
  onSeek: (fraction: number) => void
  onRateInput: (value: number) => void
  onRateCommit: () => void
  onVoiceChange: (value: string) => void
}) {
  const showPause = playing && !paused

  return (
    <div className="dock">
      <div className="transport">
        <button className="tbtn" title="Previous line" aria-label="Previous line" onClick={onPrev}>
          <PrevIcon />
        </button>
        <button
          className="tbtn play-main"
          title={showPause ? "Pause" : "Play"}
          aria-label={showPause ? "Pause" : "Play"}
          disabled={!canPlay}
          onClick={onToggle}
        >
          {showPause ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button className="tbtn" title="Next line" aria-label="Next line" onClick={onNext}>
          <NextIcon />
        </button>
      </div>

      <div className="progress-area">
        <div className="progress-top">
          <span className="now">{status}</span>
          <span>{timeLabel}</span>
        </div>
        <div
          className="track"
          title="Jump to a position"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            const pct = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
            onSeek(pct)
          }}
        >
          <div className="fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="settings">
        <div className="ctrl voice-ctrl">
          <label htmlFor="voiceSel">Voice</label>
          <select
            id="voiceSel"
            value={voiceValue}
            onChange={(e) => onVoiceChange(e.target.value)}
          >
            {voices.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div className="ctrl">
          <label htmlFor="rate">Speed</label>
          <input
            type="range"
            id="rate"
            min={0.6}
            max={1.8}
            step={0.05}
            value={rate}
            onChange={(e) => onRateInput(parseFloat(e.target.value))}
            onMouseUp={onRateCommit}
            onTouchEnd={onRateCommit}
            onKeyUp={onRateCommit}
          />
          <span className="rate-val">{rate.toFixed(1)}×</span>
        </div>
      </div>
    </div>
  )
}
