import { useEffect, useState } from 'react';
import './book-page.css'
import './App.css'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';

function BookPage() {
    const { id } = useParams() as { id: string };
    const [book, setBook] = useState<any>(null);
    const [author, setAuthor] = useState<any>(null);
    const [authorId, setAuthorId] = useState<any>(null);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const { isLoginVisible, setIsLoginVisible } = useUI();
    const { isLoggedIn } = useAuth();
    const [readingList, setReadingList] = useState<string[]>([]);
    const navigate = useNavigate();

    const toggleDescription = () => setShowFullDescription(prev => !prev);

    const shortDescription = book?.description?.substring(0, 300)+"..." || "No description available";

    useEffect(() => {
        const fetchBookDetails = async () => {
          try {
            const response = await axios.get(`http://localhost:3000/works/${id}`);
            const result = response.data;
            if (!response.data) {
              navigate('*');
            }
            setBook(result);
            fetchAuthorDetails(result);
          } catch (error) {
            console.error(error);
            navigate('*');
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

      const fetchReadingList = async () => {
        const token = localStorage.getItem('accesstoken');
        if (!token) return;

        try {
          const res = await axios.get('http://localhost:3000/reading-list', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setReadingList(res.data.map((item: any) => item.book_id)); // adjust if needed
        } catch (err) {
          console.error('Failed to fetch reading list:', err);
        }
      };

      if (id) {
        fetchBookDetails();
        fetchReadingList();
      } else {
        navigate('*');
      }
    }, [id]);

    const handleAddToReadingList = async () => {
      if (!isLoggedIn) {
        setIsLoginVisible(true); // Show login popup if not logged in
        return;
      }
  
      try {
        const token = localStorage.getItem('accesstoken');
        await axios.post(
          'http://localhost:3000/add-to-reading-list',
          { bookId: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReadingList(prev => [...prev, id]);
        alert('Book added to your reading list!');
      } catch (error: any) {
        if (error.response && error.response.status === 409) {
          alert('This book is already in your reading list.');
        } else {
          console.error(error);
          alert('Failed to add book to reading list.');
        }
      };
    };

  const handleRemove = async () => {
    try {
      const token = localStorage.getItem('accesstoken');
      await axios.delete(`http://localhost:3000/reading-list/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReadingList(prev => prev.filter(b => b !== id));
      alert('Book removed from your reading list!');
    } catch (error) {
      console.error(error);
      alert('Failed to remove.');
    }
  };

    if (!book) return <p>Loading...</p>;

    return (
        <>
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
            {readingList.includes(id) ? (
              <button onClick={handleRemove}>Remove</button>
            ) : (
              <button onClick={handleAddToReadingList}>Add</button>
            )}
            <h2>About this book</h2>
            <p className='description'>{showFullDescription ? book.description : shortDescription}
                {book.description.length > 300 && (
                    <button onClick={toggleDescription}>
                        {showFullDescription ? "See less" : "See more"}
                    </button>
                )}
            </p>
            <h2>Genres</h2>
            <ul className="book-tags">
            {book.subjects?.map((subject: string, index: number) => (
                <li key={index}>
                <Link to={`/category/${encodeURIComponent(subject)}`}>
                    <button>{subject}</button>
                </Link>
                </li>
            ))}
            </ul>
        </div>
        </>
    )
}

export default BookPage;
