import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function NotFound() {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center p-4"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
      <p className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</p>
      <p className="text-gray-600 mb-6">The page you’re looking for doesn’t exist or has been moved.</p>
      <Link
        to="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go to Homepage
      </Link>
    </motion.div>
  );
}

export default NotFound;
