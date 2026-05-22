'use client'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <section className="page admin-login-page">
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        <p className="sec-label">Something went wrong</p>
        <h1 className="contact-heading">
          Please try <em>again</em>
        </h1>
        <p className="contact-sub" style={{ maxWidth: 'none', margin: '0 auto 28px' }}>
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <button type="button" className="btn-glass" onClick={reset}>
          Retry
        </button>
      </div>
    </section>
  )
}
