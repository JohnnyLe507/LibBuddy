import { useEffect, useState } from 'react';
import './book-page.css'
import './App.css'
import axios from 'axios'
import { useParams } from 'react-router-dom';

function BookPage() {
    const { id } = useParams();
    const [book, setBook] = useState<any>(null);

    useEffect(() => {
        const fetchBookDetails = async () => {
          try {
            const response = await axios.get(`https://openlibrary.org/works/${id}.json`);
            setBook(response.data);
          } catch (error) {
            console.error(error);
          }
        };
    
        fetchBookDetails();
    }, [id]);

    if (!book) return <p>Loading...</p>;

    return (
        <>
        <nav className="navbar">
            <div className="logo">LibBuddy</div>
            <ul className="nav-links">
            <li><a href="#">Home</a></li>
            <li><a href="#">Features</a></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Contact</a></li>
            <button
            >Login</button>
            <button
            >Sign Up</button>
            </ul>
        </nav>
            <div className="book-page">
                <h1>Book Page</h1>
                <input type="text" name="name" placeholder="Username" /> <br/>
                <h2>{book.title}</h2>
                <p>{book.description?.value || "No description available"}</p>
            </div>
        </>
    )
}

export default BookPage
