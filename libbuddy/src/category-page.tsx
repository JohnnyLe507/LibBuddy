import { useEffect, useState } from 'react';
import './category-page.css'
import './App.css'
import axios from 'axios'
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

function CategoryPage() {
    const { subject } = useParams();
    const [books, setBooks] = useState<any[]>([]);
    const [totalBooks, setTotalBooks] = useState<number>(0);
    const [startIndex, setStartIndex] = useState(0);
    const visibleCount = 6;

    useEffect(() => {
        const fetchBooksByCategory = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/subjects/${subject}`);
                const result = response.data;
                setBooks(result.works);
                setTotalBooks(result.work_count);
                // console.log(result.work_count);
                // setCategory(result.name);
            } catch (error) {
                console.error(error);
            }
        };
        fetchBooksByCategory();
    }, [subject]);

    const handleNext = () => {
        if (startIndex + visibleCount < books.length) {
          setStartIndex(startIndex + visibleCount);
        }
      };
    
      const handlePrev = () => {
        if (startIndex - visibleCount >= 0) {
          setStartIndex(startIndex - visibleCount);
        }
      };
    
      const visibleBooks = books.slice(startIndex, startIndex + visibleCount);

    return (
        <>
        <nav className="navbar">
            <div className="logo">LibBuddy</div>
            <ul className="nav-links">
                <li><Link to="/">Home</Link></li>
                <li><a href="#">Features</a></li>
                <li><a href="#">About</a></li>
                <li><a href="#">Contact</a></li>
                <button>Login</button>
                <button>Sign Up</button>
            </ul>
        </nav>
        <div className="category-page">
            <h1>{subject || "No Category Name Available"}</h1>
            <h2>Results: {totalBooks} works</h2>
            <div className="carousel-wrapper">
                <button onClick={handlePrev} disabled={startIndex === 0}>&larr;</button>
                <div className="carousel">
                    {visibleBooks.map((book) => (
                    <div className="book-card" key={book.key}>
                        <img
                        src={`https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`}
                        alt={book.title}
                        />
                        <p>{book.title}</p>
                    </div>
                    ))}
                </div>
                <button onClick={handleNext} disabled={startIndex + visibleCount >= books.length}>&rarr;</button>
            </div>
        </div>
        </>
    );
}

export default CategoryPage;