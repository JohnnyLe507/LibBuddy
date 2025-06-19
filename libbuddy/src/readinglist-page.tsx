import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { decode } from 'he';

type Book = {
    book_id: string;
    cover_url?: string;
    title?: string;
    authors?: { id: string; name: string }[];
};

function ReadingListPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [filter, setFilter] = useState("");
    const [readStatus, setReadStatus] = useState<{ [key: string]: boolean }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchList = async () => {
            const token = localStorage.getItem('accesstoken');
            try {
                const res = await axios.get('http://localhost:3000/reading-list', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const readingList: { book_id: string }[] = res.data;

                const detailedBooks = await Promise.all(
                    readingList.map(async (item) => {
                        try {
                            const detailsRes = await axios.get(`http://localhost:3000/works/${item.book_id}`);
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
                                    const res = await axios.get(`http://localhost:3000/authors/${id}`);
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
    }, []);

    const removeBook = async (bookId: string) => {
        const token = localStorage.getItem('accesstoken');
        try {
            await axios.delete(`http://localhost:3000/reading-list/${bookId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBooks(prev => prev.filter(book => book.book_id !== bookId));
        } catch (err) {
            console.error('Failed to remove book:', err);
        }
    };

    // const filteredBooks = books.filter((book) =>
    //     `${book.title} ${book.authors?.join(" ") || ""}`
    //         .toLowerCase()
    //         .includes(filter.toLowerCase())
    // );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">Your Reading List</h1>

                <input
                    type="text"
                    placeholder="Search by title or author..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full mb-6 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {loading ? (
                    <p className="text-center text-gray-500">Loading your reading list...</p>
                ) : books.length === 0 ? (
                    <p className="text-center text-gray-500">You haven’t added any books yet.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {books.map((book) => (
                            <div
                                key={book.book_id}
                                className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between"
                            >
                                {/* Thumbnail (optional) */}
                                {book.cover_url && (
                                    <img
                                        src={book.cover_url}
                                        alt={book.title}
                                        className="rounded-md mb-3 h-48 object-cover"
                                    />
                                )}

                                {/* Book Info */}
                                <div className="flex-grow">
                                    <h2 className="text-lg font-semibold text-black-800 hover:underline">
                                        <Link to={`/book/works/${book.book_id}`}>{decode(book.title || '')}</Link>
                                    </h2>
                                    {book.authors && book.authors.length > 0 && (
                                        <p className="text-sm text-blue-700 mb-2 space-x-1">
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
                                                book.authors.map((author, index) => (
                                                    <span key={author.id}>
                                                        <Link
                                                            to={`/author/${author.id}`}
                                                            className="hover:underline"
                                                        >
                                                            {author.name}
                                                        </Link>
                                                        {book.authors && index < book.authors.length - 1 && ", "}
                                                    </span>
                                                ))
                                            )}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400">Book ID: {book.book_id}</p>
                                </div>

                                {/* Remove button */}
                                <button
                                    onClick={() => removeBook(book.book_id)}
                                    className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-md transition"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReadingListPage;
