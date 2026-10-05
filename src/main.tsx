import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './pages/App';
import '@fontsource-variable/ibm-plex-sans';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
