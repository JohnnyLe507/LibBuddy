import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import classNames from "classnames";
import { motion } from "framer-motion";

interface Bestseller {
    title: string;
    author: string;
    book_image?: string;
}

interface Book {
    key: string;
    title: string;
    cover_id?: number;
}

const genres = [
    { name: "Fiction", key: "fiction" },
    { name: "Nonfiction", key: "nonfiction" },
    { name: "Fantasy", key: "fantasy" },
    { name: "Science Fiction", key: "science_fiction" },
    { name: "Romance", key: "romance" },
    { name: "Mystery", key: "mystery" },
    { name: "Horror", key: "horror" },
    { name: "Biography", key: "biography" },
    { name: "History", key: "history" },
    { name: "Children's", key: "children" },
    { name: "Science", key: "science" },
];

function BrowsePage() {
    const [genreBooks, setGenreBooks] = useState<Record<string, Book[]>>({});
    const [bestsellers, setBestsellers] = useState<Bestseller[]>([]);
    const [activeGenre, setActiveGenre] = useState<string | null>(null);
    const genreRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [scrollStates, setScrollStates] = useState<Record<string, { canScrollLeft: boolean; canScrollRight: boolean }>>({});

    const updateScrollButtons = (key: string) => {
        const el = document.getElementById(`scroll-${key}`);
        if (!el) return;
        setScrollStates((prev) => ({
            ...prev,
            [key]: {
                canScrollLeft: el.scrollLeft > 0,
                canScrollRight: el.scrollLeft + el.clientWidth < el.scrollWidth,
            },
        }));
    };

    useEffect(() => {
        const fetchAllGenres = async () => {
            try {
                const promises = genres.map((genre) =>
                    axios
                        .get(`http://localhost:3000/subjects/${genre.key}?limit=10`)
                        .then((res) => ({ key: genre.key, data: res.data.works }))
                );
                const results = await Promise.all(promises);
                const booksByGenre: Record<string, Book[]> = {};
                results.forEach(({ key, data }) => {
                    booksByGenre[key] = data;
                });
                setGenreBooks(booksByGenre);
            } catch (err) {
                console.error("Genre fetch error", err);
            }
        };

        const fetchBestsellers = async () => {
            try {
                const response = await axios.get("http://localhost:3000/bestsellers");
                setBestsellers(response.data);
            } catch (err) {
                console.error("Failed to load bestsellers", err);
            }
        };

        fetchAllGenres();
        fetchBestsellers();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            for (const genre of genres) {
                const ref = genreRefs.current[genre.key];
                if (ref && ref.getBoundingClientRect().top < window.innerHeight / 2) {
                    setActiveGenre(genre.key);
                }
            }
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", () => {
            genres.forEach((g) => updateScrollButtons(g.key));
        });
        // Initialize scroll states after books are loaded
        genres.forEach((g) => updateScrollButtons(g.key));
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [genreBooks]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10"
        >
            <div className="max-w-7xl mx-auto px-4 py-10 font-sans scroll-smooth scroll-pt-32">
                <h1 className="text-4xl font-bold text-center text-white mb-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text drop-shadow-lg">
                    Discover Your Next Read
                </h1>

                {/* Genre Buttons */}
                <div className="flex flex-wrap gap-3 mb-12 sticky top-20 z-20 bg-white/60 backdrop-blur-md p-4 rounded-xl shadow-lg">
                    {genres.map((g) => (
                        <a
                            key={g.key}
                            href={`#${g.key}`}
                            className={classNames(
                                "px-4 py-2 rounded-full text-sm font-medium shadow transition-all",
                                activeGenre === g.key
                                    ? "bg-purple-600 text-white"
                                    : "bg-white/40 hover:bg-white/70"
                            )}
                        >
                            {g.name}
                        </a>
                    ))}
                </div>

                {/* Genre Carousels */}
                {genres.map((genre) => (
                    <section
                        key={genre.key}
                        id={genre.key}
                        ref={(el) => {
                            genreRefs.current[genre.key] = el as HTMLDivElement | null;
                        }}
                        className="mb-16 scroll-mt-48"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-gray-800">{genre.name}</h2>
                            <Link
                                to={`/category/${genre.key}`}
                                className="text-sm text-indigo-600 hover:underline"
                            >
                                See more
                            </Link>
                        </div>

                        <div className="relative">
                            {scrollStates[genre.key]?.canScrollLeft && (
                                <button
                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/60 backdrop-blur p-2 rounded-full shadow hover:bg-white transition-transform hover:scale-110"
                                    onClick={() => {
                                        const el = document.getElementById(`scroll-${genre.key}`);
                                        el?.scrollBy({ left: -300, behavior: "smooth" });
                                        setTimeout(() => updateScrollButtons(genre.key), 300);
                                    }}
                                    aria-label={`Scroll ${genre.name} left`}
                                >
                                    &larr;
                                </button>
                            )}

                            <div
                                id={`scroll-${genre.key}`}
                                onScroll={() => updateScrollButtons(genre.key)}
                                className="flex gap-4 pt-2 pb-2 no-scrollbar scroll-smooth overflow-x-auto overflow-y-visible"
                            >
                                {genreBooks[genre.key]?.length ? (
                                    genreBooks[genre.key].map((book) => (
                                        <Link
                                            to={`/book${book.key}`}
                                            key={book.key}
                                            className="min-w-[160px] overflow-visible backdrop-blur-lg bg-white/30 border border-white/20 rounded-xl p-3 shadow-md hover:shadow-xl hover:scale-105 hover:ring-2 hover:ring-indigo-300 transition-transform duration-300"
                                        >
                                            <img
                                                src={
                                                    book.cover_id
                                                        ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
                                                        : "/fallback-image.jpg"
                                                }
                                                alt={book.title}
                                                className="w-full h-48 object-cover rounded-md mb-2"
                                                onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
                                            />
                                            <p className="text-sm font-medium text-gray-800 truncate">{book.title}</p>
                                        </Link>
                                    ))
                                ) : (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="min-w-[160px] h-[280px] bg-white/20 rounded-xl animate-pulse"
                                        />
                                    ))
                                )}
                            </div>

                            {scrollStates[genre.key]?.canScrollRight && (
                                <button
                                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/60 backdrop-blur p-2 rounded-full shadow hover:bg-white transition-transform hover:scale-110"
                                    onClick={() => {
                                        const el = document.getElementById(`scroll-${genre.key}`);
                                        el?.scrollBy({ left: 300, behavior: "smooth" });
                                        setTimeout(() => updateScrollButtons(genre.key), 300);
                                    }}
                                    aria-label={`Scroll ${genre.name} right`}
                                >
                                    &rarr;
                                </button>
                            )}
                            <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
                            <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />

                        </div>
                    </section>
                ))}

                {/* Bestsellers */}
                <section className="mt-24">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">NYT Bestsellers</h2>
                    <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
                        {bestsellers.map((book, i) => (
                            <div
                                key={i}
                                className="min-w-[160px] backdrop-blur-xl bg-gradient-to-br from-white/30 to-white/10 border border-white/20 rounded-xl p-3 shadow-lg hover:shadow-xl hover:scale-105 hover:ring-2 hover:ring-indigo-300 transition-transform duration-300"
                            >
                                <img
                                    src={book.book_image || "/fallback-image.jpg"}
                                    alt={book.title}
                                    className="w-full h-48 object-cover rounded mb-2"
                                    onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
                                />
                                <p className="text-sm font-semibold text-gray-900 truncate">{book.title}</p>
                                <p className="text-xs text-gray-600 truncate">{book.author}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </motion.div>
    );
}

export default BrowsePage;
