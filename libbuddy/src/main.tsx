import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import Home from './home.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { UIProvider } from './contexts/UIContext.tsx'
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
          <UIProvider>
            <Home />
            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
