/**
 * @file src/components/ConfigGuard.tsx
 * @description Production safety component that verifies all required environment 
 *              variables are present at runtime. If missing, it renders a clear 
 *              diagnostic error rather than letting the app crash silently.
 */

'use client';

import { useEffect, useState } from 'react';

/** Required public environment variables for the client. */
const REQUIRED_KEYS = [
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
];

interface ConfigGuardProps {
  children: React.ReactNode;
}

/**
 * ConfigGuard — Wraps the application to ensure it is configured correctly.
 * 
 * @param {ConfigGuardProps} props - Child components to render if config is valid.
 * @returns {JSX.Element} The children or a fatal error screen.
 */
export default function ConfigGuard({ children }: ConfigGuardProps) {
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const missing: string[] = [];
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) missing.push('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
    if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    
    setMissingKeys(missing);
    setIsReady(true);
  }, []);

  if (!isReady) return null; // Wait for mount to check env safely

  if (missingKeys.length > 0) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fef2f2',
        color: '#991b1b',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️ Configuration Error</h1>
        <p style={{ maxWidth: '600px', lineHeight: '1.6' }}>
          The application is missing critical environment variables. Please ensure the following keys are set in your 
          Google Cloud Run service configuration or local .env file:
        </p>
        <ul style={{ 
          marginTop: '1rem', 
          textAlign: 'left', 
          background: 'white', 
          padding: '1.5rem 2rem', 
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
          {missingKeys.map(key => <li key={key} style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{key}</li>)}
        </ul>
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>
          Check <strong>cloudbuild.yaml</strong> and your <strong>Cloud Run Trigger Substitutions</strong>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
