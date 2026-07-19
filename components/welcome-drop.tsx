"use client"

import { useState } from "react"
import { DownloadIcon } from "./icons"

export function WelcomeDrop({
  onPick,
  onFile,
}: {
  onPick: () => void
  onFile: (file: File) => void
}) {
  const [hot, setHot] = useState(false)

  return (
    <div className="welcome">
      <div
        className={`drop${hot ? " hot" : ""}`}
        onDragEnter={(e) => {
          e.preventDefault()
          setHot(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault()
          if (e.currentTarget.contains(e.relatedTarget as Node)) return
          setHot(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setHot(false)
          const f = e.dataTransfer.files[0]
          if (f && f.type === "application/pdf") onFile(f)
        }}
      >
        <div className="big">Drop a PDF here to hear it</div>
        <p className="sub">
          Aloud pulls the text out of your document and reads it aloud, highlighting each line as it
          goes. It works with your device&apos;s built-in voices, or you can plug in a cloud voice for
          studio quality and downloadable audio.
        </p>
        <button className="cta" onClick={onPick}>
          <DownloadIcon width={18} height={18} style={{ fill: "currentColor" }} />
          Choose a PDF
        </button>
        <div className="fineprint">
          Text-based or scanned PDFs (built-in OCR) · nothing is uploaded to Aloud
        </div>
      </div>
    </div>
  )
}
