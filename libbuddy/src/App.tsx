import { useState, useEffect, useRef } from 'react'
import videoFile from './assets/WalkingLibraryVideo.mp4'
import './App.css'
import axios from 'axios'
import { Link } from 'react-router-dom';
// import jwt_decode from 'jwt-decode'

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
      <div className="video-container">
        <video autoPlay loop muted playsInline className="background-video">
          <source src={videoFile} type="video/mp4" />
        </video>
        <div className="relative z-20">

        </div>
        {/* Search Bar in Center */}
        <div ref={dropdownRef} className="search-bar-container relative z-20">
          <form onSubmit={handleSearch}>
            <input type="text" name="query" placeholder="Search..." value={query} onChange={(e) => {
              setQuery(e.target.value);
              setIsDropdownVisible(true);
            }} className="search-bar" />
            <button type="submit" className="search-button">🔍</button>
          </form>
          {isLoading && <div className="ml-2 text-gray-600">Loading...</div>}
          {searchResults.length > 0 && isDropdownVisible &&(
            <ul
              className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-96 
                         bg-white border border-gray-300 rounded-lg shadow-lg z-50 
                         max-h-64 overflow-y-auto 
                         transition-all duration-200 ease-out animate-fade-in-down"
            >
              {searchResults.map((book, index) => (
                <li key={index} className="flex items-center space-x-4 border-b last:border-b-0 px-4 py-2 hover:bg-blue-100 transition duration-150">
                  <img
                    src={`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`}
                    alt={book.title}
                    className="w-10 h-16 object-cover rounded shadow-sm"
                    onError={(e) => {
                        e.currentTarget.src = "/fallback-image.jpg";
                        e.currentTarget.alt = "Cover not available";
                    }}
                  />
                  <Link
                    to={`/book${book.key}`}
                    className="text-sm font-medium"
                  >
                    {book.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}


export default App
