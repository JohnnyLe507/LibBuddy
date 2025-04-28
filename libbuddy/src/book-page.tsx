import { useEffect, useState } from 'react';
import './book-page.css'
import './App.css'
import axios from 'axios'
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

function BookPage() {
    const { id } = useParams();
    const [book, setBook] = useState<any>(null);
    const [author, setAuthor] = useState<any>(null);
    const [authorId, setAuthorId] = useState<any>(null);
    const [showFullDescription, setShowFullDescription] = useState(false);

    const toggleDescription = () => setShowFullDescription(prev => !prev);

    const shortDescription = book?.description?.substring(0, 300)+"..." || "No description available";

    useEffect(() => {
        const fetchBookDetails = async () => {
          try {
            const response = await axios.get(`http://localhost:3000/book/${id}`);
            const result = response.data;
            setBook(result);
            fetchAuthorDetails(result);
          } catch (error) {
            console.error(error);
          } 
        };

        const fetchAuthorDetails = async (data: any) => {
          try {
            const authorRaw = data.authors?.[0]?.author?.key || data.authors?.[0]?.key;
            const authorIdTemp = authorRaw?.split('/').pop();
            setAuthorId(authorIdTemp);
            const response = await axios.get(`http://localhost:3000/authors/${authorIdTemp}`);
            setAuthor(response.data);
          } catch (error) {
            console.error(error);
          };
        }
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
            <h1>{book.title}</h1>
            {book.covers?.length > 0 && (
            <img
                src={`https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`}
                alt={`Cover of ${book.title}`}
            />
            )}
            <p>{author?.personal_name ? (
                <Link to={`/author/${authorId}`}>{author.personal_name}</Link>
            ) : (
                "No author available"
            )}
            </p>
            <h2>About this book</h2>
            <p className='description'>{showFullDescription ? book.description : shortDescription}
                {book.description.length > 300 && (
                    <button onClick={toggleDescription}>
                        {showFullDescription ? "See less" : "See more"}
                    </button>
                )}
            </p>
        </div>
        </>
    )
}

export default BookPage
