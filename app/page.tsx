import Link from 'next/link'
import { LiquidGlass }       from '@/components/LiquidGlass'
import { GitHubHeatmap }     from '@/components/GitHubHeatmap'
import { RepoStars }         from '@/components/RepoStars'
import { RecentActivity }    from '@/components/RecentActivity'
import { getGitHubCalendar, getRecentActivity } from '@/lib/github'
import { getPortfolioData }  from '@/lib/portfolio'
import { getProjects }       from '@/lib/projects'

export const dynamic = 'force-dynamic'

const STARTED_BUILDING = 2023

export default async function Home() {
  const [content, calendar, projects, activity] = await Promise.all([
    getPortfolioData(),
    getGitHubCalendar(),
    getProjects(),
    getRecentActivity(5),
  ])

  const { profile, certificates } = content
  const yearsBuilding = new Date().getFullYear() - STARTED_BUILDING
  const cleanLocation = profile.location.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, '').trim()
  const featured = projects.slice(0, 3)

  return (
    <div className="home-root">

      {/* ══════════ HERO ══════════ */}
      <section className="hero-v2">
        <div className="hero-v2-inner">

          {/* top bar */}
          <div className="hero-v2-topbar">
            <span className="hero-v2-label">Portfolio · {new Date().getFullYear()}</span>
            <span className="hero-v2-location">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z"/>
                <circle cx="12" cy="10" r="2.4"/>
              </svg>
              {cleanLocation}
            </span>
          </div>

          {/* main grid */}
          <div className="hero-v2-grid">
            <div className="hero-v2-left">
              <h1 className="hero-v2-name">
                <span className="hero-v2-name-first">Yaswanth</span>
                <span className="hero-v2-name-last">K B</span>
              </h1>

              <p className="hero-v2-role">IT Undergraduate &amp; Developer</p>

              <p className="hero-v2-bio">
                Building real-world software — from{' '}
                <strong>React frontends</strong> to{' '}
                <strong>AI-powered systems</strong> — through internships at{' '}
                Evolve Robot Lab and ALKJ Technologies.
                My stack is <strong>React</strong>, <strong>Python</strong>, and{' '}
                <strong>LangChain</strong>.
              </p>

              <div className="hero-v2-actions">
                <Link href="/work" className="btn-glass">View Work</Link>
                <Link href="/contact" className="btn-ghost">Get in Touch</Link>
              </div>

              <div className="hero-v2-socials">
                <a href={profile.githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub" className="hero-v2-social">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.475 2 2 6.588 2 12.253c0 4.537 2.862 8.369 6.838 9.727.5.09.687-.218.687-.487 0-.243-.013-1.05-.013-1.91C7 20.059 6.35 18.957 6.15 18.38c-.113-.295-.6-1.205-1.025-1.448-.35-.192-.85-.667-.013-.68.788-.012 1.35.744 1.538 1.051.9 1.551 2.338 1.116 2.912.846.088-.666.35-1.115.638-1.371-2.225-.256-4.55-1.14-4.55-5.062 0-1.115.387-2.038 1.025-2.756-.1-.256-.45-1.307.1-2.717 0 0 .837-.269 2.75 1.051.8-.23 1.65-.346 2.5-.346.85 0 1.7.115 2.5.346 1.912-1.333 2.75-1.05 2.75-1.05.55 1.409.2 2.46.1 2.716.637.718 1.025 1.628 1.025 2.756 0 3.934-2.337 4.806-4.562 5.062.362.32.675.936.675 1.897 0 1.371-.013 2.473-.013 2.82 0 .268.188.589.688.486a10.039 10.039 0 0 0 4.932-3.74A10.447 10.447 0 0 0 22 12.253C22 6.588 17.525 2 12 2Z"/>
                  </svg>
                </a>
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hero-v2-social">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
                    <path d="M18.335 18.339H15.67v-4.177c0-.996-.02-2.278-1.39-2.278-1.389 0-1.601 1.084-1.601 2.205v4.25h-2.666V9.75h2.56v1.17h.035c.358-.674 1.228-1.387 2.528-1.387 2.7 0 3.2 1.778 3.2 4.091v4.715zM7.003 8.575a1.546 1.546 0 01-1.548-1.549 1.548 1.548 0 111.547 1.549zm1.336 9.764H5.666V9.75H8.34v8.589zM19.67 3H4.329C3.593 3 3 3.58 3 4.297v15.406C3 20.42 3.594 21 4.328 21h15.338C20.4 21 21 20.42 21 19.703V4.297C21 3.58 20.4 3 19.666 3h.003z"/>
                  </svg>
                </a>
                <a href={profile.xUrl} target="_blank" rel="noreferrer" aria-label="X" className="hero-v2-social">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="hero-v2-right">
              <div className="hero-v2-badge">
                <span className="hero-v2-badge-dot" aria-hidden="true"/>
                Open to internships
              </div>
              <div className="hero-v2-stats">
                <div className="hero-v2-stat">
                  <span className="hero-v2-stat-num">{yearsBuilding}+</span>
                  <span className="hero-v2-stat-label">years building</span>
                </div>
                <div className="hero-v2-stat">
                  <span className="hero-v2-stat-num">2</span>
                  <span className="hero-v2-stat-label">internships</span>
                </div>
                <div className="hero-v2-stat">
                  <span className="hero-v2-stat-num">450+</span>
                  <span className="hero-v2-stat-label">LeetCode</span>
                </div>
                <div className="hero-v2-stat">
                  <span className="hero-v2-stat-num">{projects.length}</span>
                  <span className="hero-v2-stat-label">projects</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════ SELECTED WORK — bento cards ══════════ */}
      {featured.length > 0 && (
        <section id="selected-work" className="home-section home-section--work">
          <div className="section-label-row">
            <span className="section-num">01</span>
            <h2 className="section-title">Selected Work</h2>
            <Link href="/work" className="section-link">All projects →</Link>
          </div>

          <div className="work-bento">
            {/* Featured card — large */}
            <Link href={`/work/${featured[0].slug}` as never} className="work-card work-card--featured">
              <div className="work-card-meta">
                <span className="work-card-index">{featured[0].index}</span>
                <span className="work-card-year">{featured[0].year}</span>
                {featured[0].repoUrl && (
                  <RepoStars repoUrl={featured[0].repoUrl} />
                )}
              </div>
              <h3 className="work-card-title">{featured[0].title}</h3>
              <p className="work-card-desc">{featured[0].description.slice(0, 160)}{featured[0].description.length > 160 ? '…' : ''}</p>
              <div className="work-card-tags">
                {featured[0].tags.slice(0, 5).map(t => (
                  <span key={t} className="work-card-tag">{t}</span>
                ))}
              </div>
              {(featured[0].liveUrl || featured[0].repoUrl) && (
                <div className="work-card-links">
                  {featured[0].liveUrl && (
                    <span className="work-card-live">↗ Live</span>
                  )}
                  {featured[0].repoUrl && (
                    <span className="work-card-repo">⌥ GitHub</span>
                  )}
                </div>
              )}
              <span className="work-card-arrow">→</span>
            </Link>

            {/* Secondary cards */}
            <div className="work-bento-col">
              {featured.slice(1).map(p => (
                <Link key={p.id} href={`/work/${p.slug}` as never} className="work-card work-card--small">
                  <div className="work-card-meta">
                    <span className="work-card-index">{p.index}</span>
                    <span className="work-card-year">{p.year}</span>
                  </div>
                  <h3 className="work-card-title">{p.title}</h3>
                  <p className="work-card-desc">{p.description.slice(0, 90)}{p.description.length > 90 ? '…' : ''}</p>
                  <div className="work-card-tags">
                    {p.tags.slice(0, 3).map(t => (
                      <span key={t} className="work-card-tag">{t}</span>
                    ))}
                  </div>
                  <span className="work-card-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ CREDENTIALS — table style ══════════ */}
      {certificates.length > 0 && (
        <section id="credentials" className="home-section home-section--creds">
          <div className="section-label-row">
            <span className="section-num">02</span>
            <h2 className="section-title">Credentials</h2>
            <Link href="/certificates" className="section-link">All certificates →</Link>
          </div>

          <div className="creds-table">
            {certificates.slice(0, 4).map((c, i) => {
              const inner = (
                <>
                  <span className="cred-num">0{i + 1}</span>
                  <div className="cred-body">
                    <span className="cred-title">{c.title}</span>
                    <span className="cred-issuer">{c.issuer}</span>
                  </div>
                  <span className="cred-year">{c.year}</span>
                  {c.fileUrl && <span className="cred-arrow">↗</span>}
                </>
              )
              return (
                <div key={c.id} className="cred-row">
                  {c.fileUrl ? (
                    <a href={c.fileUrl} target="_blank" rel="noreferrer" className="cred-row-inner" aria-label={`View ${c.title}`}>
                      {inner}
                    </a>
                  ) : (
                    <div className="cred-row-inner">{inner}</div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ══════════ FIELD NOTES — heatmap ══════════ */}
      {calendar && (
        <section id="field-notes" className="home-section home-section--heatmap">
          <div className="section-label-row">
            <span className="section-num">03</span>
            <h2 className="section-title">Field Notes</h2>
            <span className="section-meta">A year, day by day</span>
          </div>
          <div className="heatmap-frame">
            <GitHubHeatmap
              weeks={calendar.weeks}
              totalContributions={calendar.totalContributions}
            />
          </div>
        </section>
      )}

      {/* ══════════ LIVE FEED — terminal style ══════════ */}
      {activity.length > 0 && (
        <section id="live-feed" className="home-section home-section--feed">
          <div className="section-label-row">
            <span className="section-num">04</span>
            <h2 className="section-title">Live Feed</h2>
            <span className="section-meta">What I&rsquo;ve been shipping</span>
          </div>
          <div className="terminal-wrap">
            <div className="terminal-bar">
              <span className="terminal-dot terminal-dot--red" />
              <span className="terminal-dot terminal-dot--yellow" />
              <span className="terminal-dot terminal-dot--green" />
              <span className="terminal-title">~/activity</span>
            </div>
            <div className="terminal-body">
              <RecentActivity initial={activity} />
            </div>
          </div>
        </section>
      )}

      {/* ══════════ CTA — contact ══════════ */}
      <section id="reach-out" className="home-section home-section--cta">
        <div className="cta-v2">
          <p className="cta-v2-eyebrow">05 · Let&rsquo;s talk</p>
          <h2 className="cta-v2-heading">
            Got a project?<br/>
            <em>Let&rsquo;s build it.</em>
          </h2>
          <p className="cta-v2-sub">
            Open to internships, freelance work, and good conversations.
            I reply within a day or two.
          </p>
          <div className="cta-v2-actions">
            <Link href="/contact" className="btn-glass">Send a Message</Link>
            <a href={`mailto:${profile.email}`} className="btn-ghost">{profile.email}</a>
          </div>
        </div>
      </section>

    </div>
  )
}
