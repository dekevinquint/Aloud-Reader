"use client"

import { CloseIcon } from "./icons"

type Plan = "onetime" | "membership"

export function UpgradeModal({
    open,
    onClose,
    onPick,
}: {
    open: boolean
    onClose: () => void
    onPick: (plan: Plan) => void
}) {
    if (!open) return null

  return (
        <div className="scrim open" onClick={onClose}>
                <div className="upgrade-card" onClick={(e) => e.stopPropagation()}>
                          <button className="panel-close" aria-label="Close" onClick={onClose}>
                                      <CloseIcon width={18} height={18} style={{ fill: "currentColor" }} />
                          </button>
                          <h2>Go Pro</h2>
                        <p className="upgrade-sub">Unlock studio voices, unlimited library, OCR, and MP3 downloads.</p>
                        <button className="upgrade-option" onClick={() => onPick("onetime")}>
                                  <span className="upgrade-price">€9</span>
                                  <span className="upgrade-label">One-time, lifetime access — iDEAL or card</span>
                        </button>
                        <button className="upgrade-option" onClick={() => onPick("membership")}>
                                  <span className="upgrade-price">€5/mo</span>
                                  <span className="upgrade-label">Membership, cancel anytime — card or SEPA</span>
                        </button>
                </div>
        </div>
      )
}</h2>
