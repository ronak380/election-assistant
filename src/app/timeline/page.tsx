/**
 * @file src/app/timeline/page.tsx
 * @description The Election Timeline page.
 *              Renders all election process phases as an interactive animated timeline.
 */

import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import ElectionTimeline from '@/components/ElectionTimeline';

/** SEO metadata for the timeline page. */
export const metadata: Metadata = {
  title: 'Election Timeline',
  description:
    'Explore the complete election process step by step — from candidate filing and voter registration to vote counting and certification.',
};

/**
 * TimelinePage renders the interactive election process timeline.
 *
 * @returns {JSX.Element} The election timeline page.
 */
export default function TimelinePage(): JSX.Element {
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <ElectionTimeline />
      </main>
    </>
  );
}
