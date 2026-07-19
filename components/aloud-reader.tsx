"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAloud } from "@/lib/use-aloud"
import { GearIcon, PlusIcon } from "./icons"
import { WelcomeDrop } from "./welcome-drop"
import { ReaderView } from "./reader-view"
import { TransportDock } from "./transport-dock"
import { SettingsPanel } from "./settings-panel"
import { LoadingOverlay } from "./loading-overlay"

export function AloudReader() {
  const a = useAloud()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const pickFile = useCallback(() => fileInputRef.current?.click(), [])

  // Global drop handling once a document is loaded.
  useEffect(() => {
    const onDragOver = (e: DragEvent) => e.preventDefault()
    const onDrop = (e: DragEvent) => {
      if (!a.hasDoc) return
      e.preventDefault()
      const f = e.dataTransfer?.files[0]
      if (f && f.type === "application/pdf") a.loadPDF(f)
    }
    document.addEventListener("dragover", onDragOver)
    document.addEventListener("drop", onDrop)
    return () => {
      document.removeEventListener("dragover", onDragOver)
      document.removeEventListener("drop", onDrop)
    }
  }, [a])

  // Keyboard shortcuts (space / arrows) while reading.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!a.hasDoc || panelOpen) return
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === "select" || tag === "input" || tag === "textarea") return
      if (e.code === "Space") {
        e.preventDefault()
        a.togglePlay()
      } else if (e.code === "ArrowRight") {
        e.preventDefault()
        a.next(a.playing)
      } else if (e.code === "ArrowLeft") {
        e.preventDefault()
        a.prev(a.playing)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [a, panelOpen])

  const canPlay = a.chunks.length > 0

  return (
    <>
      <header>
        <div className="mark" aria-hidden="true" />
        <div className="brand">
          <h1>Aloud</h1>
          <p>Your PDFs, read out loud</p>
        </div>
        <div className="top-actions">
          {a.hasDoc && (
            <>
              <button className="ghost-btn" onClick={pickFile}>
                <PlusIcon />
                Open another PDF
              </button>
              <button className="ghost-btn" onClick={() => setPanelOpen(true)}>
                <GearIcon />
                Voice &amp; settings
              </button>
            </>
          )}
        </div>
      </header>

      <main>
        {!a.hasDoc && <WelcomeDrop onPick={pickFile} onFile={a.loadPDF} />}

        {a.hasDoc && (
          <ReaderView
            chunks={a.chunks}
            activeIdx={a.idx}
            docName={a.docName}
            totalWords={a.totalWords}
            ocrBannerVisible={a.ocrBannerVisible}
            reduceMotion={a.reduceMotion.current}
            onSentenceClick={(i) => a.jumpTo(i, a.playing)}
            onRunOCR={a.runOCR}
          />
        )}

        <LoadingOverlay loading={a.loading} onCancel={a.cancelLoading} />

        <div className={`toast${a.toast ? " show" : ""}`}>{a.toast}</div>

        <SettingsPanel
          open={panelOpen}
          engine={a.engine}
          cfg={a.cfg}
          elVoices={a.elVoices}
          canDownload={a.canDownload}
          downloading={a.downloading}
          downloadNote={a.downloadNote}
          onClose={() => setPanelOpen(false)}
          onSwitchEngine={a.switchEngine}
          onOpenAIKey={a.setOpenAIKey}
          onOpenAIVoice={a.setOpenAIVoice}
          onOpenAIModel={a.setOpenAIModel}
          onElKey={a.setElKey}
          onElVoice={a.setElVoice}
          onElModel={a.setElModel}
          onLoadElVoices={a.loadMyElevenVoices}
          onRunOCR={a.runOCR}
          onDownload={a.downloadAudio}
        />

        {a.hasDoc && (
          <TransportDock
            playing={a.playing}
            paused={a.paused}
            canPlay={canPlay}
            status={a.status}
            timeLabel={a.timeLabel}
            progressPct={a.progressPct}
            rate={a.rate}
            voices={a.dockVoices}
            voiceValue={a.dockVoiceValue}
            onToggle={a.togglePlay}
            onPrev={() => a.prev(a.playing)}
            onNext={() => a.next(a.playing)}
            onSeek={(f) => a.seekToFraction(f, a.playing)}
            onRateInput={a.changeRate}
            onRateCommit={a.commitRate}
            onVoiceChange={a.selectDockVoice}
          />
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) a.loadPDF(f)
          e.target.value = ""
        }}
      />
      <audio ref={a.audioRef} hidden />
    </>
  )
}
