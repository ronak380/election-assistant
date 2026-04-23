/**
 * @file src/app/page.tsx
 * @description Root landing page for the Election Assistant application.
 *
 *              Sections:
 *              1. Hero — bold tagline, animated badge, CTA buttons
 *              2. Feature highlights — 3-column icon grid
 *              3. Stats bar — key civic engagement numbers
 *              4. Election FAQ accordion
 *              5. CTA footer banner
 *
 * @accessibility
 *   - Single <h1> per page for screen reader heading hierarchy
 *   - All sections wrapped in semantic <section> with aria-labelledby
 *   - FAQ items use <details>/<summary> for native keyboard interaction
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ELECTION_FAQS } from '@/lib/election-data';

/** Page-level metadata for SEO. */
export const metadata: Metadata = {
  title: 'ElectionGuide — Your Interactive Election Assistant',
  description:
    'Understand how elections work, register to vote, find your polling station, and get AI-powered answers to all your voting questions.',
};

/**
 * Root Home page component.
 * Renders the landing page with hero, features, stats, FAQ, and CTA sections.
 *
 * @returns {JSX.Element} The complete landing page.
 */
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1}>

        {/* ------------------------------------------------------------------ */}
        {/* HERO SECTION                                                         */}
        {/* ------------------------------------------------------------------ */}
        <section
          className="hero-section"
          aria-labelledby="hero-heading"
        >
          <div className="container hero-inner">
            <div className="hero-badge" aria-label="Powered by Gemini 2.5 AI">
              <span aria-hidden="true">✨</span> Powered by Gemini 2.5 AI
            </div>

            <h1 id="hero-heading" className="hero-title">
              Your Complete
              <br />
              <span className="gradient-text">Election Guide</span>
            </h1>

            <p className="hero-subtitle">
              From voter registration to final certification — understand every step of
              the election process with our AI-powered interactive assistant.
            </p>

            <div className="hero-ctas" role="group" aria-label="Get started options">
              <Link
                href="/assistant"
                className="btn btn-primary hero-btn-primary"
                aria-label="Open the AI election assistant chatbot"
                id="hero-cta-chatbot"
              >
                <span aria-hidden="true">🤖</span> Ask the AI Assistant
              </Link>
              <Link
                href="/timeline"
                className="btn btn-ghost hero-btn-secondary"
                aria-label="View the interactive election process timeline"
                id="hero-cta-timeline"
              >
                <span aria-hidden="true">📋</span> View Election Timeline
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="hero-trust" aria-label="Key statistics">
              <span>🔒 100% Secure</span>
              <span aria-hidden="true">·</span>
              <span>🌐 Non-partisan</span>
              <span aria-hidden="true">·</span>
              <span>⚡ Instant AI answers</span>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="hero-orb hero-orb-1" aria-hidden="true" />
          <div className="hero-orb hero-orb-2" aria-hidden="true" />
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* FEATURES SECTION                                                     */}
        {/* ------------------------------------------------------------------ */}
        <section
          className="features-section section-padding"
          aria-labelledby="features-heading"
        >
          <div className="container">
            <header className="section-header">
              <h2 id="features-heading">Everything you need to vote confidently</h2>
              <p className="section-subtitle">
                Our AI-powered platform makes the election process simple, accessible, and transparent.
              </p>
            </header>

            <div
              className="features-grid"
              role="list"
              aria-label="Application features"
            >
              {[
                {
                  icon: '🤖',
                  title: 'AI Election Assistant',
                  description:
                    'Chat with our Gemini 2.5-powered AI to get instant, accurate answers to any election-related question.',
                  href: '/assistant',
                  cta: 'Start chatting →',
                  color: 'blue',
                },
                {
                  icon: '📋',
                  title: 'Interactive Timeline',
                  description:
                    'Walk through every phase of the election process from filing to certification with our animated timeline.',
                  href: '/timeline',
                  cta: 'Explore timeline →',
                  color: 'purple',
                },
                {
                  icon: '🗺️',
                  title: 'Polling Station Locator',
                  description:
                    'Find your nearest polling stations on an interactive map. Get alerts when you\'re near a voting center.',
                  href: '/locator',
                  cta: 'Find stations →',
                  color: 'green',
                },
                {
                  icon: '🔔',
                  title: 'Election Reminders',
                  description:
                    'Subscribe to push notifications for important election deadlines like registration cutoffs and voting day.',
                  href: '/assistant?topic=reminders',
                  cta: 'Set reminders →',
                  color: 'orange',
                },
                {
                  icon: '📖',
                  title: 'Voter Rights Guide',
                  description:
                    'Understand your rights at the polling place — what to do if you\'re turned away, how to request assistance, and more.',
                  href: '/assistant?topic=rights',
                  cta: 'Learn your rights →',
                  color: 'red',
                },
                {
                  icon: '📬',
                  title: 'Mail-In Voting Guide',
                  description:
                    'Step-by-step walkthrough for requesting, completing, and returning a mail-in or absentee ballot correctly.',
                  href: '/assistant?topic=mail-in',
                  cta: 'Learn more →',
                  color: 'teal',
                },
              ].map(({ icon, title, description, href, cta, color }) => (
                <article
                  key={title}
                  role="listitem"
                  className={`feature-card glass-card phase-${color}`}
                  aria-label={title}
                >
                  <div className="feature-icon" aria-hidden="true">{icon}</div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <Link
                    href={href}
                    className="feature-link"
                    aria-label={`${cta} — ${title}`}
                  >
                    {cta}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* STATS SECTION                                                        */}
        {/* ------------------------------------------------------------------ */}
        <section className="stats-section" aria-labelledby="stats-heading">
          <div className="container">
            <h2 id="stats-heading" className="sr-only">Civic engagement statistics</h2>
            <dl className="stats-grid" role="list">
              {[
                { value: '240M+', label: 'Eligible US voters', icon: '👥' },
                { value: '66%', label: 'Voter turnout in 2020', icon: '🗳️' },
                { value: '50+', label: 'States with early voting', icon: '📬' },
                { value: '1 Vote', label: 'Can change history', icon: '⭐' },
              ].map(({ value, label, icon }) => (
                <div key={label} role="listitem" className="stat-item">
                  <span className="stat-icon" aria-hidden="true">{icon}</span>
                  <dt className="stat-value" aria-label={`${value} ${label}`}>{value}</dt>
                  <dd className="stat-label">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* FAQ SECTION                                                          */}
        {/* ------------------------------------------------------------------ */}
        <section
          className="faq-section section-padding"
          aria-labelledby="faq-heading"
        >
          <div className="container">
            <header className="section-header">
              <h2 id="faq-heading">Frequently Asked Questions</h2>
              <p className="section-subtitle">Quick answers to common voting questions.</p>
            </header>

            <div
              className="faq-list"
              role="list"
              aria-label="Election frequently asked questions"
            >
              {ELECTION_FAQS.map((faq) => (
                <details
                  key={faq.id}
                  className="faq-item glass-card"
                  role="listitem"
                >
                  <summary
                    className="faq-question"
                    aria-expanded="false"
                  >
                    {faq.question}
                    <span className="faq-chevron" aria-hidden="true">›</span>
                  </summary>
                  <div className="faq-answer" role="region" aria-label={`Answer to: ${faq.question}`}>
                    <p>{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>

            <div className="faq-cta" aria-label="More questions prompt">
              <p>Have more questions? Our AI assistant has answers.</p>
              <Link
                href="/assistant"
                className="btn btn-primary"
                aria-label="Ask the AI election assistant your question"
                id="faq-to-chatbot"
              >
                Ask the AI Assistant
              </Link>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* CTA BANNER                                                           */}
        {/* ------------------------------------------------------------------ */}
        <section
          className="cta-banner section-padding"
          aria-labelledby="cta-heading"
        >
          <div className="container cta-inner">
            <h2 id="cta-heading" className="cta-title">
              Ready to make your vote count?
            </h2>
            <p className="cta-subtitle">
              Join millions of informed voters. Your voice matters.
            </p>
            <div className="cta-buttons" role="group" aria-label="Call to action buttons">
              <Link
                href="/locator"
                className="btn btn-primary"
                aria-label="Find your nearest polling station"
                id="cta-find-station"
              >
                🗺️ Find Your Polling Station
              </Link>
              <Link
                href="/timeline"
                className="btn btn-ghost"
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
                aria-label="Learn about the election process timeline"
                id="cta-timeline"
              >
                📋 Learn the Process
              </Link>
            </div>
          </div>
        </section>

      </main>

      <footer
        className="site-footer"
        role="contentinfo"
        aria-label="Site footer"
      >
        <div className="container footer-inner">
          <p className="footer-brand">🗳️ <strong>ElectionGuide</strong></p>
          <p className="footer-text">
            Non-partisan civic education powered by Google Gemini 2.5 AI.
          </p>
          <nav aria-label="Footer navigation">
            <ul className="footer-links" role="list">
              <li><Link href="/timeline" aria-label="Election Timeline page">Timeline</Link></li>
              <li><Link href="/assistant" aria-label="AI Assistant chatbot page">AI Assistant</Link></li>
              <li><Link href="/locator" aria-label="Polling Station Locator page">Find Polling Station</Link></li>
            </ul>
          </nav>
        </div>
      </footer>

      <style>{`
        /* ---- Hero ---- */
        .hero-section {
          position: relative;
          overflow: hidden;
          padding: 7rem 0 5rem;
          text-align: center;
        }
        .hero-inner { position: relative; z-index: 1; max-width: 700px; margin-inline: auto; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 0.375rem 1rem;
          border-radius: var(--radius-full);
          background: rgba(37, 99, 235, 0.1);
          border: 1px solid rgba(37, 99, 235, 0.25);
          color: var(--color-primary-600);
          font-size: 0.875rem;
          font-weight: 600;
          animation: fadeIn 0.6s ease;
        }
        .hero-title { font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 800; letter-spacing: -0.03em; animation: fadeIn 0.7s ease 0.1s both; }
        .hero-subtitle { font-size: clamp(1rem, 2vw, 1.25rem); color: var(--text-secondary); max-width: 560px; animation: fadeIn 0.7s ease 0.2s both; }
        .hero-ctas { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; animation: fadeIn 0.7s ease 0.3s both; }
        .hero-btn-primary { font-size: 1.0625rem; padding: 0.875rem 2rem; }
        .hero-btn-secondary { font-size: 1.0625rem; padding: 0.875rem 2rem; }
        .hero-trust { display: flex; gap: 1rem; align-items: center; color: var(--text-muted); font-size: 0.875rem; flex-wrap: wrap; justify-content: center; animation: fadeIn 0.7s ease 0.4s both; }
        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.25;
          pointer-events: none;
        }
        .hero-orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #3b82f6 0%, transparent 70%); top: -100px; left: -100px; }
        .hero-orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #8b5cf6 0%, transparent 70%); bottom: -100px; right: -50px; }

        /* ---- Features ---- */
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-top: 2.5rem; }
        .feature-card { padding: 1.75rem; display: flex; flex-direction: column; gap: 0.75rem; border-left: 4px solid var(--phase-color); }
        .feature-icon { font-size: 2rem; }
        .feature-card h3 { font-size: 1.125rem; }
        .feature-card p { font-size: 0.9rem; flex: 1; }
        .feature-link { color: var(--phase-color); font-weight: 600; font-size: 0.9rem; text-decoration: none; }
        .feature-link:hover { text-decoration: underline; }

        /* ---- Stats ---- */
        .stats-section { padding-block: 3.5rem; background: linear-gradient(135deg, var(--color-primary-900), var(--color-accent-600)); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 2rem; text-align: center; }
        .stat-item { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
        .stat-icon { font-size: 1.75rem; }
        .stat-value { font-size: 2.25rem; font-weight: 800; color: white; font-family: var(--font-display); }
        .stat-label { font-size: 0.875rem; color: rgba(255,255,255,0.75); }

        /* ---- FAQ ---- */
        .faq-list { display: flex; flex-direction: column; gap: 0.75rem; max-width: 760px; margin-inline: auto; }
        .faq-item { overflow: hidden; }
        .faq-question {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.125rem 1.5rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          list-style: none;
          color: var(--text-primary);
        }
        .faq-question::-webkit-details-marker { display: none; }
        .faq-chevron { font-size: 1.25rem; color: var(--color-primary-500); transition: transform var(--transition-fast); }
        details[open] .faq-chevron { transform: rotate(90deg); }
        .faq-answer { padding: 0 1.5rem 1.25rem; color: var(--text-secondary); font-size: 0.9375rem; }
        .faq-cta { text-align: center; margin-top: 2.5rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .faq-cta p { color: var(--text-secondary); }

        /* ---- CTA Banner ---- */
        .cta-banner { background: linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-accent-600) 100%); }
        .cta-inner { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
        .cta-title { color: white; font-size: clamp(1.75rem, 4vw, 2.5rem); }
        .cta-subtitle { color: rgba(255,255,255,0.8); font-size: 1.125rem; }
        .cta-buttons { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }

        /* ---- Footer ---- */
        .site-footer { padding-block: 2.5rem; border-top: 1px solid var(--border-color); }
        .footer-inner { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; text-align: center; }
        .footer-brand { font-size: 1.125rem; color: var(--text-primary); }
        .footer-text { color: var(--text-muted); font-size: 0.875rem; }
        .footer-links { display: flex; gap: 1.5rem; list-style: none; }
        .footer-links a { color: var(--text-muted); font-size: 0.875rem; text-decoration: none; }
        .footer-links a:hover { color: var(--color-primary-600); }
      `}</style>
    </>
  );
}
