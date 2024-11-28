import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';
import './styles/global.css';

// Wait for DOM content to be loaded
const init = () => {
  const container = document.getElementById('root');
  if (!container) {
    console.error('#root element not found');
    return;
  }

  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to render app:', error);
  }
};

// Ensure DOM is loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
