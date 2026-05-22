import type { Metadata } from 'next'
import Link from 'next/link'
import { SERVICES } from '@/data/services'

export const metadata: Metadata = {
  title: 'Services — Yaswanth',
  description: 'Frontend development, AI tooling, and technical solutions by Yaswanth K B.',
}

const PROCESS = [
  {
    step: 'i',
    label: 'Listen',
    body: 'We start with a call so I can understand the problem, the constraints, and what success actually looks like for you.',
  },
  {
    step: 'ii',
    label: 'Scope',
    body: 'A short written brief with deliverables, timeline, and a clear price. No surprises. You approve before any code is written.',
  },
  {
    step: 'iii',
    label: 'Build',
    body: 'I work in tight, reviewable increments. Weekly demos, an open chat, and a git history you can read line-by-line.',
  },
  {
    step: 'iv',
    label: 'Hand off',
    body: 'A clean repo, runnable docs, and a hand-off call. Two weeks of support after launch are always included.',
  },
]

const ENGAGEMENTS = [
  { label: 'Project',  body: 'Fixed scope, fixed price. Best for well-defined builds and redesigns.' },
  { label: 'Retainer', body: 'A set number of hours each month. Best for ongoing product work.' },
  { label: 'Advisory', body: 'Pay by the call. Best for architecture reviews or stack decisions.' },
]

export default function ServicesPage() {
  return (
    <section className="page services-page">

      {/* ─── HERO ─── */}
      <header className="services-hero">
        <p className="services-hero-eyebrow">
          <span className="services-hero-mark" aria-hidden="true">§</span>
          What I do
        </p>
        <h1 className="services-hero-title">
          Three kinds of <em>careful work</em>
        </h1>
        <p className="services-hero-lede">
          I take on a small number of projects at a time so each one gets the
          attention it deserves. Here&rsquo;s what I do, how I do it, and how we
          might work together.
        </p>
      </header>

      {/* ─── SERVICES ─── */}
      <ol className="services-list">
        {SERVICES.map((svc, i) => (
          <li
            key={svc.id}
            className="services-entry fade-in"
            style={{ animationDelay: `${i * 0.06}s` } as React.CSSProperties}
          >
            <div className="services-entry-head">
              <span className="services-entry-num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="services-entry-glyph" aria-hidden="true">{svc.glyph}</span>
              <h2 className="services-entry-name">{svc.name}</h2>
            </div>
            <div className="services-entry-body">
              <p className="services-entry-desc">{svc.description}</p>
              <p className="services-entry-deliv-label">Includes</p>
              <ul className="services-entry-deliv">
                {svc.items.map(item => (
                  <li key={item} className="services-entry-deliv-item">
                    <span className="services-entry-deliv-mark" aria-hidden="true">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      {/* ─── PROCESS ─── */}
      <section className="services-section">
        <div className="services-section-head">
          <p className="services-section-eyebrow">
            <span className="services-section-num">§</span>
            <span>How I work</span>
          </p>
          <h2 className="services-section-title">
            A small, <em>predictable rhythm</em>
          </h2>
        </div>
        <ol className="services-process">
          {PROCESS.map(step => (
            <li key={step.step} className="services-process-step">
              <span className="services-process-roman">{step.step}.</span>
              <div className="services-process-body">
                <p className="services-process-label">{step.label}</p>
                <p className="services-process-text">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ─── ENGAGEMENT ─── */}
      <section className="services-section">
        <div className="services-section-head">
          <p className="services-section-eyebrow">
            <span className="services-section-num">§</span>
            <span>Engagement</span>
          </p>
          <h2 className="services-section-title">
            Three ways to <em>begin</em>
          </h2>
          <p className="services-section-accent">
            Prices are quoted per project after a brief call &mdash; usually
            within two business days.
          </p>
        </div>
        <dl className="services-engagement">
          {ENGAGEMENTS.map(e => (
            <div key={e.label} className="services-engagement-row">
              <dt className="services-engagement-label">{e.label}</dt>
              <dd className="services-engagement-body">{e.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ─── CLOSING CTA ─── */}
      <footer className="services-foot">
        <span className="services-foot-line" aria-hidden="true" />
        <h2 className="services-foot-title">
          If any of this <em>sounds like your project</em>
        </h2>
        <p className="services-foot-text">
          I&rsquo;d love to hear from you. Send a short note describing what
          you&rsquo;re building and the constraints you&rsquo;re working with.
          I read every message and reply within a day or two.
        </p>
        <div className="services-foot-actions">
          <Link href="/contact" className="btn-glass">Start a conversation</Link>
          <Link href="/work" className="btn-ghost">See past projects</Link>
        </div>
      </footer>
    </section>
  )
}
