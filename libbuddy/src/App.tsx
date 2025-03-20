import { useState } from 'react'
import videoFile from './assets/WalkingLibraryVideo.mp4'
import './App.css'
import axios from 'axios'

function App() {
  const [count, setCount] = useState(0)
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [isRegisterVisible, setIsRegisterVisible] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    // alert('Login')
    // setIsLoginVisible(false)
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const response = await axios.post('http://localhost:3000/login', {
        name: formData.get('name'),
        password: formData.get('password')
      });
      console.log("Token:", response.data.token);
    } catch (error) {
      console.error(error)
    }
  }
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const response = await axios.post('http://localhost:3000/register', {
        name: formData.get('name'),
        password: formData.get('password')
      });
      console.log("Token:", response.data.token);
    } catch (error) {
      console.error(error)
    }
  }

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
          <button
            onClick={() => setIsLoginVisible(true)}
          >Login</button>
          {/* <button
            onClick={() => setIsBoxVisible(false)}
          >Logout</button> */}
          <button
            onClick={() => setIsRegisterVisible(true)}
          >Sign Up</button>
        </ul>
      </nav>
      
      {isLoginVisible && (<div className="modal">
          <main>Log in to LibBuddy</main> <br/>
          <form onSubmit={handleLogin}>
            <label>Username: </label>
            <input type="text" name="name" placeholder="Username" /> <br/>
            <label>Password: </label>
            <input type="password" name="password" placeholder="Password" /> <br/>

            <button type="button">Forgot password?</button> <br/>
            <button type="submit">Log in</button> <br/>
            <button type="button" onClick={() => { setIsLoginVisible(false); setIsRegisterVisible(true); }}>Don't have an account? Sign up</button>
          </form>
        </div>)}
        {isRegisterVisible && (<div className="modal">
          <main>Register to LibBuddy</main> <br/>
          <form onSubmit={handleRegister}>
            <label>Username: </label>
            <input type="text" name="name" placeholder="Username" /> <br/>
            <label>Password: </label>
            <input type="password" name="password" placeholder="Password" /> <br/>
            <label>Confirm Password: </label>
            <input type="password" name="password" placeholder="Confirm Password" /> <br/>
            <button type="submit">Sign up</button> <br/>
            <button type="button" onClick={() => { setIsLoginVisible(true); setIsRegisterVisible(false); }}>Already have an account? Log in</button>

          </form>
        </div>)}
      {/* Video Background */}
      <div className="video-container">
      <video autoPlay loop muted playsInline className="background-video">
        <source src={videoFile} type="video/mp4" />
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
