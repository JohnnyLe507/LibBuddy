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
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="text-2xl font-bold text-blue-600">
              <Link to="/">LibBuddy</Link>
            </div>

            {/* Navigation Links */}
            <ul className="flex gap-6 items-center text-gray-700 font-medium">
              <li><Link to="/" className="hover:text-blue-600 transition">Home</Link></li>
              <li><a href="#" className="hover:text-blue-600 transition">Genres</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Trending</a></li>
              <li><Link to="/reading-list" className="hover:text-blue-600 transition">Reading List</Link></li>

              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => setIsLoginVisible(true)}
                    className="bg-transparent border border-blue-600 text-blue-600 px-4 py-1 rounded hover:bg-blue-50 transition"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setIsRegisterVisible(true)}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <img
                    src="/fallback-image.jpg"
                    alt="Profile"
                    className="w-8 h-8 rounded-full cursor-pointer"
                    onClick={handleProfileClick}
                  />
                  {isDropdownVisible && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {isLoginVisible && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 --animate-slide-in-up"
          onClick={() => setIsLoginVisible(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative"
            style={{
              animation: 'var(--animate-slide-in-up)',
              willChange: 'opacity, transform',
            }}
            onClick={(e) => e.stopPropagation()} // Prevent background click from closing
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setIsLoginVisible(false)}
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center">Log in to LibBuddy</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const username = formData.get("name")?.toString().trim();
                const password = formData.get("password")?.toString();

                if (!username || !password) {
                  alert("Please fill out all fields.");
                  return;
                }

                handleLogin(e); // Call actual login logic
              }}
              className="space-y-4"
            >
              <div>
                <label className="block mb-1 font-medium text-sm">Username</label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Username"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-sm">Password</label>
                <input
                  type="password"
                  name="password"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Password"
                  required
                />
              </div>
              <div className="text-right text-sm">
                <button type="button" className="text-blue-600 hover:underline">
                  Forgot password?
                </button>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
              >
                Log in
              </button>
              <button
                type="button"
                className="w-full text-sm text-center text-gray-600 hover:underline"
                onClick={() => {
                  setIsLoginVisible(false);
                  setIsRegisterVisible(true);
                }}
              >
                Don’t have an account? Sign up
              </button>
            </form>
          </div>
        </div>
      )}

      {isRegisterVisible && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setIsRegisterVisible(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative"
            style={{ animation: 'var(--animate-slide-in-up)' }}
            onClick={(e) => e.stopPropagation()} // Prevent background click from closing
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setIsRegisterVisible(false)}
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center">Register to LibBuddy</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const username = formData.get("name")?.toString().trim();
                const password = formData.get("password")?.toString();
                const confirmPassword = formData.get("confirmPassword")?.toString();

                if (!username || !password || !confirmPassword) {
                  alert("Please fill out all fields.");
                  return;
                }

                if (password !== confirmPassword) {
                  alert("Passwords do not match.");
                  return;
                }

                handleRegister(e); // Call actual register logic
              }}
              className="space-y-4"
            >
              <div>
                <label className="block mb-1 font-medium text-sm">Username</label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Username"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-sm">Password</label>
                <input
                  type="password"
                  name="password"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Password"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-sm">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm Password"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
              >
                Sign up
              </button>
              <button
                type="button"
                className="w-full text-sm text-center text-gray-600 hover:underline"
                onClick={() => {
                  setIsRegisterVisible(false);
                  setIsLoginVisible(true);
                }}
              >
                Already have an account? Log in
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}