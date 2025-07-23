import { useEffect, useState } from 'react';
import '../styles/book-page.css'
import '../styles/App.css'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { decode } from 'he';
import { motion } from "framer-motion";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

function BookPage() {
  const { id } = useParams() as { id: string };
  const [book, setBook] = useState<any>(null);
  const [authors, setAuthor] = useState<any[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { setIsLoginVisible } = useUI();
  const { isLoggedIn } = useAuth();
  const [readingList, setReadingList] = useState<string[]>([]);
  const navigate = useNavigate();

  const [ratingSummary, setRatingSummary] = useState<{ average: any; count: any; counts: any } | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);

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

        fetchRatings().catch(err =>
          console.error('Ratings fetch failed:', err)
        );

        fetchPageCount().catch(err =>
          console.error('Page count fetch failed:', err)
        );

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
    const { data } = await axios.get(`${API_BASE}/works/${id}`);
    if (!data) throw new Error('Book not found');
    return data;
  };

  const fetchRatings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/ratings/${id}`);
      const { summary, counts } = res.data;
      setRatingSummary({
        average: summary.average,
        count: summary.count,
        counts: counts,
      });
    } catch (err) {
      console.warn("No ratings found");
    }
  };

  const fetchPageCount = async () => {
    try {
      const response = await fetch(`https://openlibrary.org/works/${id}/editions.json?limit=10`);
      const data = await response.json();
      const editionWithPages = data.entries.find((ed: any) => ed.number_of_pages);
      if (editionWithPages?.number_of_pages) {
        setPageCount(editionWithPages.number_of_pages);
      }
    } catch (error) {
      console.error("Error fetching editions:", error);
    }
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
          axios.get(`${API_BASE}/authors/${id}`).then(res => res.data)
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

    const { data } = await axios.get(`${API_BASE}/reading-list`, {
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
        `${API_BASE}/add-to-reading-list`,
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
      await axios.delete(`${API_BASE}/reading-list/${id}`, {
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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative z-10"
    >
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-5xl mx-auto mt-10">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Book Cover */}
          <div className="relative w-full md:w-1/3 group">
            <img
              src={book.covers?.length > 0
                ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`
                : "/fallback-image.jpg"
              }
              alt={book.title}
              className="rounded-xl shadow-md object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = "/fallback-image.jpg";
                e.currentTarget.alt = "Cover not available";
              }}
            />
          </div>

          {/* Book Info */}
          <div className="flex-1 space-y-4">
            <h1 className="text-4xl font-bold text-gray-800">{decode(book.title)}</h1>
            {book.subtitle && <p className="italic text-gray-500">{book.subtitle}</p>}
            <p className="text-gray-600">
              by {authors.length > 0 ? (
                authors.map((a, i) => (
                  <Link key={a.key} to={`/author/${a.key.split('/').pop()}`} className="text-blue-600 hover:underline">
                    {a.personal_name || a.name}{i < authors.length - 1 && ", "}
                  </Link>
                ))
              ) : "Unknown Author"}
            </p>

            {pageCount && (
              <p className="text-gray-600">
                <strong>Pages:</strong> {pageCount}
              </p>
            )}

            {/* Reading List Button */}
            {readingList.includes(id) ? (
              <button onClick={handleRemove} className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600">
                Remove from Reading List
              </button>
            ) : (
              <button onClick={handleAddToReadingList} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
                Add to Reading List
              </button>
            )}

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-1 mt-4">About this book</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {showFullDescription ? rawDescription : shortDescription}
                {rawDescription.length > 300 && (
                  <button onClick={toggleDescription} className="ml-2 text-sm text-blue-500 hover:underline">
                    {showFullDescription ? "See less" : "See more"}
                  </button>
                )}
              </p>
            </div>

            {/* Genres */}
            {book.subjects?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mt-6 mb-2">Genres</h2>
                <ul className="flex flex-wrap gap-2">
                  {book.subjects.map((subject: string, index: number) => (
                    <li key={index}>
                      <Link to={`/category/${encodeURIComponent(subject)}`}>
                        <span className="bg-gradient-to-r from-purple-200 to-blue-200 text-sm px-3 py-1 rounded-full hover:from-purple-300 hover:to-blue-300">
                          {subject}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ratingSummary?.average != null ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-yellow-500 text-lg font-medium">
                  <span>★ {ratingSummary.average.toFixed(2)}</span>
                  <span className="text-gray-500 text-sm">({ratingSummary.count} ratings)</span>
                </div>

                {/* Breakdown bar */}
                {ratingSummary.counts && (
                  <div className="space-y-1 text-sm text-gray-600">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingSummary.counts[star] || 0;
                      const percentage = (count / ratingSummary.count) * 100;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="w-5">{star}★</span>
                          <div className="w-full bg-gray-200 rounded h-3">
                            <div
                              className="bg-yellow-400 h-3 rounded"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 italic">Not yet rated</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}


export default BookPage;
