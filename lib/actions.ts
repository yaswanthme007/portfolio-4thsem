'use server'

import { randomUUID } from 'crypto'
import { saveContactSubmission } from './contacts'
import { ContactSchema } from './contact-types'
import type { ActionResult } from './contact-types'

/* ── Server Action ── */
export async function submitContact(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    company: formData.get('company'),
    inquiryType: formData.get('inquiryType'),
    timeline: formData.get('timeline'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  }

  const result = ContactSchema.safeParse(raw)
  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach(i => { errors[i.path[0] as string] = i.message })
    return { ok: false, errors }
  }

  await saveContactSubmission({
    ...result.data,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  })

  /* ── Email notification via Gmail SMTP ── */
  try {
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const notifyEmail = process.env.NOTIFY_EMAIL

    if (smtpHost && smtpUser && smtpPass && notifyEmail) {
      const nodemailer = (await import('nodemailer')).default
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      })

      await transporter.sendMail({
        from: `"Portfolio Contact" <${smtpUser}>`,
        to:   notifyEmail,
        replyTo: result.data.email,
        subject: `[Portfolio] ${result.data.subject}`,
        text: [
          `From: ${result.data.name} <${result.data.email}>`,
          result.data.company ? `Company: ${result.data.company}` : null,
          `Inquiry type: ${result.data.inquiryType}`,
          `Timeline: ${result.data.timeline}`,
          `Subject: ${result.data.subject}`,
          '',
          result.data.message,
        ].filter(Boolean).join('\n'),
        html: `
          <p><strong>From:</strong> ${result.data.name} &lt;${result.data.email}&gt;</p>
          ${result.data.company ? `<p><strong>Company:</strong> ${result.data.company}</p>` : ''}
          <p><strong>Inquiry type:</strong> ${result.data.inquiryType}</p>
          <p><strong>Timeline:</strong> ${result.data.timeline}</p>
          <p><strong>Subject:</strong> ${result.data.subject}</p>
          <hr />
          <p style="white-space:pre-wrap">${result.data.message.replace(/</g, '&lt;')}</p>
        `,
      })
    }
  } catch (err) {
    // Don't fail the form submission if email fails — submission is already saved to Redis
    console.error('Email notification failed:', err)
  }

  return { ok: true }
}
