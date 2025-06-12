import { useEffect, useState } from 'react';
import './author-page.css'
import axios from 'axios'
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

function AuthorPage() {
    const { id } = useParams();
    const [author, setAuthor] = useState<any>(null);
    const [works, setWorks] = useState<any>([]);

    useEffect(() => {
        const fetchAuthorDetails = async () => {
          try {
            const response = await axios.get(`http://localhost:3000/authors/${id}`);
            const result = response.data;
            setAuthor(result);

            const worksResponse = await axios.get(`http://localhost:3000/authors/${id}/works`);
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
        <div className="author-pagemax-w-5xl mx-auto px-4 py-8">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-4">
                    {author?.name || "No Author Name Available"}
                </h1>
                <p className="text-gray-600 text-lg italic">
                    {typeof author?.bio === "string"
                        ? author.bio
                        : author?.bio?.value || "No Description Available"}
                </p>
            </div>

            <h2 className="text-2xl font-semibold mb-6 text-center">Ebooks</h2>
            {works.length > 0 ? (
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {works.map((work: any) => (
                        <li key={work.key} className="text-center">
                            <Link to={`/book/works/${work.key.split('/').pop()}`} className="block text-center space-y-2">
                                {work.covers?.length > 0 ? (
                                    <img
                                        src={`https://covers.openlibrary.org/b/id/${work.covers[0]}-M.jpg`}
                                        alt={`Cover of ${work.title}`}
                                        className="w-full h-48 object-cover rounded shadow-md mx-auto"
                                        onError={(e) => {
                                            // e.currentTarget.src = "/fallback-image.jpg";
                                            e.currentTarget.alt = "Cover not available";
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm rounded shadow-sm">
                                        No cover available
                                    </div>
                                )}
                                <p className="mt-2 text-sm font-medium">{work.title}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500">No ebooks found for this author.</p>
            )}
        </div>
    )
}

export default AuthorPage;