import { useEffect, useState } from 'react';
import '../styles/author-page.css'
import axios from 'axios'
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

function AuthorPage() {
    const { id } = useParams();
    const [author, setAuthor] = useState<any>(null);
    const [works, setWorks] = useState<any>([]);

    useEffect(() => {
        const fetchAuthorDetails = async () => {
            try {
                const response = await axios.get(`${API_BASE}/authors/${id}`);
                const result = response.data;
                setAuthor(result);

                const worksResponse = await axios.get(`${API_BASE}/${id}/works`);
                const worksResult = worksResponse.data;
                console.log(worksResult);
                setWorks(worksResult.entries);
                // fetchWorks(result);
            } catch (error) {
                console.error(error);
            }
        };
        fetchAuthorDetails();
    }, [id]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10 bg-gradient-to-b from-blue-50 via-white to-white min-h-screen py-10 px-4"
        >
            <div className="max-w-6xl mx-auto">
                {/* Author Header */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-8 text-center mb-12 border border-gray-100">
                    <h1 className="text-5xl font-bold text-blue-900 mb-4">
                        {author?.name || "No Author Name Available"}
                    </h1>
                    <p className="text-gray-700 text-lg italic max-w-2xl mx-auto">
                        {typeof author?.bio === "string"
                            ? author.bio
                            : author?.bio?.value || "No Description Available"}
                    </p>
                </div>

                {/* Works Section */}
                <h2 className="text-3xl font-semibold text-center text-purple-800 mb-8">
                    ✨ Ebooks by {author?.name || "this Author"}
                </h2>

                {works.length > 0 ? (
                    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {works.map((work: any) => (
                            <li key={work.key}>
                                <Link
                                    to={`/book/works/${work.key.split('/').pop()}`}
                                    className="group block bg-white/70 backdrop-blur-md rounded-xl shadow-md hover:shadow-2xl border border-gray-200 transition transform hover:-translate-y-2 p-4 flex flex-col items-center h-full"
                                >
                                    <div className="relative h-56 w-full bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                        <img
                                            src={
                                                work.covers?.length
                                                    ? `https://covers.openlibrary.org/b/id/${work.covers[0]}-M.jpg`
                                                    : "/fallback-image.jpg"
                                            }
                                            alt={`Cover of ${work.title}`}
                                            className="max-h-full max-w-full object-contain opacity-0 animate-fadeIn transition-transform duration-300 group-hover:scale-105"
                                            onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                                            onError={(e) => {
                                                e.currentTarget.src = "/fallback-image.jpg";
                                                e.currentTarget.alt = "Cover not available";
                                            }}
                                        />
                                        {/* Subtle gradient overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                                    </div>
                                    <p className="mt-3 text-sm font-medium text-center text-gray-800 line-clamp-2">
                                        {work.title}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 italic mt-8">
                        No ebooks found for this author.
                    </p>
                )}
            </div>
        </motion.div>
    );
}

export default AuthorPage;