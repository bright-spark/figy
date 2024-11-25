import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';
import './styles/global.css';

document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('root');
  if (!container) throw new Error('#root element not found');
  
  const root = createRoot(container);
  root.render(<App />);
});
