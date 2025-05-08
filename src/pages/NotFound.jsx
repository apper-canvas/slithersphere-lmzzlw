import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import getIcon from '../utils/iconUtils';

const NotFound = () => {
  const AlertTriangle = getIcon("AlertTriangle");
  const HomeIcon = getIcon("Home");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="mb-8 w-24 h-24 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-accent"
      >
        <AlertTriangle size={48} />
      </motion.div>
      
      <h1 className="text-4xl md:text-5xl font-bold mb-2">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-surface-700 dark:text-surface-300">Page Not Found</h2>
      <p className="text-surface-600 dark:text-surface-400 mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      
      <Link 
        to="/"
        className="flex items-center gap-2 btn bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl transition-all"
      >
        <HomeIcon size={18} />
        <span>Back to Home</span>
      </Link>
    </motion.div>
  );
};

export default NotFound;