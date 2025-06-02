import { useEffect, useState } from 'react';
import axios from 'axios';

type Book = {
    book_id: string;
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
        <div>
            <h1>Your Reading List</h1>
            {books.map(book => (
                <div key={book.book_id}>
                    <p>{book.book_id}</p>
                    <button onClick={() => removeBook(book.book_id)}>Remove</button>
                </div>
            ))}
        </div>
    );
}

export default ReadingListPage;
