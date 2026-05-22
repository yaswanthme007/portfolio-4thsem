import { notFound }      from 'next/navigation'
import type { Metadata }  from 'next'
import { getProjects, getProjectBySlug } from '@/lib/projects'
import { LiquidGlass }    from '@/components/LiquidGlass'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const projects = await getProjects()
  return projects.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await getProjectBySlug(slug)
  return { title: p ? `${p.title} — Yaswanth` : 'Not Found' }
}

export default async function ProjectDetail({ params }: Props) {
  const { slug } = await params
  const p = await getProjectBySlug(slug)
  if (!p) notFound()

  return (
    <section className="page">
      <div className="project-detail-header">
        <p className="sec-label">{p.index} · {p.year}</p>
        <h1 className="sec-heading" style={{ marginBottom: 24 }}>{p.title}</h1>
        <p className="hero-bio" style={{ maxWidth: 620 }}>{p.description}</p>
        <div className="project-tags" style={{ marginTop: 28 }}>
          {p.tags.map(t => <span key={t} className="project-tag">{t}</span>)}
        </div>

        {(p.repoUrl || p.liveUrl) && (
          <div className="project-detail-links">
            {p.repoUrl && (
              <a href={p.repoUrl} target="_blank" rel="noreferrer" className="btn-ghost">
                View on GitHub
              </a>
            )}
            {p.liveUrl && (
              <a href={p.liveUrl} target="_blank" rel="noreferrer" className="btn-glass">
                View Live Site ↗
              </a>
            )}
          </div>
        )}
      </div>

      {p.features.length > 0 && (
        <>
          <p className="sec-label" style={{ marginBottom: 18 }}>Highlights</p>
          <div className="feature-grid">
            {p.features.map((f, i) => (
              <LiquidGlass
                key={f.title}
                className="feature-card fade-in"
                style={{ animationDelay: `${i * 0.08}s` } as React.CSSProperties}
                interactive
              >
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.description}</div>
              </LiquidGlass>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
