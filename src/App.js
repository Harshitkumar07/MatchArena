import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { routes } from './config/routes';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { isFirebaseConfigured } from './services/firebase/firebaseClient';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Configuration check component
const ConfigCheck = ({ children }) => {
  if (!isFirebaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold mb-4 text-red-500">Configuration Required</h1>
          <p className="mb-4">Firebase is not configured. Please:</p>
          <ol className="text-left max-w-md mx-auto space-y-2">
            <li>1. Copy .env.example to .env</li>
            <li>2. Add your Firebase configuration</li>
            <li>3. Restart the development server</li>
          </ol>
        </div>
      </div>
    );
  }
  return children;
};

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ConfigCheck>
          <AuthProvider>
            <ThemeProvider>
              <ErrorBoundary>
                <Router>
                  <Layout>
                    <Suspense fallback={<LoadingSpinner fullScreen />}>
                      <Routes>
                        {routes.map((route) => {
                          const Element = route.element;
                          
                          // Handle protected routes
                          if (route.requireAuth) {
                            return (
                              <Route
                                key={route.path}
                                path={route.path}
                                element={
                                  <ProtectedRoute requireRole={route.requireRole}>
                                    <Element />
                                  </ProtectedRoute>
                                }
                              />
                            );
                          }
                          
                          // Public routes
                          return (
                            <Route
                              key={route.path}
                              path={route.path}
                              element={<Element />}
                            />
                          );
                        })}
                        
                        {/* Fallback redirect */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                  </Layout>
                </Router>
              </ErrorBoundary>
              
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              
              {/* React Query Devtools - only in development */}
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </ThemeProvider>
          </AuthProvider>
        </ConfigCheck>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
