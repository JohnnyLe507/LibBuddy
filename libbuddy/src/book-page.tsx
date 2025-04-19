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
            const response = await axios.get(`http://localhost:3000/book/${id}`);
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
                <h2>{book.title}</h2>
                <p>{book.author || "No author available"}</p>
                {book.covers?.length > 0 && (
                <img
                    src={`https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`}
                    alt={`Cover of ${book.title}`}
                />
                )}
                <p>{book.description || "No description available"}</p>
            </div>
        </>
    )
}

export default BookPage
