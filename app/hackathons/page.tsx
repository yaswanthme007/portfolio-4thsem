import type { Metadata } from 'next'
import { getHackathons } from '@/lib/hackathons'
import { ChapterRail } from '@/components/ChapterRail'
import { HackathonParallax } from '@/components/HackathonParallax'

export const metadata: Metadata = {
  title: 'Hackathons — Yaswanth',
  description: 'A scroll through the hackathons Yaswanth K B has shipped in.',
}

export default async function HackathonsPage() {
  const hackathons = await getHackathons()

  return (
    <section className="page hackathons-page">
      <header className="hackathons-hero">
        <h1 className="hackathons-hero-title">
          Hackathons <em>&amp; sprints</em>
        </h1>
        <p className="hackathons-hero-lede">
          Scroll through what got built under a countdown clock — the idea,
          the build, and what shipped by the deadline.
        </p>
      </header>

      {hackathons.length > 0 && (
        <ChapterRail
          chapters={hackathons.map(h => ({ id: h.slug, num: h.index, label: h.title }))}
        />
      )}

      <div className="hackathon-chapters">
        {hackathons.length === 0 && (
          <p className="admin-empty">No hackathons posted yet — check back soon.</p>
        )}
        {hackathons.map(h => (
          <section key={h.id} id={h.slug} className="hackathon-chapter home-section">
            <div className="hackathon-gallery">
              {h.images.map((img, i) => (
                <img
                  key={img.url + i}
                  src={img.url}
                  alt={img.name ?? h.title}
                  className="hackathon-image"
                />
              ))}
            </div>
            <div className="hackathon-copy">
              <p className="hackathon-eyebrow">{h.year} · №&nbsp;{h.index}</p>
              <h2 className="hackathon-title">{h.title}</h2>
              <p className="hackathon-desc">{h.description}</p>
              <div className="hackathon-tags">
                {h.tags.map(t => <span key={t} className="project-tag">{t}</span>)}
              </div>
              {(h.repoUrl || h.liveUrl) && (
                <div className="hackathon-links">
                  {h.repoUrl && (
                    <a href={h.repoUrl} target="_blank" rel="noreferrer" className="project-link">
                      GitHub →
                    </a>
                  )}
                  {h.liveUrl && (
                    <a href={h.liveUrl} target="_blank" rel="noreferrer" className="project-link">
                      Live →
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <HackathonParallax />
    </section>
  )
}
