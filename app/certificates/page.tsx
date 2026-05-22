import type { Metadata } from 'next'
import { getPortfolioData } from '@/lib/portfolio'

export const metadata: Metadata = {
  title: 'Certificates — Yaswanth',
  description: 'Certifications and credentials of Yaswanth K B.',
}

export default async function CertificatesPage() {
  const { certificates } = await getPortfolioData()

  return (
    <section className="page certs-page">

      <header className="certs-hero">
        <p className="certs-hero-eyebrow">
          <span className="certs-hero-mark" aria-hidden="true">§</span>
          Credentials
        </p>
        <h1 className="certs-hero-title">Proof of practice</h1>
        <p className="certs-hero-lede">
          Certifications and course completions, most recent first. New uploads
          appear here automatically.
        </p>
      </header>

      {certificates.length > 0 ? (
        <ol className="certs-list">
          {certificates.map((cert, i) => (
            <li key={cert.id} className="certs-row">
              <span className="certs-row-num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="certs-row-body">
                <div className="certs-row-head">
                  <h2 className="certs-row-title">{cert.title}</h2>
                  <span className="certs-row-year">{cert.year}</span>
                </div>
                <p className="certs-row-issuer">{cert.issuer}</p>
                {cert.description && (
                  <p className="certs-row-desc">{cert.description}</p>
                )}
              </div>
              {cert.fileUrl && (
                <a
                  href={`/api/certificates/${cert.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="certs-row-link"
                  aria-label={`Open ${cert.title}`}
                >
                  Open <span aria-hidden="true">↗</span>
                </a>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="certs-empty">
          No certificates uploaded yet &mdash; they&rsquo;ll appear here once added
          from the admin dashboard.
        </p>
      )}
    </section>
  )
}
