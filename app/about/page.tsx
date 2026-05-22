import type { Metadata } from 'next'
import Link from 'next/link'
import { getPortfolioData } from '@/lib/portfolio'

export const metadata: Metadata = {
  title: 'About — Yaswanth',
  description: 'Yaswanth K B — IT Developer based in Chennai. Stack, projects, and experience.',
}

const STARTED_BUILDING = 2023

const STACK_GROUPS = [
  {
    label: 'Languages',
    items: ['Python', 'C', 'C++', 'Java', 'JavaScript'],
  },
  {
    label: 'Frontend',
    items: ['React.js', 'HTML5', 'CSS', 'Tailwind CSS', 'Responsive UI Design'],
  },
  {
    label: 'AI & GenAI',
    items: ['Groq API', 'LangChain', 'FAISS', 'HuggingFace', 'Streamlit'],
  },
  {
    label: 'Tools',
    items: ['Git', 'GitHub', 'VS Code', 'Chrome DevTools', 'Firebase'],
  },
  {
    label: 'Core Concepts',
    items: ['OOP', 'Data Structures', 'Algorithms', 'CRUD', 'Local Storage'],
  },
] as const

const CURRENTLY = [
  { label: 'Learning', value: 'Advanced React patterns, DSA, and AI/LLM tooling.' },
  { label: 'Building', value: 'Portfolio projects in React and experimenting with RAG-based AI apps.' },
  { label: 'Exploring', value: 'GenAI internships, competitive programming, and open source contributions.' },
] as const

const PRINCIPLES = [
  { label: 'Problem first', text: 'Understand the problem completely before writing a single line of code.' },
  { label: 'Clean code', text: 'Readable, reusable components and clear naming over clever one-liners.' },
  { label: 'Ship and iterate', text: 'Build working things fast, then improve. Paralysis beats nothing.' },
] as const

const INTERESTS = [
  'Competitive programming (450+ LeetCode)',
  'AI / GenAI tooling',
  'React application development',
  'Open source contributions',
] as const

function profilePath(url: string) {
  return new URL(url).pathname.replace(/^\/+|\/+$/g, '')
}

export default async function AboutPage() {
  const { profile, experience, education } = await getPortfolioData()
  const cleanLocation = profile.location.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, '').trim()
  const yearsBuilding = new Date().getFullYear() - STARTED_BUILDING
  const linkedinHandle = profilePath(profile.linkedinUrl)
  const xHandle = profilePath(profile.xUrl)

  return (
    <section className="page about-page">
      <header className="about-cover">
        <div className="about-cover-copy">
          <p className="about-kicker">
            <span aria-hidden="true">§</span>
            About / Developer profile
          </p>
          <h1 className="about-cover-title">
            Software with a <em>clear pulse</em>
          </h1>
          <p className="about-cover-lede">
            I&rsquo;m Yaswanth K B, an IT developer in {cleanLocation}.
            I build web products that are quick to use, simple to reason about,
            and polished enough that people trust them before reading the docs.
          </p>
          <div className="about-cover-actions">
            <Link href="/work" className="btn-glass">See the work</Link>
            <Link href="/contact" className="btn-ghost">Start a conversation</Link>
          </div>
        </div>

        <aside className="about-profile-card" aria-label="Profile summary">
          <div className="about-profile-top">
            <span className="about-profile-code">YK</span>
            <span className="about-profile-status">
              <span className="status-dot" aria-hidden="true" />
              open to work
            </span>
          </div>
          <p className="about-profile-name">Yaswanth</p>
          <dl className="about-profile-facts">
            <div>
              <dt>Role</dt>
              <dd>{profile.role}</dd>
            </div>
            <div>
              <dt>Base</dt>
              <dd>{cleanLocation}</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>Full stack web, APIs, product polish</dd>
            </div>
          </dl>
        </aside>
      </header>

      <section className="about-signal-grid" aria-label="Profile signals">
        <div className="about-signal">
          <span className="about-signal-value">{yearsBuilding}+</span>
          <span className="about-signal-label">years building</span>
        </div>
        <div className="about-signal">
          <span className="about-signal-value">{experience.length.toString().padStart(2, '0')}</span>
          <span className="about-signal-label">experience entries</span>
        </div>
        <div className="about-signal">
          <span className="about-signal-value">{STACK_GROUPS.length.toString().padStart(2, '0')}</span>
          <span className="about-signal-label">skill lanes</span>
        </div>
      </section>

      <section className="about-story-grid">
        <article className="about-story-card">
          <p className="about-section-tag">01 / Working style</p>
          <h2 className="about-story-title">Careful software, shipped without theatre.</h2>
          <div className="about-story-prose">
            <p>{profile.bio}</p>
            <p>{profile.availability}</p>
          </div>
        </article>

        <aside className="about-now-card">
          <p className="about-section-tag">Now</p>
          <dl>
            {CURRENTLY.map(item => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>

      <section className="about-principles" aria-label="Working principles">
        {PRINCIPLES.map((principle, index) => (
          <article key={principle.label} className="about-principle">
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{principle.label}</h3>
            <p>{principle.text}</p>
          </article>
        ))}
      </section>

      <section className="about-stack-section">
        <div className="about-block-head">
          <p className="about-section-tag">02 / Stack</p>
          <h2>Tools in daily rotation.</h2>
          <p>Not exhaustive. This is the practical stack that shows up across my projects most often.</p>
        </div>
        <div className="about-stack-board">
          {STACK_GROUPS.map(group => (
            <article key={group.label} className="about-stack-card">
              <h3>{group.label}</h3>
              <div>
                {group.items.map(item => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-path-grid">
        {experience.length > 0 && (
          <article className="about-path-card">
            <div className="about-block-head">
              <p className="about-section-tag">03 / Path</p>
              <h2>Experience</h2>
            </div>
            <ol className="about-path-list">
              {experience.map(item => (
                <li key={item.id}>
                  <span>{item.year}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.org}</p>
                    {item.desc && <p>{item.desc}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </article>
        )}

        {education.length > 0 && (
          <article className="about-path-card">
            <div className="about-block-head">
              <p className="about-section-tag">04 / Education</p>
              <h2>Schooling</h2>
            </div>
            <ol className="about-path-list">
              {education.map(item => (
                <li key={item.id}>
                  <span>{item.year}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.org}</p>
                    {item.desc && <p>{item.desc}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </article>
        )}
      </section>

      <section className="about-closing-grid">
        <article className="about-interest-card">
          <p className="about-section-tag">05 / Off keyboard</p>
          <h2>Side quests</h2>
          <ul>
            {INTERESTS.map(interest => <li key={interest}>{interest}</li>)}
          </ul>
        </article>

        <article className="about-links-card">
          <p className="about-section-tag">Elsewhere</p>
          <a href={profile.githubUrl} target="_blank" rel="noreferrer">
            <span>GitHub</span>
            <strong>{profile.githubUsername}</strong>
          </a>
          <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
            <span>LinkedIn</span>
            <strong>{linkedinHandle}</strong>
          </a>
          <a href={profile.xUrl} target="_blank" rel="noreferrer">
            <span>X</span>
            <strong>@{xHandle}</strong>
          </a>
          <a href={`mailto:${profile.email}`}>
            <span>Email</span>
            <strong>{profile.email}</strong>
          </a>
        </article>
      </section>
    </section>
  )
}
