"use client"

import { useEffect, useRef } from "react"
import type { Chunk } from "@/lib/text"

export function ReaderView({
  chunks,
  activeIdx,
  docName,
  totalWords,
  ocrBannerVisible,
  reduceMotion,
  onSentenceClick,
  onRunOCR,
}: {
  chunks: Chunk[]
  activeIdx: number
  docName: string
  totalWords: number
  ocrBannerVisible: boolean
  reduceMotion: boolean
  onSentenceClick: (i: number) => void
  onRunOCR: () => void
}) {
  const activeRef = useRef<HTMLSpanElement | null>(null)

  // Keep the active sentence in view as playback advances.
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    })
  }, [activeIdx, reduceMotion])

  return (
    <div className="reader-wrap">
      <div className="col">
        {ocrBannerVisible && (
          <div className="banner">
            <div className="b-text">
              <b>Not much text here.</b> This looks like a scanned document. Run OCR to read the words
              off the page images.
            </div>
            <button className="b-btn" onClick={onRunOCR}>
              Run OCR
            </button>
          </div>
        )}
        <article className="page">
          <div className="doc-title">
            <span>{docName}</span>
            <span>{totalWords ? `${totalWords.toLocaleString()} words` : ""}</span>
          </div>
          <div>
            {chunks.map((c, i) => (
              <span
                key={i}
                ref={i === activeIdx ? activeRef : null}
                className={`sentence${c.para ? " para" : ""}${i === activeIdx ? " active" : ""}`}
                onClick={() => onSentenceClick(i)}
              >
                {c.text + " "}
              </span>
            ))}
          </div>
        </article>
      </div>
    </div>
  )
}
