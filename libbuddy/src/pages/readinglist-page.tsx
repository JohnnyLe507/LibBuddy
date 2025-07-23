import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { decode } from 'he';
import { motion } from "framer-motion";
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
const API_BASE = import.meta.env.VITE_API_BASE_URL;

type Book = {
    book_id: string;
    cover_url?: string;
    title?: string;
    authors?: { id: string; name: string }[];
};

type SuggestedBook = {
    title: string;
    author: string;
    genre: string;
    description: string;
};

function ReadingListPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [suggestedBooks, setSuggestedBooks] = useState<SuggestedBook[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [view, setView] = useState<"grid" | "list">("list");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [bookToRemove, setBookToRemove] = useState<Book | null>(null);
    const { isLoggedIn } = useAuth();
    const [debounceActive, setDebounceActive] = useState(false);

    useEffect(() => {
        const fetchList = async () => {
            const token = localStorage.getItem('accesstoken');

            if (!isLoggedIn || !token) {
                setBooks([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const res = await axios.get(`${API_BASE}/reading-list`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const readingList: { book_id: string }[] = res.data;

                const detailedBooks = await Promise.all(
                    readingList.map(async (item) => {
                        try {
                            const detailsRes = await axios.get(`${API_BASE}/works/${item.book_id}`);
                            const details = detailsRes.data;

                            const authorEntries = details.authors || [];

                            const authorIds = authorEntries
                                .map((entry: any) => {
                                    const rawKey = entry.author?.key || entry.key;
                                    return rawKey?.split('/').pop();
                                })
                                .filter((id: string | undefined): id is string => !!id); // remove undefineds

                            const authorNames = await Promise.all(
                                authorIds.map(async (id: string) => {
                                    const res = await axios.get(`${API_BASE}/authors/${id}`);
                                    const name = res.data?.personal_name || res.data?.name || "Unknown";
                                    return { id, name };
                                })
                            );

                            return {
                                book_id: item.book_id,
                                title: details.title,
                                authors: authorNames,
                                cover_url: details.covers?.[0]
                                    ? `https://covers.openlibrary.org/b/id/${details.covers[0]}-M.jpg`
                                    : undefined,
                            };
                        } catch (err) {
                            console.error(`Failed to fetch details for book ${item.book_id}:`, err);
                            return { book_id: item.book_id };
                        }
                    })
                );

                setBooks(detailedBooks);
                console.log('Reading list fetched:', res.data);
            } catch (err) {
                console.error('Failed to fetch reading list:', err);
            } finally {
                setLoading(false); // ✅ set to false whether it fails or not
            }
        };
        fetchList();
    }, [isLoggedIn]);

    const fetchSuggestions = async ({
        silent = false, // if true, no toast notifications
        skipDebounce = false, // if true, ignores debounce check (e.g., for auto-load)
    } = {}) => {
        if (!skipDebounce && debounceActive) return;

        const bookTitles = books
            .map(book => book.title)
            .filter((title): title is string => !!title);

        if (bookTitles.length === 0) {
            setSuggestedBooks([]);
            return;
        }

        try {
            setLoadingSuggestions(true);
            if (!skipDebounce) setDebounceActive(true);

            const response = await axios.post(
                `${API_BASE}/suggestions`,
                { titles: bookTitles },
                { headers: { 'Content-Type': 'application/json' } }
            );

            setSuggestedBooks(response.data);

            if (!silent) {
                if (response.data.length > 0) {
                    toast.success("Suggestions updated!");
                } else {
                    toast("No suggestions found.");
                }
            }
        } catch (err) {
            console.error('Failed to fetch suggestions:', err);
        } finally {
            setLoadingSuggestions(false);
            if (!skipDebounce) {
                setTimeout(() => setDebounceActive(false), 3000);
            }
        }
    };

    useEffect(() => {
        if (books.length > 0) {
            fetchSuggestions({ silent: true, skipDebounce: true });
        }
    }, [books]);

    const removeBook = async (bookId: string) => {
        const token = localStorage.getItem('accesstoken');
        try {
            await axios.delete(`${API_BASE}/reading-list/${bookId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBooks(prev => prev.filter(book => book.book_id !== bookId));
        } catch (err) {
            console.error('Failed to remove book:', err);
        }
    };

    const filteredBooks = books.filter((book) => {
        const titleMatch = book.title?.toLowerCase().includes(filter.toLowerCase()) ?? false;
        const authorMatch = book.authors?.some((author) =>
            author.name.toLowerCase().includes(filter.toLowerCase())
        ) ?? false;
        return titleMatch || authorMatch;
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-gradient-to-br from-blue-50 to-white min-h-screen py-10 px-4 sm:px-8"
        >
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
                {/* Left Section */}
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                        <h1 className="text-4xl font-bold text-blue-900">📚 Your Reading List</h1>
                        <div className="flex items-center gap-2">
                            <label htmlFor="viewToggle" className="text-sm text-gray-600">
                                View:
                            </label>
                            <button
                                onClick={() => setView(view === "grid" ? "list" : "grid")}
                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                            >
                                {view === "grid" ? "List View" : "Grid View"}
                            </button>
                        </div>
                    </div>

                    <input
                        type="text"
                        placeholder="Search your books..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full mb-6 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {loading ? (
                        <p className="text-center text-gray-500">Loading...</p>
                    ) : filteredBooks.length === 0 ? (
                        <p className="text-center text-gray-500">No books found in your list.</p>
                    ) : view === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6 justify-items-center">
                            {filteredBooks.map((book) => (
                                <div key={book.book_id} className="max-w-[250px] w-full mx-auto">
                                    <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-4 flex flex-col h-[420px]">
                                        {book.cover_url && (
                                            <img
                                                src={book.cover_url}
                                                alt={book.title}
                                                className="rounded-md mb-3 h-48 object-cover w-full"
                                            />
                                        )}
                                        <div className="flex-grow overflow-hidden">
                                            <h2 className="text-lg font-semibold text-blue-800 hover:underline line-clamp-2">
                                                <Link to={`/book/works/${book.book_id}`}>{decode(book.title || "")}</Link>
                                            </h2>
                                            {book.authors && (
                                                <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                                                    by{" "}
                                                    {book.authors.length > 2 ? (
                                                        <>
                                                            <Link
                                                                to={`/author/${book.authors[0].id}`}
                                                                className="hover:underline"
                                                            >
                                                                {book.authors[0].name}
                                                            </Link>{" "}
                                                            et al.
                                                        </>
                                                    ) : (
                                                        book.authors.map((author, i) => (
                                                            <span key={author.id}>
                                                                <Link
                                                                    to={`/author/${author.id}`}
                                                                    className="hover:underline"
                                                                >
                                                                    {author.name}
                                                                </Link>
                                                                {i < (book.authors?.length ?? 0) - 1 && ", "}
                                                            </span>
                                                        ))
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setBookToRemove(book);
                                                setShowConfirmModal(true);
                                            }}
                                            className="text-red-500 hover:text-red-700 transition p-1 rounded-md hover:bg-red-100 text-center mt-3 inline-flex items-center justify-center border border-red-300 hover:border-red-400"
                                            aria-label="Remove book"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredBooks.map((book) => (
                                <div
                                    key={book.book_id}
                                    className="bg-white/80 backdrop-blur-md rounded-xl shadow p-4 flex items-start gap-4 h-[180px]"
                                >
                                    {book.cover_url && (
                                        <img
                                            src={book.cover_url}
                                            alt={book.title}
                                            className="h-full w-[120px] object-cover rounded-md"
                                        />
                                    )}
                                    <div className="flex-grow flex flex-col justify-between">
                                        <div>
                                            <h2 className="text-lg font-semibold text-blue-800 hover:underline line-clamp-2">
                                                <Link to={`/book/works/${book.book_id}`}>{decode(book.title || "")}</Link>
                                            </h2>
                                            {book.authors && (
                                                <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                                                    by{" "}
                                                    {book.authors.length > 2 ? (
                                                        <>
                                                            <Link
                                                                to={`/author/${book.authors[0].id}`}
                                                                className="hover:underline"
                                                            >
                                                                {book.authors[0].name}
                                                            </Link>{" "}
                                                            et al.
                                                        </>
                                                    ) : (
                                                        book.authors.map((author, i) => (
                                                            <span key={author.id}>
                                                                <Link
                                                                    to={`/author/${author.id}`}
                                                                    className="hover:underline"
                                                                >
                                                                    {author.name}
                                                                </Link>
                                                                {i < (book.authors?.length ?? 0) - 1 && ", "}
                                                            </span>
                                                        ))
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setBookToRemove(book);
                                                setShowConfirmModal(true);
                                            }}
                                            className="mt-2 inline-flex items-center gap-2 text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 px-3 py-1.5 rounded-md transition text-sm font-medium group hover:bg-red-100"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 transition-transform duration-150 group-hover:scale-110"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Remove
                                        </button>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {showConfirmModal && bookToRemove && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-md rounded-lg shadow-xl p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Removal</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to remove <span className="font-semibold text-black">{decode(bookToRemove.title || "this book")}</span> from your reading list?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        try {
                                            removeBook(bookToRemove.book_id);
                                            toast.success('Book removed from your reading list.');
                                        } catch {
                                            toast.error('Failed to remove book.');
                                        } finally {
                                            setShowConfirmModal(false);
                                            setBookToRemove(null);
                                        }
                                    }}
                                    className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition"
                                >
                                    Confirm Remove
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Right: Suggested Books */}
                <aside className="w-full lg:w-80 flex-shrink-0">
                    <button
                        onClick={() => fetchSuggestions()}
                        disabled={loadingSuggestions || debounceActive || books.length === 0}
                        title="Suggestions are generated using AI based on your current list."
                        className="mb-4 px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-800 disabled:opacity-50 flex items-center justify-center"
                    >
                        {loadingSuggestions ? (
                            <>
                                <svg
                                    className="animate-spin h-5 w-5 mr-2 inline-block"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                </svg>
                                Loading suggestions...
                            </>
                        ) : (
                            "🔁 Get Suggestions"
                        )}
                    </button>

                    <h2 className="text-2xl font-bold text-purple-800 mb-4">✨ Suggested Books</h2>
                    <div
                        aria-live="polite"
                        className="h-full max-h-[80vh] overflow-y-auto space-y-4 pr-2"
                    >
                        {suggestedBooks.length === 0 ? (
                            <p className="text-gray-500 italic">No suggestions available yet.</p>
                        ) : (
                            suggestedBooks.map((book, index) => (
                                <div
                                    key={`${book.title}-${index}`}
                                    className="bg-white rounded-lg shadow p-4 border border-gray-200"
                                >
                                    <h3 className="text-lg font-semibold text-gray-800">{book.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1 italic">by {book.author}</p>
                                    <p className="text-xs text-purple-600 mt-1">Genre: {book.genre}</p>
                                    <p className="text-sm text-gray-700 mt-2">{book.description}</p>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            </div>
        </motion.div>
    );

}

export default ReadingListPage;
