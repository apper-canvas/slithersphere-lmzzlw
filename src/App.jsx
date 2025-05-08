import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import getIcon from './utils/iconUtils';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    toast.info(`${!isDarkMode ? 'Dark' : 'Light'} mode activated!`, {
      icon: !isDarkMode ? "🌙" : "☀️",
      position: "bottom-right",
      autoClose: 2000
    });
  };

  const SunIcon = getIcon("Sun");
  const MoonIcon = getIcon("Moon");
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <span className="text-primary">Slither</span>
            <span className="text-secondary">Sphere</span>
          </h1>
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: isDarkMode ? 180 : 0 }}
              transition={{ duration: 0.5 }}
              className="text-surface-700 dark:text-surface-300"
            >
              {isDarkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </motion.div>
          </button>
        </div>
      </header>
      
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      
      <ToastContainer 
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
        toastClassName="rounded-xl shadow-soft"
      />
    </div>
  );
}

export default App;