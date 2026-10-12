// Ensure Fast Refresh preamble flags are set
if (typeof window !== 'undefined') {
  (window as any).__vite_plugin_react_preamble_installed__ = true;
  if (!(window as any).$RefreshReg$) (window as any).$RefreshReg$ = () => {};
  if (!(window as any).$RefreshSig$) (window as any).$RefreshSig$ = () => (type: any) => type;
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
