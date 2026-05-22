'use client'

export function PrintButton() {
  return (
    <button
      type="button"
      className="resume-print-btn"
      onClick={() => window.print()}
    >
      <span>Print / Save as PDF</span>
      <span aria-hidden="true">→</span>
    </button>
  )
}
