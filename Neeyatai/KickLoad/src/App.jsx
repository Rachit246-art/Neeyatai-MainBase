import React from "react";
import { BrowserRouter } from 'react-router-dom';
import AppRouter from "./AppRouter";

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app-container">
        <AppRouter />
      </div>
      <style>{`
        .app-container {
          min-height: 100vh;
          width: 100%;
        }
        
        /* Page transition animations */
        .page-enter {
          opacity: 0;
          transform: translateY(20px);
        }
        
        .page-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 300ms ease-in-out, transform 300ms ease-in-out;
        }
        
        .page-exit {
          opacity: 1;
          transform: translateY(0);
        }
        
        .page-exit-active {
          opacity: 0;
          transform: translateY(-20px);
          transition: opacity 200ms ease-in-out, transform 200ms ease-in-out;
        }
        
        /* Smooth transitions for all route changes */
        .route-transition {
          animation: fadeInUp 0.4s ease-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Enhanced page loading animation */
        .page-loading {
          opacity: 0;
          transform: scale(0.95);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .page-loaded {
          opacity: 1;
          transform: scale(1);
        }
        
        /* Smooth sidebar and header transitions */
        .sidebar-transition {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                      opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .header-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Card and component hover transitions */
        .card-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-transition:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        }
        
        /* Button transition effects */
        .btn-transition {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .btn-transition:hover {
          transform: translateY(-2px);
        }
        
        .btn-transition:active {
          transform: translateY(0);
        }
        
        /* Input field transitions */
        .input-transition {
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        
        .input-transition:focus {
          transform: translateY(-1px);
        }
        
        /* Modal and overlay transitions */
        .modal-transition {
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .modal-enter {
          opacity: 0;
          transform: scale(0.9);
        }
        
        .modal-enter-active {
          opacity: 1;
          transform: scale(1);
        }
        
        .modal-exit {
          opacity: 1;
          transform: scale(1);
        }
        
        .modal-exit-active {
          opacity: 0;
          transform: scale(0.9);
        }
        
        /* Loading spinner animation */
        .spinner-transition {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Responsive transitions */
        @media (max-width: 768px) {
          .page-enter {
            transform: translateY(10px);
          }
          
          .page-exit-active {
            transform: translateY(-10px);
          }
          
          .route-transition {
            animation: fadeInUp 0.3s ease-out;
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(15px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
      `}</style>
    </BrowserRouter>
  );
}

export default App;
