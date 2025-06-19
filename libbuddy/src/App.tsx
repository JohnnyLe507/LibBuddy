import { useState, useEffect, useRef } from 'react'
import videoFile from './assets/WalkingLibraryVideo.mp4'
import './App.css'
import axios from 'axios'
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BestsellerCarousel from './bestsellers-carousel';

function App() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const response = await axios.get('http://localhost:3000/search', {
        params: { q: formData.get('query') as string },
      });
      // console.log("Search Results:", response.data);
      setSearchResults(response.data);
      setIsDropdownVisible(true);
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Debounce logic: wait before triggering the search
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      const controller = new AbortController();
      setIsLoading(true);

      axios
        .get('http://localhost:3000/search', {
          params: { q: query },
          signal: controller.signal,
        })
        .then(res => {
          setSearchResults(res.data);
        })
        .catch(err => {
          if (axios.isCancel(err)) {
            console.log('Request cancelled');
          } else {
            console.error(err);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });

      return () => {
        controller.abort();
      };
    }, 300); // 300ms debounce

    // Cleanup on unmount or next effect run
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Video Background */}
      <div className="video-container relative">
        <video autoPlay loop muted playsInline className="background-video">
          <source src={videoFile} type="video/mp4" />
        </video>
      </div>
      {/* Hero + Search Section */}
      <div className="relative z-20 mt-12 flex flex-col items-center px-4 space-y-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
          Discover Your Next Great Read
        </h1>
        <p className="text-lg md:text-xl text-gray-200 drop-shadow-md">
          Search millions of books by title, genre, or author
        </p>

        <div ref={dropdownRef} className="relative flex flex-col items-center w-full max-w-md mx-auto">
          <form
            onSubmit={handleSearch}
            className="flex items-center w-full px-4 py-2 rounded-full shadow-lg backdrop-blur-md bg-white/30 border border-white/20"
          >
            <input
              type="text"
              name="query"
              placeholder="Search..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsDropdownVisible(true);
              }}
              className="flex-1 bg-transparent text-white placeholder-white/70 outline-none px-2 py-1 text-sm"
            />
            <button
              type="submit"
              className="text-white hover:text-blue-200 text-lg"
            >
              🔍
            </button>
          </form>

          {/* Dropdown - must be inside this relative container */}
          <AnimatePresence>
            {searchResults.length > 0 && isDropdownVisible && (
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
              >
                {searchResults.map((book, index) => (
                  <li
                    key={index}
                    className="flex items-center space-x-4 border-b last:border-b-0 px-4 py-2 hover:bg-blue-100 transition duration-150"
                  >
                    <img
                      src={
                        book.cover_i
                          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`
                          : "/fallback-image.jpg"
                      }
                      alt={book.title || "Book cover"}
                      className="w-10 h-16 object-cover rounded shadow-sm"
                      onError={(e) => {
                        e.currentTarget.src = "/fallback-image.jpg";
                        e.currentTarget.alt = "Cover not available";
                      }}
                    />
                    <Link to={`/book${book.key}`} className="text-sm font-medium">
                      {book.title}
                    </Link>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
      <section className="relative z-10 py-20 px-4">
        <BestsellerCarousel />
      </section>
    </>
  )
}


export default App
