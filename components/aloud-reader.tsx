"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAloud } from "@/lib/use-aloud"
import { BookIcon, GearIcon, PlusIcon, SunIcon, MoonIcon } from "./icons"
import { WelcomeDrop } from "./welcome-drop"
import { ReaderView } from "./reader-view"
import { TransportDock } from "./transport-dock"
import { SettingsPanel } from "./settings-panel"
import { LoadingOverlay } from "./loading-overlay"
import { LibraryPanel } from "./library-panel"
import { UpgradeModal } from "./upgrade-modal"

export function AloudReader() {
  const a = useAloud()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const pickFile = useCallback(() => fileInputRef.current?.click(), [])

  // Global drop handling once a document is loaded.
  useEffect(() => {
    const onDragOver = (e: DragEvent) => e.preventDefault()
    const onDrop = (e: DragEvent) => {
      if (!a.hasDoc) return
      e.preventDefault()
      const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.type === "application/pdf")
      if (files.length) a.loadPDFs(files)
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
        <div className="mark" aria-hidden="true" onClick={a.goHome} style={{ cursor: "pointer" }} />
        <div className="brand" onClick={a.goHome} style={{ cursor: "pointer" }}>
          <h1>Aloud</h1>
          <p>Your PDFs, read out loud</p>
        </div>
        <div className="top-actions">
                    <button
                                  className="ghost-btn icon-btn"
                                  onClick={a.toggleTheme}
                                  aria-label={a.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                                >
                      {a.theme === "dark" ? <SunIcon /> : <MoonIcon />}
                              </button>
          <button className="ghost-btn" onClick={() => setLibraryOpen(true)}>
            <BookIcon />
            Library
          </button>
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
            fontScale={a.fontScale}
            dyslexiaFont={a.dyslexiaFont}
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
          isPro={a.isPro}
          fontScale={a.fontScale}
          dyslexiaFont={a.dyslexiaFont}
        onUpgrade={() => setUpgradeOpen(true)}
          onFontScale={a.setFontScale}
          onDyslexiaFont={a.setDyslexiaFont}
        />

        
        <LibraryPanel
          open={libraryOpen}
          isPro={a.isPro}
          library={a.library}
          onClose={() => setLibraryOpen(false)}
          onOpen={(id) => {
            a.openLibraryEntry(id)
            setLibraryOpen(false)
          }}
          onRemove={a.removeLibraryEntry}
            membership={a.membership}
            onCancelMembership={a.cancelMembership}
        onUpgrade={() => setUpgradeOpen(true)}
        />
                <UpgradeModal
                            open={upgradeOpen}
                            onClose={() => setUpgradeOpen(false)}
                            onPick={(plan) => {
                                          setUpgradeOpen(false)
                                          a.startCheckout(plan)
                            }}
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
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          if (files.length) a.loadPDFs(files)
          e.target.value = ""
        }}
      />
      <audio ref={a.audioRef} hidden />
    </>
  )
}
