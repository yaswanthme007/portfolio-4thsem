import type { Metadata } from 'next'
import { ContactForm }      from '@/components/ContactForm'
import { getPortfolioData } from '@/lib/portfolio'

export const metadata: Metadata = {
  title: 'Contact — Yaswanth',
  description: 'Get in touch with Yaswanth K B for internship inquiries and project collaborations.',
}

export default async function ContactPage() {
  const { profile } = await getPortfolioData()
  const linkedinHandle = new URL(profile.linkedinUrl).pathname.replace(/^\/+/, '')
  const xHandle        = new URL(profile.xUrl).pathname.replace(/^\/+/, '')

  const channels = [
    { label: 'Email',    handle: profile.email,                       href: `mailto:${profile.email}`,             arrow: '→' },
    { label: 'GitHub',   handle: `github.com/${profile.githubUsername}`, href: profile.githubUrl,                   arrow: '↗' },
    { label: 'LinkedIn', handle: linkedinHandle,                       href: profile.linkedinUrl,                   arrow: '↗' },
    { label: 'X',        handle: `@${xHandle}`,                        href: profile.xUrl,                          arrow: '↗' },
    { label: 'Coffee',   handle: 'Buy me a coffee',                    href: profile.coffeeUrl,                     arrow: '↗' },
  ]

  const briefPoints = [
    'What you are building',
    'What shape of help you need',
    'Timeline and delivery context',
    'Any current blockers or constraints',
  ]

  return (
    <section className="page contact-page">

      {/* ─── HERO ─── */}
      <header className="contact-hero">
        <p className="contact-hero-eyebrow">
          <span className="contact-hero-mark" aria-hidden="true">§</span>
          Get in touch
        </p>
        <h1 className="contact-hero-title">
          Let&rsquo;s build <em>something fine</em>
        </h1>
        <p className="contact-hero-lede">
          A project that needs careful hands. A system that needs cleanup.
          Or a product decision that needs a second set of eyes. Send a
          structured brief and I can reply with something more useful than
          “tell me more.”
        </p>
      </header>

      <div className="contact-grid">

        {/* ─── LEFT · DIRECT CHANNELS ─── */}
        <aside className="contact-aside">
          <p className="contact-aside-label">
            <span className="contact-aside-mark">§</span>
            Direct channels
          </p>

          <ul className="contact-channels">
            {channels.map(c => (
              <li key={c.label} className="contact-channel">
                <a
                  href={c.href}
                  className="contact-channel-link"
                  target={c.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={c.href.startsWith('mailto:') ? undefined : 'noreferrer'}
                >
                  <span className="contact-channel-platform">{c.label}</span>
                  <span className="contact-channel-handle">{c.handle}</span>
                  <span className="contact-channel-arrow" aria-hidden="true">{c.arrow}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="contact-meta">
            <p className="contact-meta-row">
              <span className="contact-meta-label">Based in</span>
              <span className="contact-meta-value">{profile.location.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, '').trim()}</span>
            </p>
            <p className="contact-meta-row">
              <span className="contact-meta-label">Time zone</span>
              <span className="contact-meta-value">IST (UTC&nbsp;+5:30)</span>
            </p>
            <p className="contact-meta-row">
              <span className="contact-meta-label">Replies in</span>
              <span className="contact-meta-value">24&ndash;48 hours</span>
            </p>
            <p className="contact-meta-row">
              <span className="contact-meta-label">Status</span>
              <span className="contact-meta-value contact-meta-status">
                <span className="status-dot" aria-hidden="true" />
                Open to work
              </span>
            </p>
          </div>

          <div className="contact-brief-card">
            <p className="contact-aside-label">
              <span className="contact-aside-mark">§</span>
              Good brief
            </p>
            <ul className="contact-brief-list">
              {briefPoints.map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ─── RIGHT · FORM ─── */}
        <div className="contact-form-wrap">
          <p className="contact-form-label">
            <span className="contact-aside-mark">§</span>
            Start with a brief
          </p>
          <ContactForm />
        </div>
      </div>

      {/* ─── CLOSING ─── */}
      <footer className="contact-foot">
        <span className="contact-foot-line" aria-hidden="true" />
        <p className="contact-foot-text">
          Either way works. <em>Looking forward to hearing from you.</em>
        </p>
        <p className="contact-foot-sign">&mdash; Yaswanth</p>
      </footer>
    </section>
  )
}
