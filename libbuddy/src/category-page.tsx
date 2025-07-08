import { useEffect, useState, useRef } from 'react';
import './category-page.css'
import './App.css'
import axios from 'axios'
import { useParams, Link } from 'react-router-dom';
import { motion } from "framer-motion";

interface Author {
    name: string;
    key?: string;
}

function CategoryPage() {
    const { subject } = useParams();
    interface Book {
        key: string;
        title: string;
        cover_id?: number;
        authors?: Author[];
        // Add other properties as needed
    }

    const [books, setBooks] = useState<Book[]>([]);
    const [totalBooks, setTotalBooks] = useState(0);
    const [offset, setOffset] = useState(0);
    const [filterYear, setFilterYear] = useState("");
    const [ebooksOnly, setEbooksOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [topAuthors, setTopAuthors] = useState<Author[]>([]);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const limit = 12;

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoading && books.length < totalBooks) {
                    setOffset((prev) => prev + limit);
                }
            },
            { threshold: 1 }
        );
        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [books, totalBooks, isLoading]);

    useEffect(() => {
        const fetchBooksByCategory = async () => {
            try {
                setIsLoading(true);
                const params = new URLSearchParams();
                params.append("offset", offset.toString());
                params.append("limit", limit.toString());
                params.append("details", "true");
                if (ebooksOnly) params.append("ebooks", "true");
                if (filterYear.match(/^\d{4}$/)) {
                    params.append("published_in", `${filterYear}-${filterYear}`);
                }

                const response = await axios.get(
                    `http://localhost:3000/subjects/${subject?.toLowerCase()}?${params}`
                );
                const result = response.data;

                // 🔧 Deduplicate works by key
                setBooks((prev) => {
                    const merged = [...prev, ...result.works];

                    const uniqueBooksMap = new Map<string, Book>();

                    merged.forEach((book) => {
                        const existing = uniqueBooksMap.get(book.key);

                        if (!existing) {
                            uniqueBooksMap.set(book.key, book); // First time seeing it
                        } else {
                            const existingCover = existing.cover_id || 0;
                            const currentCover = book.cover_id || 0;

                            if (currentCover > existingCover) {
                                uniqueBooksMap.set(book.key, book); // Replace with better cover
                            }
                        }
                    });

                    return Array.from(uniqueBooksMap.values());
                });

                setTotalBooks(result.work_count);
                if (offset === 0 && result.authors) {
                    setTopAuthors(result.authors.slice(0, 5));
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBooksByCategory();
    }, [subject, offset, filterYear, ebooksOnly]);

    const filteredBooks = books.filter((book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10"
        >
            <div className="flex flex-col md:flex-row max-w-7xl mx-auto px-4 py-10 gap-6">
                {/* Sidebar Filters */}
                <aside className="md:w-1/4 bg-white shadow rounded-xl p-4 space-y-4">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <input
                        type="text"
                        placeholder="Search titles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    />
                    <input
                        type="text"
                        placeholder="Year (e.g. 2020)"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    />
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={ebooksOnly}
                            onChange={() => setEbooksOnly(!ebooksOnly)}
                        />
                        Ebooks only
                    </label>
                    {topAuthors.length > 0 && (
                        <div>
                            <h3 className="mt-4 font-medium">Popular Authors</h3>
                            <ul className="space-y-1">
                                {topAuthors.map((a, i) => (
                                    <li key={i} className="text-blue-600 text-sm cursor-pointer hover:underline">
                                        {a.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </aside>

                {/* Main Content */}
                <main className="md:w-3/4">
                    <div className="sticky top-0 z-10 bg-white py-2 mb-4">
                        <h1 className="text-3xl font-bold capitalize mb-1">{subject}</h1>
                        <p className="text-gray-500">{totalBooks} works found</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBooks.map((book) => (
                            <div
                                key={book.key}
                                className="bg-white p-4 rounded-lg shadow transition hover:shadow-lg hover:scale-105"
                            >
                                <img
                                    src={`https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`}
                                    alt={book.title}
                                    className="w-full h-64 object-cover rounded mb-3"
                                />
                                <h3 className="text-lg font-semibold text-gray-800 truncate">
                                    <Link
                                        to={`/book/works/${book.key.split("/").pop()}`}
                                        className="hover:underline text-blue-700"
                                    >
                                        {book.title}
                                    </Link>
                                </h3>

                                {(book.authors?.length ?? 0) > 0 && (
                                    <p className="text-sm text-gray-500 truncate">
                                        by{" "}
                                        <Link
                                            to={`/author/${book.authors?.[0]?.key?.split("/")?.pop()}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {book.authors?.[0]?.name}
                                        </Link>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div ref={loadMoreRef} className="text-center py-10">
                        {isLoading && <p className="text-gray-500">Loading more books...</p>}
                    </div>
                </main>
            </div>
        </motion.div>
    );
}

export default CategoryPage;
