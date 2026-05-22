'use client'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(180deg, #0e0608 0%, #1a0a0c 48%, #0c0506 100%)',
        color: 'rgba(241, 227, 201, 0.9)',
        fontFamily: 'system-ui, sans-serif',
        padding: '24px',
      }}>
        <main style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
          <p style={{ letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: 11, color: '#c97a82' }}>
            Application error
          </p>
          <h1 style={{ fontSize: 'clamp(40px, 7vw, 64px)', lineHeight: 1, margin: '14px 0 20px', fontFamily: 'Cormorant Garamond, serif', fontWeight: 400 }}>
            Something broke
          </h1>
          <p style={{ lineHeight: 1.8, color: 'rgba(241, 227, 201, 0.6)', marginBottom: 28 }}>
            {error.message || 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: '1px solid rgba(241, 227, 201, 0.18)',
              borderRadius: 999,
              padding: '12px 28px',
              background: 'rgba(201, 122, 130, 0.18)',
              color: '#fbf3df',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 14,
              letterSpacing: '0.04em',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
