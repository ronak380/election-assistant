/**
 * @file src/lib/election-data.ts
 * @description Static data models and constants for election timelines, phases,
 *              and process steps. These are used by the Timeline component and
 *              serve as grounding context for the Gemini AI assistant.
 */

/**
 * Represents a single phase in the election process.
 */
export interface ElectionPhase {
  /** Unique identifier for the phase (used as React key and anchor). */
  id: string;
  /** Display order index (1-based). */
  order: number;
  /** Short title for the phase card. */
  title: string;
  /** Icon name or emoji representing this phase. */
  icon: string;
  /** Detailed description of what happens during this phase. */
  description: string;
  /** Typical timeframe relative to Election Day (e.g., "6–12 months before"). */
  timeframe: string;
  /** Array of actionable steps citizens can take during this phase. */
  citizenSteps: string[];
  /** Color theme class name for this phase's card. */
  colorKey: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'teal';
}

/**
 * Represents a frequently asked question about the election process.
 */
export interface ElectionFAQ {
  /** Unique identifier for the FAQ item. */
  id: string;
  /** The question text. */
  question: string;
  /** The concise answer text. */
  answer: string;
}

/**
 * Complete ordered list of election process phases.
 * Covers the full election lifecycle from candidate filing to certification.
 */
export const ELECTION_PHASES: ElectionPhase[] = [
  {
    id: 'candidate-filing',
    order: 1,
    title: 'Candidate Filing',
    icon: '📋',
    description:
      'Candidates officially declare their intention to run for office by submitting required paperwork and fees to the appropriate election authority.',
    timeframe: '6–12 months before Election Day',
    citizenSteps: [
      'Research candidates as they declare their candidacy.',
      'Follow local news for filing deadline announcements.',
      'Consider running for office yourself!',
    ],
    colorKey: 'blue',
  },
  {
    id: 'voter-registration',
    order: 2,
    title: 'Voter Registration',
    icon: '✍️',
    description:
      'Eligible citizens register to vote by submitting their information to election authorities. Many jurisdictions allow online, mail, or in-person registration.',
    timeframe: '15–30 days before Election Day',
    citizenSteps: [
      'Check if you are already registered.',
      'Register online, by mail, or in person at your local election office.',
      'Update your registration if you have moved.',
      'Help friends and family register.',
    ],
    colorKey: 'purple',
  },
  {
    id: 'early-voting',
    order: 3,
    title: 'Early & Mail-In Voting',
    icon: '📬',
    description:
      'Many jurisdictions provide options to vote before Election Day — either by dropping off a mail ballot or voting at an early voting center.',
    timeframe: '1–4 weeks before Election Day',
    citizenSteps: [
      'Request an absentee/mail-in ballot if eligible.',
      'Find your nearest early voting location.',
      'Vote early to avoid Election Day crowds.',
      'Track your mail ballot online.',
    ],
    colorKey: 'green',
  },
  {
    id: 'election-day',
    order: 4,
    title: 'Election Day',
    icon: '🗳️',
    description:
      'The primary day for in-person voting. Polls are open for a set window (commonly 6 AM – 8 PM). Voters in line before closing must be allowed to vote.',
    timeframe: 'Election Day',
    citizenSteps: [
      'Bring required ID to your polling place.',
      'Find your polling place using your voter registration card or the locator on this app.',
      'Know your rights — you cannot be turned away if you are in line before closing.',
      'Ask for a provisional ballot if there are any issues.',
    ],
    colorKey: 'orange',
  },
  {
    id: 'vote-counting',
    order: 5,
    title: 'Vote Counting & Tabulation',
    icon: '🔢',
    description:
      'Election officials count all ballots — in-person, early, and mail-in. Provisional ballots are verified separately. Results are preliminary until certification.',
    timeframe: 'Election Night → several weeks after',
    citizenSteps: [
      'Follow official election authority websites for results.',
      'Understand that mail-in ballot counting may take days.',
      'Avoid spreading unverified results on social media.',
    ],
    colorKey: 'red',
  },
  {
    id: 'certification',
    order: 6,
    title: 'Certification & Transition',
    icon: '✅',
    description:
      'Official election results are certified by the state or local election authority. Winners are declared and the transition of power or duties begins.',
    timeframe: '2–6 weeks after Election Day',
    citizenSteps: [
      'Monitor the official certification process.',
      'Report any concerns to election authorities through official channels.',
      'Engage with your elected officials after they take office.',
    ],
    colorKey: 'teal',
  },
];

/**
 * List of common election FAQs shown on the FAQ page.
 */
export const ELECTION_FAQS: ElectionFAQ[] = [
  {
    id: 'faq-1',
    question: 'Am I eligible to vote?',
    answer:
      'Eligibility varies by jurisdiction, but generally you must be a citizen, meet the minimum age requirement (usually 18), and be a resident of the jurisdiction where you are registering.',
  },
  {
    id: 'faq-2',
    question: 'How do I register to vote?',
    answer:
      'Most places offer online registration through the official election authority website, mail-in registration forms, and in-person registration at government offices.',
  },
  {
    id: 'faq-3',
    question: 'What ID do I need at the polls?',
    answer:
      'ID requirements vary by state/jurisdiction. Common accepted forms include a driver\'s license, passport, or voter registration card. Check your local election authority for specific requirements.',
  },
  {
    id: 'faq-4',
    question: 'Can I vote if I moved recently?',
    answer:
      'Yes, but you may need to update your voter registration. Some places allow same-day registration — check your local rules.',
  },
  {
    id: 'faq-5',
    question: 'What is a provisional ballot?',
    answer:
      'A provisional ballot is used when there is a question about a voter\'s eligibility at the polling place. It is set aside and counted after election officials verify the voter\'s registration.',
  },
];
