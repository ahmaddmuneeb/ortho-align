import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthBootstrap } from './components/AuthBootstrap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { store } from './store';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <AuthBootstrap>
            <App />
            <Toaster position="top-right" richColors closeButton />
          </AuthBootstrap>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);
