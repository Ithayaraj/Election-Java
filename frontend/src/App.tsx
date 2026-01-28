import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import AboutPage from './pages/AboutPage';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route 
            path="admin/*" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          <Route path="login" element={<LoginPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;