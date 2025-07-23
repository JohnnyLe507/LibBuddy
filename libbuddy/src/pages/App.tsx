import { useState, useEffect, useRef } from 'react'
import videoFile from '../assets/WalkingLibraryVideo.mp4'
import '../styles/App.css'
import axios from 'axios'
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BestsellerCarousel from '../components/bestsellers-carousel';
const API_BASE = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // const [isLoading, setIsLoading] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const response = await axios.get(`${API_BASE}/search`, {
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
      // setIsLoading(true);

      axios
        .get(`${API_BASE}/search`, {
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
          // setIsLoading(false);
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
      <div className="video-container">
        <video autoPlay loop muted playsInline className="background-video">
          <source src={videoFile} type="video/mp4" />
        </video>
      </div>
      {/* Hero + Search Section */}
      <section className="relative z-20 mt-12 flex flex-col items-center px-4 space-y-6 text-center">
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
      </section>

      <section className="relative z-10 py-20 px-4 bg-gradient-to-b from-transparent via-gray-50 to-gray-400">
        <BestsellerCarousel />
      </section>

      <section className="relative w-full overflow-hidden bg-gradient-to-b from-gray-400 via-gray-200 to-white py-28 z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
          className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center px-6"
        >
          {/* Left - Image or Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="relative p-1 border border-white border-opacity-20 rounded-2xl w-full max-w-md shadow-xl bg-white/30 backdrop-blur-xl">
              <img
                src="/LibBuddyLogo-1.jpg"
                alt="Reading illustration"
                className="w-full h-auto object-cover rounded-xl border border-neutral-300"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-200 via-white/10 to-white/20 rounded-xl blur-2xl opacity-20"></div>
            </div>
          </motion.div>

          {/* Right - Text Content */}
          <div className="text-center md:text-left">
            <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 leading-snug mb-6">
              How LibBuddy Works
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Discover new reads, explore by genre or author, and curate your personal reading list. LibBuddy brings book lovers a simple and stunning way to stay organized and inspired.
            </p>

            <ul className="space-y-4 text-left text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-2xl">📚</span>
                <span><strong>Browse top books</strong> by category, popularity, or custom search.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">❤️</span>
                <span><strong>Save your favorites</strong> into a personalized reading list.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <span><strong>Get details instantly</strong> from Open Library and NYT.</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </section>

      <section className="bg-gradient-to-b from-white via-gray-200 to-gray-400">
        <div className="container px-4 mx-auto">
          <div className="flex flex-wrap items-center -mx-4 pb-20">
            <div className="w-full lg:w-1/2 px-4 mb-16 lg:mb-0">
              <div className="mb-6">
                <span className="text-sm text-neutral-400 font-medium">Why LibBuddy?</span>
              </div>
              <h1 className="max-w-2xl mb-6 text-4xl md:text-5xl lg:text-6xl font-medium leading-none text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Access thousands of books at your fingertips</h1>
              <p className="max-w-xl mb-10 text-lg leading-relaxed text-gray-600">LibBuddy helps you discover, track, and organize your favorite books with a seamless and beautiful reading experience. Whether you're a casual reader or a dedicated bookworm, we've got your next great read.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-neutral-950 bg-white hover:bg-neutral-100 rounded-full transition-all duration-200 hover:shadow-lg group" href="#">
                  Start Reading
                  <svg className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </a>
                <Link
                  to="/browse"
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white hover:text-white border border-neutral-700 hover:border-white hover:border-opacity-50 rounded-full transition-all duration-200"                >
                  Browse Catelog
                </Link>
              </div>
            </div>
            <div className="w-full lg:w-1/2 px-4">
              <div className="relative">
                <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-purple-400 to-purple-800 rounded-2xl filter blur-3xl"></div>
                <div className="p-1 border border-white border-opacity-20 rounded-2xl">
                  <img className="relative object-cover w-full rounded-xl border border-neutral-800" src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMzIzMzB8MHwxfHNlYXJjaHw4fHxsaWJyYXJ5fGVufDB8fHx8MTc0ODkzNjgyOHww&ixlib=rb-4.1.0&q=80&w=1080&w=850" alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-gray-400 via-gray-200 to-white py-24">
        <div className="container px-4 mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl leading-tight font-medium text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 font-heading mb-6">Featured Collections</h2>
              <p className="mb-2 text-lg leading-relaxed text-neutral-600 max-w-3xl mx-auto">
                Discover our curated collections spanning fiction, non-fiction, and reference materials to fuel every reader's curiosity.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-gray-100 to-gray-400 border border-gray-300 rounded-2xl p-6 hover:border-gray-400 transition-all duration-200 shadow-md">
                <div className="relative mb-6">
                  <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-purple-950 via-purple-900 to-purple-950 rounded-2xl filter blur-3xl"></div>
                  <div className="relative p-1 border border-white border-opacity-20 rounded-2xl w-full">
                    <img className="w-full h-48 object-cover rounded-xl border border-neutral-800" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMzIzMzB8MHwxfHNlYXJjaHw4fHxib29rc3xlbnwwfHx8fDE3NDg5MzY4Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080&w=850" alt="" />
                  </div>
                </div>
                <h4 className="text-3xl leading-tight font-medium text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 mb-4">Fiction</h4>
                <p className="mb-6 leading-relaxed text-neutral-600">Explore novels, short stories, and literary works from bestsellers and emerging voices alike.</p>
                <Link
                  to="/category/fiction"
                  className="inline-flex items-center text-lg font-semibold text-gray-800 hover:text-black border-b border-gray-500 hover:border-gray-800 transition-all duration-200"
                >
                  Browse Fiction
                </Link>
              </div>
              <div className="bg-gradient-to-br from-gray-100 to-gray-400 border border-gray-300 rounded-2xl p-6 hover:border-gray-400 transition-all duration-200 shadow-md">
                <div className="relative mb-6">
                  <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-purple-950 via-purple-900 to-purple-950 rounded-2xl filter blur-3xl"></div>
                  <div className="relative p-1 border border-white border-opacity-20 rounded-2xl w-full">
                    <img className="w-full h-48 object-cover rounded-xl border border-neutral-800" src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMzIzMzB8MHwxfHNlYXJjaHwxfHxib29rc3xlbnwwfHx8fDE3NDg5MzY4Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080&w=850" alt="" />
                  </div>
                </div>
                <h4 className="text-3xl leading-tight font-medium text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 mb-4">Non-Fiction</h4>
                <p className="mb-6 leading-relaxed text-neutral-600">Gain insights through biographies, self-help, history, and educational content.</p>
                <Link
                  to="/category/nonfiction"
                  className="inline-flex items-center text-lg font-semibold text-gray-800 hover:text-black border-b border-gray-500 hover:border-gray-800 transition-all duration-200"
                >
                  Browse Non-Fiction
                </Link>
              </div>
              <div className="bg-gradient-to-br from-gray-100 to-gray-400 border border-gray-300 rounded-2xl p-6 hover:border-gray-400 transition-all duration-200 shadow-md">
                <div className="relative mb-6">
                  <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-purple-950 via-purple-900 to-purple-950 rounded-2xl filter blur-3xl"></div>
                  <div className="relative p-1 border border-white border-opacity-20 rounded-2xl w-full">
                    <img className="w-full h-48 object-cover rounded-xl border border-neutral-800" src="https://images.unsplash.com/photo-1589998059171-988d887df646?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMzIzMzB8MHwxfHNlYXJjaHwxMHx8Ym9va3N8ZW58MHx8fHwxNzQ4OTM2ODI4fDA&ixlib=rb-4.1.0&q=80&w=1080&w=850" alt="" />
                  </div>
                </div>
                <h4 className="text-3xl leading-tight font-medium text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 mb-4">Fantasy</h4>
                <p className="mb-6 leading-relaxed text-neutral-600">Embark on epic adventures through magical realms, legendary heroes, and mythical creatures that ignite the imagination.</p>
                <Link
                  to="/category/fantasy"
                  className="inline-flex items-center text-lg font-semibold text-gray-800 hover:text-black border-b border-gray-500 hover:border-gray-800 transition-all duration-200"
                >
                  Browse Fantasy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>


      <footer className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 py-16 border-t border-neutral-800 ">
        <div className="container px-4 mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap justify-between items-center">
              <div className="w-full lg:w-1/3 mb-8 lg:mb-0">
                <a href="#" className="mb-4 inline-block">
                  {/* <img src="https://static.shuffle.dev/uploads/files/49/494a2fe29b2d7ad2ac37d870dbcb5bfcf251dd47/logos/logo-78d34ac57821d853aaf47e300463f4f0.png" alt="" className="h-8" /> */}
                </a>
                <p className="mb-4 text-neutral-400 leading-relaxed">Your gateway to unlimited reading. Access thousands of books, audiobooks, and research materials from anywhere in the world.</p>
              </div>
              <div className="w-full lg:w-2/3">
                <div className="flex flex-wrap justify-end">
                  <div className="w-full sm:w-auto mb-6 sm:mb-0 sm:mr-16">
                    <h6 className="text-lg leading-tight font-medium text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 mb-4">Library</h6>
                    <ul className="space-y-2">
                      <li><a className="text-sm text-neutral-400 hover:text-white transition-colors duration-200" href="#">Browse Books</a></li>
                      <li><a className="text-sm text-neutral-400 hover:text-white transition-colors duration-200" href="#">New Releases</a></li>
                      <li><a className="text-sm text-neutral-400 hover:text-white transition-colors duration-200" href="#">Bestsellers</a></li>
                      <li><a className="text-sm text-neutral-400 hover:text-white transition-colors duration-200" href="#">Audiobooks</a></li>
                    </ul>
                  </div>
                  <div className="w-full sm:w-auto mb-6 sm:mb-0 sm:mr-16">
                    <h6 className="text-lg leading-tight font-medium text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 mb-4">Account</h6>
                    <ul className="space-y-2">
                      <li><a className="text-sm text-neutral-400 hover:text-white transition-colors duration-200" href="#">Sign Up</a></li>
                      <li><a className="text-sm text-neutral-400 hover:text-white transition-colors duration-200" href="#">Login</a></li>
                      <li><a className="text-sm text-neutral-400 hover:text-white transition-colors duration-200" href="#">My Library</a></li>
                      <li><a className="text-sm text-neutral-400 hover:text-white transition-colors duration-200" href="#">Reading History</a></li>
                    </ul>
                  </div>
                  <div className="w-full sm:w-auto">
                    <h6 className="text-lg leading-tight font-medium text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 mb-4">Support</h6>
                    <ul className="space-y-2">
                      <li><a className="text-sm text-neutral-400 hover:text-white transition-colors duration-200" href="#">Help Center</a></li>
                      <li><a className="text-sm text-neutral-400 hover:text-white transition-colors duration-200" href="#">Contact Us</a></li>
                      <li><a className="text-sm text-neutral-400 hover:text-white transition-colors duration-200" href="#">Privacy Policy</a></li>
                      <li><a className="text-sm text-neutral-400 hover:text-white transition-colors duration-200" href="#">Terms of Service</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-neutral-800 text-center">
              <p className="text-sm text-neutral-500">© 2025 LibBuddy. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}


export default App
