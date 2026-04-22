/**
 * @file src/app/locator/page.tsx
 * @description The Polling Station Locator page.
 *              Uses HTML5 Geolocation + Google Maps JS SDK to find nearby voting centers.
 */

import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import PollingLocator from '@/components/PollingLocator';

/** SEO metadata for the locator page. */
export const metadata: Metadata = {
  title: 'Find Your Polling Station',
  description:
    'Use our interactive map to find your nearest polling station. We use geolocation to show voting centers near you with estimated distances.',
};

/**
 * LocatorPage renders the interactive polling station map.
 *
 * @returns {JSX.Element} The polling station locator page.
 */
export default function LocatorPage(): JSX.Element {
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <PollingLocator />
      </main>
    </>
  );
}
