// Hunfly Content Script - Injects UI into Google Meet / Teams
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Overlay } from '../components/Overlay';

console.log('[Hunfly] Content script loaded on:', window.location.href);

// Wait for page to be ready
const injectOverlay = () => {
    // Check if already injected
    if (document.getElementById('hunfly-root')) {
        return;
    }

    // Create container with Shadow DOM for style isolation
    const container = document.createElement('div');
    container.id = 'hunfly-root';
    document.body.appendChild(container);

    const shadowRoot = container.attachShadow({ mode: 'open' });

    // Inject styles into shadow DOM
    const style = document.createElement('style');
    style.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    .hunfly-pill {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: rgba(30, 30, 30, 0.85);
      backdrop-filter: blur(12px);
      border-radius: 50px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .hunfly-pill:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(0,0,0,0.4);
    }
    .hunfly-status {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
    shadowRoot.appendChild(style);

    // Create React root inside shadow DOM
    const reactRoot = document.createElement('div');
    shadowRoot.appendChild(reactRoot);

    ReactDOM.createRoot(reactRoot).render(
        React.createElement(Overlay)
    );

    console.log('[Hunfly] Overlay injected successfully');
};

// Inject when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectOverlay);
} else {
    injectOverlay();
}
