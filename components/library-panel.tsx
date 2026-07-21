"use client"

import type { LibraryEntry } from "@/lib/use-aloud"
import { BookIcon, CloseIcon, LockIcon } from "./icons"

export function LibraryPanel({
  open,
  isPro,
  library,
  onClose,
  onOpen,
  onRemove,
  onUpgrade,
}: {
  open: boolean
  isPro: boolean
  library: LibraryEntry[]
  onClose: () => void
  onOpen: (id: string) => void
  onRemove: (id: string) => void
  onUpgrade: () => void
}) {
  return (
    <>
      <div className={`scrim${open ? " open" : ""}`} onClick={onClose} />
      <aside className={`panel${open ? " open" : ""}`} aria-label="Library" aria-hidden={!open}>
        <div className="panel-head">
          <h2>Library</h2>
          <button className="panel-close" aria-label="Close" onClick={onClose}>
            <CloseIcon width={20} height={20} style={{ fill: "currentColor" }} />
          </button>
        </div>
        <div className="panel-body">
          {!isPro ? (
            <div className="lib-locked">
              <LockIcon width={28} height={28} style={{ fill: "var(--gold)" }} />
              <h3>Library is a Pro feature</h3>
              <p>
                Upgrade to Pro to keep every PDF you've opened saved here, so you can jump back in and pick up
                exactly where you left off.
              </p>
              <button className="btn-upgrade" onClick={onUpgrade}>
                Upgrade to Pro
              </button>
              <p className="lib-note">
                Demo build: no payment is wired up yet. This screen is a placeholder for a real checkout flow.
              </p>
            </div>
          ) : library.length === 0 ? (
            <div className="lib-empty">
              <BookIcon width={26} height={26} style={{ fill: "var(--on-dark-soft)" }} />
              <p>Documents you open will appear here.</p>
            </div>
          ) : (
            <div className="lib-list">
              {library.map((entry) => {
                const date = new Date(entry.updatedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
                return (
                  <div className="lib-item" key={entry.id}>
                    <button className="lib-item-main" onClick={() => onOpen(entry.id)}>
                      <BookIcon width={18} height={18} style={{ fill: "var(--gold)" }} />
                      <span className="lib-item-info">
                        <span className="lib-item-name">{entry.name}</span>
                        <span className="lib-item-meta">
                          {entry.wordCount.toLocaleString()} words · {date}
                        </span>
                      </span>
                    </button>
                    <button className="lib-item-remove" aria-label={`Remove ${entry.name}`} onClick={() => onRemove(entry.id)}>
                      <CloseIcon width={14} height={14} style={{ fill: "currentColor" }} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
