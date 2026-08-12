import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'Poppins, sans-serif',
              fontSize: '14px',
              borderRadius: '10px',
              border: '1px solid #E7E5E4',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#16A34A', secondary: '#F0FDF4' } },
            error: { iconTheme: { primary: '#DC2626', secondary: '#FEF2F2' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
