import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import Home from './home.tsx'
import { AuthProvider } from './AuthContext.tsx'
import { UIProvider } from './UIContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
          <UIProvider>
            <Home />
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
