import { useEffect, useState } from 'react';
import axios from 'axios';

type Book = {
    book_id: string;
    cover_url?: string;
    title?: string;
    author?: string;
};

function ReadingListPage() {
    const [books, setBooks] = useState<Book[]>([]);

    useEffect(() => {
        const fetchList = async () => {
            const token = localStorage.getItem('accesstoken');
            try {
                const res = await axios.get('http://localhost:3000/reading-list', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBooks(res.data);
                console.log('Reading list fetched:', res.data);
            } catch (err) {
                console.error('Failed to fetch reading list:', err);
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

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">Your Reading List</h1>

                {books.length === 0 ? (
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
                                    <h2 className="text-lg font-semibold">{book.title}</h2>
                                    {book.author && (
                                        <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
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
