import { useState } from 'react'
import videoFile from './assets/WalkingLibraryVideo.mp4'
import './App.css'
import axios from 'axios'
import { Link } from 'react-router-dom';
// import jwt_decode from 'jwt-decode'

function App() {
  const [searchResults, setSearchResults] = useState<any[]>([])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const response = await axios.get('http://localhost:3000/search', {
        params: { q: formData.get('query') as string },
      });
      // console.log("Search Results:", response.data);
      setSearchResults(response.data);
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      {/* Video Background */}
      <div className="video-container">
        <video autoPlay loop muted playsInline className="background-video">
          <source src={videoFile} type="video/mp4" />
        </video>
        {/* Search Bar in Center */}
        <div className="search-bar-container">
          <form onSubmit={handleSearch}>
            <input type="text" name="query" placeholder="Search..." className="search-bar" />
            <button type="submit" className="search-button">🔍</button>
          </form>
        </div>
        {searchResults.length > 0 ? (
          <ul className="modal">
            {searchResults.map((book, index) => (
              <li key={index}>
                <Link to={`/book${book.key}`}>{book.title}</Link>
                {/* <p>{book.title}</p> */}
              </li>
            ))}
          </ul>
        ) : (
          <p>No results found.</p>
        )}
      </div>

    </>
  )
}


export default App
