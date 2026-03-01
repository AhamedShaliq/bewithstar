import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminPortal from './pages/AdminPortal';
import AdminLogin from './pages/AdminLogin';
import Discover from './pages/Discover';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppLoader from './components/AppLoader';
import ChatAssistant from './components/ChatAssistant';
import { useAnalytics } from './hooks/useAnalytics';

const ChatWrapper = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) return null;
  return <ChatAssistant />;
};

const AnalyticsWrapper = () => {
  useAnalytics();
  return null;
};

import { API_BASE_URL } from './utils/apiConfig';
import axios from 'axios';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Real-time loading logic: Wait for essential data before hiding splash screen
    const fetchInitialData = async () => {
      try {
        await Promise.allSettled([
          axios.get(`${API_BASE_URL}/api/public/settings`),
          axios.get(`${API_BASE_URL}/api/stars`)
        ]);
        // Slight buffer for smooth transition after data is ready
        setTimeout(() => setIsLoading(false), 300);
      } catch (err) {
        console.error('Initial load failed', err);
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-textPrimary overflow-hidden">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <AppLoader key="loader" />
        ) : (
          <motion.div
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="w-full h-full relative"
          >
            <Router>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/admin" element={<AdminPortal />} />
                <Route path="/admin/login" element={<AdminLogin />} />
              </Routes>
              <AnalyticsWrapper />
              <ChatWrapper />
            </Router>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
