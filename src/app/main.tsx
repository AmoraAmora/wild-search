import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { reloadOnStaleChunk } from './lib/reload-on-stale-chunk';

reloadOnStaleChunk();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
