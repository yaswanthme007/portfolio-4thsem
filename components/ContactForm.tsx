'use client'

import { useActionState } from 'react'
import { LiquidGlass }     from './LiquidGlass'
import { submitContact }   from '@/lib/actions'
import {
  INQUIRY_TYPES,
  TIMELINE_OPTIONS,
} from '@/lib/contact-types'
import type { ActionResult } from '@/lib/contact-types'

const init: ActionResult | null = null

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, init)

  function err(key: string) {
    if (!state || state.ok || !state.errors) return null
    return state.errors[key] ? (
      <span className="field-error">{state.errors[key]}</span>
    ) : null
  }

  return (
    <LiquidGlass className="contact-form">
      {state?.ok ? (
        <div className="form-success">
          <span className="success-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
              <path d="M5 12.5l4 4L19 7" />
            </svg>
          </span>
          <h3 className="success-title">Message Received</h3>
          <p className="success-body">
            Thank you for sending the brief. I&apos;ll review it and reply within 24-48 hours.
          </p>
        </div>
      ) : (
        <form action={action} noValidate>
          <div className="contact-brief-intro">
            <p className="contact-brief-title">Project brief</p>
            <p className="contact-brief-copy">
              A few structured details help me reply with a clearer next step instead of a generic email.
            </p>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label className="field-label" htmlFor="contact-name">Name</label>
              <input id="contact-name" className="field-input" name="name" placeholder="Your name" required />
              {err('name')}
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="contact-email">Email</label>
              <input id="contact-email" className="field-input" name="email" placeholder="you@email.com" type="email" required />
              {err('email')}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label className="field-label" htmlFor="contact-company">Company</label>
              <input id="contact-company" className="field-input" name="company" placeholder="Company or team name" />
              {err('company')}
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="contact-inquiry-type">Inquiry type</label>
              <select id="contact-inquiry-type" className="field-input" name="inquiryType" defaultValue="" required>
                <option value="" disabled>Select the kind of work</option>
                {INQUIRY_TYPES.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
              {err('inquiryType')}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label className="field-label" htmlFor="contact-timeline">Timeline</label>
              <select id="contact-timeline" className="field-input" name="timeline" defaultValue="" required>
                <option value="" disabled>Select a timeline</option>
                {TIMELINE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
              {err('timeline')}
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="contact-subject">Subject</label>
              <input id="contact-subject" className="field-input" name="subject" placeholder="Build for a launch, consulting request, redesign…" required />
              {err('subject')}
            </div>
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              className="field-input field-textarea"
              name="message"
              placeholder="What are you building, what problem needs solving, and what constraints should I know about?"
              required
            />
            {err('message')}
          </div>

          {state && !state.ok && !Object.keys(state.errors ?? {}).length && (
            <p className="form-error-global">Something went wrong. Please try again.</p>
          )}

          <button type="submit" className="btn-submit" disabled={pending}>
            {pending ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      )}
    </LiquidGlass>
  )
}
