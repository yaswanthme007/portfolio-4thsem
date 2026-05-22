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

function SectionHead({
  index, eyebrow, title, link,
}: {
  index: string
  eyebrow: string
  title: React.ReactNode
  link?: { href: string; label: string }
}) {
  return (
    <div className="sec-head">
      <p className="sec-head-eyebrow">
        <span className="sec-head-num">{index}</span>
        {eyebrow}
      </p>
      <div className="sec-head-row">
        <h2 className="sec-head-title">{title}</h2>
        {link && (
          <Link href={link.href as never} className="sec-head-link">
            {link.label} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </div>
  )
}

export default async function Home() {
  const [content, calendar, projects, activity] = await Promise.all([
    getPortfolioData(),
    getGitHubCalendar(),
    getProjects(),
    getRecentActivity(4),
  ])

  const { profile, resume, certificates } = content
  const resumeHref    = `/api/resume?v=${encodeURIComponent(resume?.uploadedAt || Date.now())}`
  const yearsBuilding = new Date().getFullYear() - STARTED_BUILDING
  const featured      = projects.slice(0, 3)
  const cleanLocation = profile.location.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, '').trim()

  /* Contiguous section numbering — only sections that render get a number.
     Order is intentional: capability (work) → qualifications (credentials)
     → activity signals (field notes, live feed) → contact. */
  const order = [
    featured.length > 0     ? 'selected-work' : null,
    certificates.length > 0 ? 'credentials'    : null,
    calendar                ? 'field-notes'   : null,
    activity.length > 0     ? 'live-feed'      : null,
    'reach-out',
  ].filter(Boolean) as string[]
  const idx = (id: string) => String(order.indexOf(id) + 1).padStart(2, '0')

  return (
    <>
      {/* ═════════════ HERO — two-column: identity card | annotated intro ═════════════ */}
      <section className="home-hero">
        <div className="home-hero-grid">

          {/* LEFT — identity (typographic monogram, no image) */}
          <aside className="hero-id">
            <span className="hero-id-monogram" aria-hidden="true">Y</span>
            <h1 className="hero-id-name">Yaswanth<br />K B</h1>
            <p className="hero-id-aside">
              Looks big up there, I know &mdash; sophomore @ CIT Chennai 👋
            </p>
            <p className="hero-id-loc">
              <svg className="hero-id-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" strokeLinejoin="round" />
                <circle cx="12" cy="10" r="2.4" />
              </svg>
              {cleanLocation}
            </p>
            <div className="hero-id-socials">
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="hero-id-social" aria-label="GitHub">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.475 2 2 6.588 2 12.253c0 4.537 2.862 8.369 6.838 9.727.5.09.687-.218.687-.487 0-.243-.013-1.05-.013-1.91C7 20.059 6.35 18.957 6.15 18.38c-.113-.295-.6-1.205-1.025-1.448-.35-.192-.85-.667-.013-.68.788-.012 1.35.744 1.538 1.051.9 1.551 2.338 1.116 2.912.846.088-.666.35-1.115.638-1.371-2.225-.256-4.55-1.14-4.55-5.062 0-1.115.387-2.038 1.025-2.756-.1-.256-.45-1.307.1-2.717 0 0 .837-.269 2.75 1.051.8-.23 1.65-.346 2.5-.346.85 0 1.7.115 2.5.346 1.912-1.333 2.75-1.05 2.75-1.05.55 1.409.2 2.46.1 2.716.637.718 1.025 1.628 1.025 2.756 0 3.934-2.337 4.806-4.562 5.062.362.32.675.936.675 1.897 0 1.371-.013 2.473-.013 2.82 0 .268.188.589.688.486a10.039 10.039 0 0 0 4.932-3.74A10.447 10.447 0 0 0 22 12.253C22 6.588 17.525 2 12 2Z" />
                </svg>
              </a>
              <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="hero-id-social" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.335 18.339H15.67v-4.177c0-.996-.02-2.278-1.39-2.278-1.389 0-1.601 1.084-1.601 2.205v4.25h-2.666V9.75h2.56v1.17h.035c.358-.674 1.228-1.387 2.528-1.387 2.7 0 3.2 1.778 3.2 4.091v4.715zM7.003 8.575a1.546 1.546 0 01-1.548-1.549 1.548 1.548 0 111.547 1.549zm1.336 9.764H5.666V9.75H8.34v8.589zM19.67 3H4.329C3.593 3 3 3.58 3 4.297v15.406C3 20.42 3.594 21 4.328 21h15.338C20.4 21 21 20.42 21 19.703V4.297C21 3.58 20.4 3 19.666 3h.003z" />
                </svg>
              </a>
              <a href={profile.xUrl} target="_blank" rel="noreferrer" className="hero-id-social" aria-label="X">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
            <a href={resumeHref} target="_blank" rel="noreferrer" className="hero-id-resume">
              View Résumé
            </a>
          </aside>

          {/* divider */}
          <span className="hero-divider" aria-hidden="true" />

          {/* RIGHT — annotated intro prose, key terms highlighted */}
          <div className="hero-copy">
            <p>
              I&rsquo;m an <mark className="hl">IT undergraduate</mark> based in{' '}
              <mark className="hl">{cleanLocation}</mark>, building real-world software
              &mdash; from <mark className="hl">React frontends</mark> to{' '}
              <mark className="hl">AI-powered systems</mark> that actually work.
            </p>
            <p>
              Over the past <mark className="hl">{yearsBuilding}+ years</mark> I&rsquo;ve
              shipped <mark className="hl">e-commerce platforms</mark>,{' '}
              <mark className="hl">RAG-based chatbots</mark>, and{' '}
              <mark className="hl">admin dashboards</mark> through internships at{' '}
              <mark className="hl">Evolve Robot Lab</mark> and{' '}
              <mark className="hl">ALKJ Technologies</mark>. My stack is{' '}
              <mark className="hl">React</mark>, <mark className="hl">Python</mark>,{' '}
              and <mark className="hl">LangChain</mark> &mdash; with 450+ LeetCode
              problems keeping the fundamentals sharp.
            </p>
            <p>
              I&rsquo;m a <mark className="hl">fast learner</mark>,{' '}
              <mark className="hl">problem-solver first</mark>, and{' '}
              <mark className="hl">seeking internships</mark> where I can contribute
              to real products and grow fast.
            </p>
            <p>
              Looking to hire or collaborate?{' '}
              <a href={`mailto:${profile.email}`} className="hero-copy-mail">Drop me an email</a>{' '}
              &mdash; or reach out on social.
            </p>
            <span className="hero-available">
              <span className="hero-available-dot" aria-hidden="true" />
              Open to internships
            </span>
          </div>
        </div>
      </section>

      {/* ═════════════ SELECTED WORK ═════════════ */}
      {featured.length > 0 && (
        <section id="selected-work" className="home-section">
          <SectionHead
            index={idx('selected-work')}
            eyebrow="Selected Work"
            title={<>Things I&rsquo;ve <em>made lately</em></>}
            link={{ href: '/work', label: 'View all work' }}
          />
          <div className="home-work-list">
            {featured.map(p => (
              <Link key={p.id} href={`/work/${p.slug}` as never} className="home-work-row">
                <span className="home-work-row-index">{p.index}</span>
                <div className="home-work-row-body">
                  <div className="home-work-row-head">
                    <h3 className="home-work-row-title">{p.title}</h3>
                    <span className="home-work-row-meta">
                      {p.year}
                      {p.repoUrl && <> &middot; <RepoStars repoUrl={p.repoUrl} /></>}
                    </span>
                  </div>
                  <p className="home-work-row-desc">
                    {p.description.length > 150
                      ? p.description.slice(0, 148).trim() + '…'
                      : p.description}
                  </p>
                  <div className="home-work-row-tags">
                    {p.tags.slice(0, 4).map(t => (
                      <span key={t} className="project-tag">{t}</span>
                    ))}
                  </div>
                </div>
                <span className="home-work-row-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═════════════ CREDENTIALS ═════════════ */}
      {certificates.length > 0 && (
        <section id="credentials" className="home-section">
          <SectionHead
            index={idx('credentials')}
            eyebrow="Credentials"
            title={<>Proof of <em>practice</em></>}
            link={{ href: '/certificates', label: 'View all certificates' }}
          />
          <ol className="home-certs">
            {certificates.slice(0, 4).map(c => {
              const inner = (
                <>
                  <span className="home-cert-year">{c.year}</span>
                  <div className="home-cert-body">
                    <h3 className="home-cert-title">{c.title}</h3>
                    <p className="home-cert-issuer">{c.issuer}</p>
                    {c.description && <p className="home-cert-desc">{c.description}</p>}
                  </div>
                  {c.fileUrl && (
                    <span className="home-cert-link">View <span aria-hidden="true">↗</span></span>
                  )}
                </>
              )
              return (
                <li key={c.id} className="home-cert">
                  {c.fileUrl ? (
                    <a
                      href={c.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="home-cert-row"
                      aria-label={`View ${c.title} certificate`}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="home-cert-row">{inner}</div>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* ═════════════ FIELD NOTES ═════════════ */}
      {calendar && (
        <section id="field-notes" className="home-section">
          <SectionHead
            index={idx('field-notes')}
            eyebrow="Field Notes"
            title={<>A year, <em>day by day</em></>}
          />
          <LiquidGlass className="heatmap-glass" interactive={false}>
            <GitHubHeatmap
              weeks={calendar.weeks}
              totalContributions={calendar.totalContributions}
            />
          </LiquidGlass>
        </section>
      )}

      {/* ═════════════ LIVE FEED ═════════════ */}
      {activity.length > 0 && (
        <section id="live-feed" className="home-section">
          <SectionHead
            index={idx('live-feed')}
            eyebrow="Live from the keyboard"
            title={<>What I&rsquo;ve been <em>shipping</em></>}
          />
          <LiquidGlass className="activity-glass" interactive={false}>
            <RecentActivity initial={activity} />
          </LiquidGlass>
        </section>
      )}

      {/* ═════════════ REACH OUT ═════════════ */}
      <section id="reach-out" className="home-section">
        <SectionHead
          index={idx('reach-out')}
          eyebrow="Reach Out"
          title={<>If you&rsquo;ve read this far &mdash; <em>let&rsquo;s talk</em></>}
        />
        <LiquidGlass className="home-cta" interactive={false}>
          <p className="home-cta-body">
            A project that needs careful hands, a question I might help with, or
            just a hello &mdash; my inbox is open and I write back, usually
            within a day or two.
          </p>
          <div className="home-cta-actions">
            <Link href="/contact" className="btn-glass">Send a Message</Link>
            <a href={`mailto:${profile.email}`} className="btn-ghost">{profile.email}</a>
          </div>
        </LiquidGlass>
      </section>
    </>
  )
}
