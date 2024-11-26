import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './components/App';
import './styles/global.css';

document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('root');
  if (!container) throw new Error('#root element not found');
  
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    container
  );
});
