import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './hooks/useToast.tsx';
import { ToastContainer } from './components/Toast.tsx';
import { PlanModeProvider } from './hooks/usePlanMode.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
        <PlanModeProvider>
            <App />
        </PlanModeProvider>
      <ToastContainer />
    </ToastProvider>
  </React.StrictMode>
);