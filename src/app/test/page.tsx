/**
 * @file src/app/test/page.tsx
 * @description Minimal test page to verify routing and basic rendering.
 */

export default function TestPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>System Test</h1>
      <p>If you can see this, basic Next.js routing and rendering is working.</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}
