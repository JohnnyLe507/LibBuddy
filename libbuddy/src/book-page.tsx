import { useEffect, useState } from 'react';
import './book-page.css'
import './App.css'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';
import { decode } from 'he';

function BookPage() {
  const { id } = useParams() as { id: string };
  const [book, setBook] = useState<any>(null);
  const [authors, setAuthor] = useState<any[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { isLoginVisible, setIsLoginVisible } = useUI();
  const { isLoggedIn } = useAuth();
  const [readingList, setReadingList] = useState<string[]>([]);
  const navigate = useNavigate();

  const toggleDescription = () => setShowFullDescription(prev => !prev);

  const rawDescription = typeof book?.description === "string"
    ? book.description
    : book?.description?.value || "No description available";

  const shortDescription = rawDescription.substring(0, 300) + "...";

  useEffect(() => {
    if (!id) {
      navigate('*');
      return;
    }

    const fetchAll = async () => {
      try {
        const bookData = await fetchBookDetails();
        setBook(bookData);

        fetchAuthorDetails(bookData).catch(err =>
          console.error('Author fetch failed:', err)
        );

        fetchReadingList().catch(err =>
          console.error('Reading list fetch failed:', err)
        );
      } catch (error) {
        console.error('Critical error fetching book:', error);
        navigate('*');
      }
    };

    fetchAll();
  }, [id]);

  const fetchBookDetails = async () => {
    const { data } = await axios.get(`http://localhost:3000/works/${id}`);
    if (!data) throw new Error('Book not found');
    return data;
  };

  const fetchAuthorDetails = async (bookData: any) => {
    try {
      const authorEntries = bookData.authors || [];
      const authorIds = authorEntries
        .map((entry: any) => {
          const rawKey = entry.author?.key || entry.key;
          return rawKey?.split('/').pop();
        })
        .filter((id: string | undefined): id is string => !!id); // remove undefineds

      const authorResponses = await Promise.all(
        authorIds.map((id: string) =>
          axios.get(`http://localhost:3000/authors/${id}`).then(res => res.data)
        )
      );

      setAuthor(authorResponses);
    } catch (error) {
      console.error("Failed to fetch authors:", error);
    }
  };

  const fetchReadingList = async () => {
    const token = localStorage.getItem('accesstoken');
    if (!token) return;

    const { data } = await axios.get('http://localhost:3000/reading-list', {
      headers: { Authorization: `Bearer ${token}` },
    });

    setReadingList(data.map((item: any) => item.book_id));
  };

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
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Book Cover */}
          <img
            src={
              book.covers && book.covers.length > 0
                ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`
                : "/fallback-image.jpg"
            }
            alt={`Cover of ${book.title}`}
            className="w-full max-w-xs rounded-lg shadow-md object-cover"
            onError={(e) => {
              e.currentTarget.src = "/fallback-image.jpg";
              e.currentTarget.alt = "Cover not available";
            }}
          />

          {/* Book Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{decode(book.title || '')}</h1>
            <p className="text-lg text-gray-600 mb-4">
              by{" "}
              {authors.length > 0 ? (
                authors.map((a, index) => (
                  <span key={a.key}>
                    <Link to={`/author/${a.key.split('/').pop()}`} className="text-blue-600 hover:underline">
                      {a.personal_name || a.name}
                    </Link>
                    {index < authors.length - 1 && ", "}
                  </span>
                ))
              ) : (
                "Unknown Author"
              )}
            </p>

            {/* Reading List Button */}
            {readingList.includes(id) ? (
              <button
                onClick={handleRemove}
                className="mb-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Remove from Reading List
              </button>
            ) : (
              <button
                onClick={handleAddToReadingList}
                className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add to Reading List
              </button>
            )}

            {/* Description */}
            <h2 className="text-2xl font-semibold mt-6 mb-2">About this book</h2>
            <p className="text-gray-800 mb-4 whitespace-pre-wrap">
              {showFullDescription ? rawDescription : shortDescription}
              {rawDescription.length > 300 && (
                <button
                  onClick={toggleDescription}
                  className="ml-2 text-blue-600 hover:underline text-sm"
                >
                  {showFullDescription ? "See less" : "See more"}
                </button>
              )}
            </p>

            {/* Genres */}
            {book.subjects?.length > 0 && (
              <>
                <h2 className="text-2xl font-semibold mt-6 mb-2">Genres</h2>
                <ul className="flex flex-wrap gap-2">
                  {book.subjects.map((subject: string, index: number) => (
                    <li key={index}>
                      <Link to={`/category/${encodeURIComponent(subject)}`}>
                        <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-300 cursor-pointer">
                          {subject}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default BookPage;
