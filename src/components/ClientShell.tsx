'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

/**
 * Client-only dynamic imports to prevent SSR hydration issues in Next.js 16/React 19.
 * This component is a 'Client Component' that handles the dynamic loading of 
 * components that use browser-only APIs (Firebase, LocalStorage, etc.)
 */
const DynamicNavbar = dynamic(() => import('./Navbar'), { ssr: false });
const DynamicChatbot = dynamic(() => import('./ElectionChatbot'), { ssr: false });

export function ClientNavbar() {
  return <DynamicNavbar />;
}

export function ClientChatbot() {
  return <DynamicChatbot />;
}

interface ClientOnlyProps {
  children: ReactNode;
}

/**
 * A wrapper that only renders its children on the client.
 */
export default function ClientOnly({ children }: ClientOnlyProps) {
  return <>{children}</>;
}
