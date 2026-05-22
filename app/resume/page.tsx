import type { Metadata } from 'next'
import { getPortfolioData } from '@/lib/portfolio'
import { PrintButton } from './PrintButton'

export const metadata: Metadata = {
  title: 'Resume — Yaswanth K B',
  description: 'Resume of Yaswanth K B — IT Developer based in Chennai.',
}

const STACK: { category: string; items: string[] }[] = [
  { category: 'Languages',       items: ['Python', 'C', 'C++', 'Java', 'JavaScript'] },
  { category: 'Frontend',        items: ['React.js', 'HTML5', 'CSS', 'Tailwind CSS', 'Responsive UI Design'] },
  { category: 'State & Data',    items: ['Local Storage', 'CRUD Operations', 'React State Management'] },
  { category: 'AI & GenAI',      items: ['Groq API', 'LangChain', 'FAISS', 'HuggingFace', 'Streamlit', 'RAG Pipelines'] },
  { category: 'Tools',           items: ['VS Code', 'Git', 'GitHub', 'Chrome DevTools', 'Firebase (Basics)'] },
  { category: 'Core Concepts',   items: ['OOP', 'Data Structures', 'Algorithms', 'Problem Solving'] },
]

const INTERESTS = [
  'Competitive programming (LeetCode)',
  'AI / GenAI tooling',
  'Building React applications',
  'Open source contributions',
]

export default async function ResumePage() {
  const { profile, experience, education } = await getPortfolioData()
  const cleanLocation = profile.location.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, '').trim()
  const linkedinHandle = new URL(profile.linkedinUrl).pathname.replace(/^\/+|\/+$/g, '')

  return (
    <div className="resume-page">

      {/* Screen-only top bar with the print button — hidden in @print */}
      <div className="resume-toolbar" role="toolbar" aria-label="Resume actions">
        <div className="resume-toolbar-inner">
          <p className="resume-toolbar-hint">
            <span className="resume-toolbar-mark" aria-hidden="true">§</span>
            <span>Hit <kbd>⌘&nbsp;P</kbd> (or <kbd>Ctrl&nbsp;P</kbd>) and choose &ldquo;Save as PDF&rdquo;.</span>
          </p>
          <PrintButton />
        </div>
      </div>

      {/* The resume sheet itself */}
      <article className="resume-sheet" aria-label="Resume">

        {/* ─── HEADER ─── */}
        <header className="resume-header">
          <h1 className="resume-name">
            <span className="resume-name-first">Yaswanth</span>{' '}
            <span className="resume-name-last">K B</span>
          </h1>
          <p className="resume-role">{profile.role}</p>
          <p className="resume-contact">
            <span>{cleanLocation}</span>
            <span className="resume-contact-sep" aria-hidden="true">·</span>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <span className="resume-contact-sep" aria-hidden="true">·</span>
            <a href={profile.githubUrl} target="_blank" rel="noreferrer">
              github.com/{profile.githubUsername}
            </a>
            <span className="resume-contact-sep" aria-hidden="true">·</span>
            <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
              linkedin.com/{linkedinHandle}
            </a>
          </p>
        </header>

        <span className="resume-rule" aria-hidden="true" />

        {/* ─── SUMMARY ─── */}
        <section className="resume-section">
          <h2 className="resume-section-title">Summary</h2>
          <p className="resume-summary">{profile.resumeSummary}</p>
        </section>

        {/* ─── EXPERIENCE ─── */}
        {experience.length > 0 && (
          <section className="resume-section">
            <h2 className="resume-section-title">Experience</h2>
            <ul className="resume-list">
              {experience.map(e => (
                <li key={e.id} className="resume-item">
                  <div className="resume-item-head">
                    <h3 className="resume-item-title">{e.title}</h3>
                    <span className="resume-item-year">{e.year}</span>
                  </div>
                  <p className="resume-item-org">{e.org}</p>
                  {e.desc && <p className="resume-item-desc">{e.desc}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ─── EDUCATION ─── */}
        {education.length > 0 && (
          <section className="resume-section">
            <h2 className="resume-section-title">Education</h2>
            <ul className="resume-list">
              {education.map(e => (
                <li key={e.id} className="resume-item">
                  <div className="resume-item-head">
                    <h3 className="resume-item-title">{e.title}</h3>
                    <span className="resume-item-year">{e.year}</span>
                  </div>
                  <p className="resume-item-org">{e.org}</p>
                  {e.desc && <p className="resume-item-desc">{e.desc}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ─── TECHNICAL SKILLS ─── */}
        <section className="resume-section">
          <h2 className="resume-section-title">Technical Skills</h2>
          <dl className="resume-skills">
            {STACK.map(s => (
              <div key={s.category} className="resume-skills-row">
                <dt className="resume-skills-cat">{s.category}</dt>
                <dd className="resume-skills-items">{s.items.join(' · ')}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ─── INTERESTS ─── */}
        <section className="resume-section">
          <h2 className="resume-section-title">Interests</h2>
          <p className="resume-interests">{INTERESTS.join(' · ')}</p>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="resume-footer">
          <span>{profile.email}</span>
          <span className="resume-footer-sep" aria-hidden="true">·</span>
          <span>github.com/{profile.githubUsername}</span>
          <span className="resume-footer-sep" aria-hidden="true">·</span>
          <span>{cleanLocation}</span>
        </footer>
      </article>
    </div>
  )
}
