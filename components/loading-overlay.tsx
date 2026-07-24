"use client"

import type { LoadingState } from "@/lib/use-aloud"

export function LoadingOverlay({
  loading,
  onCancel,
}: {
  loading: LoadingState
  onCancel: () => void
}) {
  if (!loading.active) return null
  return (
    <div className="loading">
      <div className="spinner" />
      <p>{loading.message}</p>
      {loading.showBar && (
        <div className="bar">
          <i style={{ width: `${loading.barPct}%` }} />
        </div>
      )}
      {loading.cancellable && (
        <button className="cancel" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  )
}
