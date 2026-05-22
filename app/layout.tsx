import type { Metadata } from 'next'
import Script              from 'next/script'
import { Nav }               from '@/components/Nav'
import { CommandPalette }    from '@/components/CommandPalette'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { getProjects }       from '@/lib/projects'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Yaswanth — Developer',
  description: 'Portfolio of Yaswanth K B — IT Developer and React Engineer in Chennai.',
}

/* On first ever visit, persist 'light' so the default sticks across reloads.
   Subsequent visits respect whatever the user explicitly toggled to. */
const THEME_INIT = `(function(){try{var s=localStorage.getItem('theme');var t=(s==='dark'||s==='light')?s:'light';if(!s){localStorage.setItem('theme','light');}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`

const REJECTION_GUARD = `window.addEventListener('unhandledrejection',function(event){if(event.reason&&(event.reason.message&&event.reason.message.includes('MetaMask')||event.reason.code===4001||String(event.reason).includes('MetaMask'))){event.preventDefault();}});`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const projects = await getProjects().catch(() => [])
  const projectLite = projects.map(p => ({ title: p.title, slug: p.slug, description: p.description }))

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT}
        </Script>
        <Script id="rejection-guard" strategy="beforeInteractive">
          {REJECTION_GUARD}
        </Script>

        <Nav />
        <main>{children}</main>
        <footer className="footer">
          <span>Yaswanth</span>
          <span className="footer-divider">·</span>
          <span>Chennai, India</span>
          <span className="footer-divider">·</span>
          <span>{new Date().getFullYear()}</span>
        </footer>

        <CommandPalette projects={projectLite} />
        <KeyboardShortcuts />
      </body>
    </html>
  )
}
