/**
 * @file src/__tests__/election-data.test.ts
 * @description Unit tests for the static election data module.
 *              Validates data shape, ordering, required fields, and FAQ integrity.
 */

import { ELECTION_PHASES, ELECTION_FAQS, type ElectionPhase } from '@/lib/election-data';

// ============================================================================
// ELECTION_PHASES
// ============================================================================
describe('ELECTION_PHASES', () => {
  it('contains a non-empty array of phases', () => {
    expect(Array.isArray(ELECTION_PHASES)).toBe(true);
    expect(ELECTION_PHASES.length).toBeGreaterThan(0);
  });

  it('phases are ordered correctly by the order field (1-based, sequential)', () => {
    ELECTION_PHASES.forEach((phase, index) => {
      expect(phase.order).toBe(index + 1);
    });
  });

  it('each phase has all required string fields', () => {
    const requiredFields: (keyof ElectionPhase)[] = [
      'id', 'title', 'icon', 'description', 'timeframe', 'colorKey',
    ];
    ELECTION_PHASES.forEach((phase) => {
      requiredFields.forEach((field) => {
        expect(typeof phase[field]).toBe('string');
        expect((phase[field] as string).length).toBeGreaterThan(0);
      });
    });
  });

  it('each phase has at least one citizen step', () => {
    ELECTION_PHASES.forEach((phase) => {
      expect(Array.isArray(phase.citizenSteps)).toBe(true);
      expect(phase.citizenSteps.length).toBeGreaterThan(0);
    });
  });

  it('all phase IDs are unique', () => {
    const ids = ELECTION_PHASES.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all colorKeys are from the valid set', () => {
    const validColors = new Set(['blue', 'purple', 'green', 'orange', 'red', 'teal']);
    ELECTION_PHASES.forEach((phase) => {
      expect(validColors.has(phase.colorKey)).toBe(true);
    });
  });

  it('contains expected phases: voter-registration and election-day', () => {
    const ids = ELECTION_PHASES.map((p) => p.id);
    expect(ids).toContain('voter-registration');
    expect(ids).toContain('election-day');
  });
});

// ============================================================================
// ELECTION_FAQS
// ============================================================================
describe('ELECTION_FAQS', () => {
  it('contains a non-empty array of FAQs', () => {
    expect(Array.isArray(ELECTION_FAQS)).toBe(true);
    expect(ELECTION_FAQS.length).toBeGreaterThan(0);
  });

  it('each FAQ has a non-empty id, question, and answer', () => {
    ELECTION_FAQS.forEach((faq) => {
      expect(typeof faq.id).toBe('string');
      expect(faq.id.length).toBeGreaterThan(0);
      expect(typeof faq.question).toBe('string');
      expect(faq.question.length).toBeGreaterThan(0);
      expect(typeof faq.answer).toBe('string');
      expect(faq.answer.length).toBeGreaterThan(0);
    });
  });

  it('all FAQ IDs are unique', () => {
    const ids = ELECTION_FAQS.map((f) => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('questions end with a question mark', () => {
    ELECTION_FAQS.forEach((faq) => {
      expect(faq.question.trim().endsWith('?')).toBe(true);
    });
  });
});
