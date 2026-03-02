import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Safe boot: catch any module-level crashes
const root = document.getElementById('root')!;

function showError(err: any) {
  root.innerHTML = `
    <div style="color:white;padding:40px;font-family:monospace;background:#1a0000;min-height:100vh">
      <h1 style="color:#ff4444">SimBot Failed to Load</h1>
      <p style="color:#ffaaaa">${err?.message ?? err}</p>
      <pre style="color:#ff8888;white-space:pre-wrap;max-height:60vh;overflow:auto;font-size:12px">${err?.stack ?? 'no stack trace'}</pre>
      <button onclick="localStorage.clear();sessionStorage.clear();location.reload()" 
        style="margin-top:20px;padding:12px 24px;background:#ff4444;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px">
        Clear All Data &amp; Reload
      </button>
    </div>`;
}

import('./App')
  .then(({ default: App }) => {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  })
  .catch((err) => {
    console.error('Failed to load App:', err);
    showError(err);
  });

// Register service worker for offline PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
