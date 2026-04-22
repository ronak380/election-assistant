/**
 * @file src/components/ElectionTimeline.tsx
 * @description Interactive visual timeline component showing all phases of the election process.
 *
 *              Features:
 *              - Animated entrance for each phase card using IntersectionObserver
 *              - Expandable cards to show citizen action steps
 *              - Color-coded phase indicators
 *              - Full keyboard interaction (Enter/Space to expand)
 *              - ARIA expanded state on all interactive cards
 *              - Tracks phase views via GA4
 *
 * @accessibility
 *   - Each card is a <article> with descriptive aria-label
 *   - Toggle buttons use aria-expanded and aria-controls
 *   - Live region announces newly opened phase details
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ELECTION_PHASES, type ElectionPhase } from '@/lib/election-data';
import { trackTimelineView } from '@/lib/analytics';

/**
 * Props for the individual PhaseCard component.
 */
interface PhaseCardProps {
  /** The election phase data to render. */
  phase: ElectionPhase;
  /** Whether this card's details section is currently expanded. */
  isExpanded: boolean;
  /** Callback fired when the user toggles this card's expanded state. */
  onToggle: (id: string) => void;
}

/**
 * PhaseCard — renders a single election phase as an animated, expandable card.
 *
 * @param {PhaseCardProps} props - Component props.
 * @returns {JSX.Element} An accessible, animatable election phase card.
 */
function PhaseCard({ phase, isExpanded, onToggle }: PhaseCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const detailsId = `phase-details-${phase.id}`;
  const toggleId = `phase-toggle-${phase.id}`;

  /** Use IntersectionObserver to trigger fade-in animation on scroll into view. */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('phase-card--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={cardRef}
      className={`phase-card phase-${phase.colorKey}`}
      aria-label={`Phase ${phase.order}: ${phase.title} — ${phase.timeframe}`}
    >
      <div className="phase-card-header">
        <div className="phase-icon-wrap" aria-hidden="true">
          <span className="phase-icon">{phase.icon}</span>
          <span className="phase-order">Phase {phase.order}</span>
        </div>
        <div className="phase-info">
          <div className="phase-timeframe">
            <span aria-hidden="true">🗓️</span>
            <span>{phase.timeframe}</span>
          </div>
          <h3>{phase.title}</h3>
          <p className="phase-description">{phase.description}</p>
        </div>

        <button
          id={toggleId}
          className="phase-toggle-btn"
          onClick={() => onToggle(phase.id)}
          aria-expanded={isExpanded}
          aria-controls={detailsId}
          aria-label={
            isExpanded
              ? `Collapse ${phase.title} details`
              : `Expand ${phase.title} — see citizen action steps`
          }
        >
          <span className="phase-toggle-icon" aria-hidden="true">
            {isExpanded ? '▲' : '▼'}
          </span>
        </button>
      </div>

      {/* Expandable Details Section */}
      {isExpanded && (
        <div
          id={detailsId}
          className="phase-details animate-fade-in"
          role="region"
          aria-labelledby={toggleId}
        >
          <h4>What you can do as a citizen:</h4>
          <ol
            className="citizen-steps"
            aria-label={`Action steps for ${phase.title} phase`}
          >
            {phase.citizenSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </article>
  );
}

/**
 * ElectionTimeline — renders all election phases as a vertical, animated timeline.
 *
 * @returns {JSX.Element} The complete election process timeline.
 */
export default function ElectionTimeline() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /**
   * Handles toggling a phase card open/closed.
   * Collapses the previously open card if a different one is selected.
   * Tracks the view event in GA4.
   *
   * @param {string} id - The ID of the phase card to toggle.
   */
  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => {
      const next = prev === id ? null : id;
      if (next) trackTimelineView(next);
      return next;
    });
  }, []);

  return (
    <section
      className="timeline-section"
      aria-labelledby="timeline-heading"
    >
      <div className="container">
        <header className="section-header">
          <h2 id="timeline-heading">
            <span className="gradient-text">The Election Process</span>
          </h2>
          <p className="section-subtitle">
            From candidate filing to final certification — here&apos;s how every election works, step by step.
          </p>
        </header>

        {/* Live region to announce when a phase opens (for screen readers) */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {expandedId
            ? `${ELECTION_PHASES.find((p) => p.id === expandedId)?.title} details expanded.`
            : ''}
        </div>

        <div className="timeline-track" role="list" aria-label="Election process phases">
          {ELECTION_PHASES.map((phase, index) => (
            <div
              key={phase.id}
              role="listitem"
              className="timeline-item"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Connector line between cards */}
              {index < ELECTION_PHASES.length - 1 && (
                <div className="timeline-connector" aria-hidden="true" />
              )}
              <PhaseCard
                phase={phase}
                isExpanded={expandedId === phase.id}
                onToggle={handleToggle}
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .timeline-section { padding-block: 4rem; }
        .section-header { text-align: center; margin-bottom: 3rem; }
        .section-subtitle { font-size: 1.125rem; color: var(--text-secondary); margin-top: 0.75rem; }
        .timeline-track { display: flex; flex-direction: column; gap: 0; max-width: 800px; margin-inline: auto; }
        .timeline-item { position: relative; padding-left: 2.5rem; }
        .timeline-connector {
          position: absolute;
          left: 1rem;
          top: 60px;
          bottom: -8px;
          width: 2px;
          background: linear-gradient(to bottom, var(--phase-color, var(--color-primary-500)), transparent);
        }
        .phase-card {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--glass-border);
          border-left: 4px solid var(--phase-color);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          margin-bottom: 1rem;
          opacity: 0;
          transform: translateX(-16px);
          transition: opacity 0.5s ease, transform 0.5s ease, box-shadow var(--transition-base);
        }
        .phase-card--visible { opacity: 1; transform: translateX(0); }
        .phase-card:hover { box-shadow: var(--shadow-lg); }
        .phase-card-header { display: flex; gap: 1rem; align-items: flex-start; }
        .phase-icon-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          background: var(--phase-bg);
          border-radius: var(--radius-sm);
          justify-content: center;
          position: relative;
        }
        .phase-icon { font-size: 1.5rem; }
        .phase-order { font-size: 0.6rem; font-weight: 700; color: var(--phase-color); text-transform: uppercase; letter-spacing: 0.05em; }
        .phase-info { flex: 1; }
        .phase-timeframe { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.25rem; }
        .phase-info h3 { font-size: 1.125rem; margin-bottom: 0.375rem; }
        .phase-description { font-size: 0.9rem; color: var(--text-secondary); }
        .phase-toggle-btn {
          background: none;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          width: 32px; height: 32px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: var(--phase-color);
          transition: all var(--transition-fast);
          font-size: 0.7rem;
        }
        .phase-toggle-btn:hover { background: var(--phase-bg); border-color: var(--phase-color); }
        .phase-details {
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border-color);
        }
        .phase-details h4 { font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--phase-color); margin-bottom: 0.75rem; }
        .citizen-steps { padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .citizen-steps li { font-size: 0.9375rem; color: var(--text-secondary); }
        @media (max-width: 640px) {
          .timeline-item { padding-left: 0; }
          .timeline-connector { display: none; }
          .phase-card-header { flex-wrap: wrap; }
        }
      `}</style>
    </section>
  );
}
