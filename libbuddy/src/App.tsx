import { useState } from 'react'
import videoFile from './assets/WalkingLibraryVideo.mp4'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    {/* Navigation Bar */}
    <nav className="navbar">
        <div className="logo">LibBuddy</div>
        <ul className="nav-links">
          <li><a href="#">Home</a></li>
          <li><a href="#">Features</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </nav>
      <div className="video-container">
      <video autoPlay loop muted playsInline className="background-video">
        <source src={videoFile} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
        {/* Search Bar in Center */}
        <div className="search-bar-container">
          <input type="text" placeholder="Search..." className="search-bar" />
          <button className="search-button">🔍</button>
        </div>
      </div>
      
    </>
  )
}

export default App
