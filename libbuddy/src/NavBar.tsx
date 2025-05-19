import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from './AuthContext';
import './NavBar.css';
import { useUI } from './UIContext';

export default function NavBar() {
  const { isLoginVisible, setIsLoginVisible } = useUI();
  const [isRegisterVisible, setIsRegisterVisible] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const navigate = useNavigate();
  const { login, logout, isLoggedIn } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
      }
    };
    if (isDropdownVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownVisible]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    // alert('Login')
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const response = await axios.post('http://localhost:3000/login', {
        name: formData.get('name'),
        password: formData.get('password')
      });
      console.log("Token:", response.data.accesstoken);
      // localStorage.setItem('accessToken', response.data.accesstoken);
      // localStorage.setItem('refreshToken', response.data.refreshtoken);
      login(response.data.accesstoken, response.data.refreshtoken);
      setIsLoginVisible(false);
      // navigate('/');
      // window.location.reload(); 
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

  const handleProfileClick = () => {
    setIsDropdownVisible(prev => !prev);
  };

  const handleLogout = () => {
    logout();
    setIsDropdownVisible(false);
    navigate("/"); // Redirect to homepage or login page
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo">LibBuddy</div>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><a href="#">Features</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Contact</a></li>
          {!isLoggedIn ? (
            <>
              <button
                onClick={() => setIsLoginVisible(true)}
              >Login</button>
              <button
                onClick={() => setIsRegisterVisible(true)}
              >Sign Up</button>
            </>
          ) : (
            <>
              {/* Profile icon and dropdown */}
              <div className="profile-wrapper" ref={dropdownRef}>
                <img src="/fallback-image.jpg" alt="Profile" className="profile-icon" onClick={handleProfileClick}/>
                {isDropdownVisible && (
                  <div className="dropdown-menu">
                    <button onClick={handleLogout}>Sign Out</button>
                  </div>
                )}
              </div>
            </>
          )}
        </ul>
      </nav>

      {isLoginVisible && (<div className="modal">
        <button className="close-btn" onClick={() => setIsLoginVisible(false)}>X</button>
        <main>Log in to LibBuddy</main> <br />
        <form onSubmit={handleLogin}>
          <label>Username: </label>
          <input type="text" name="name" placeholder="Username" /> <br />
          <label>Password: </label>
          <input type="password" name="password" placeholder="Password" /> <br />

          <button type="button">Forgot password?</button> <br />
          <button type="submit">Log in</button> <br />
          <button type="button" onClick={() => { setIsLoginVisible(false); setIsRegisterVisible(true); }}>Don't have an account? Sign up</button>
        </form>
      </div>)}

      {isRegisterVisible && (<div className="modal">
        <button className="close-btn" onClick={() => setIsRegisterVisible(false)}>X</button>
        <main>Register to LibBuddy</main> <br />
        <form onSubmit={handleRegister}>
          <label>Username: </label>
          <input type="text" name="name" placeholder="Username" /> <br />
          <label>Password: </label>
          <input type="password" name="password" placeholder="Password" /> <br />
          <label>Confirm Password: </label>
          <input type="password" name="password" placeholder="Confirm Password" /> <br />
          <button type="submit">Sign up</button> <br />
          <button type="button" onClick={() => { setIsLoginVisible(true); setIsRegisterVisible(false); }}>Already have an account? Log in</button>

        </form>
      </div>)}
    </>
  )
}