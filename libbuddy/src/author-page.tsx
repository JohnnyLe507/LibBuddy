import { useEffect, useState } from 'react';
import './author-page.css'
import './App.css'
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
        <>
        <nav className="navbar">
            <div className="logo">LibBuddy</div>
            <ul className="nav-links">
                <li><Link to="/">Home</Link></li>
                <li><a href="#">Features</a></li>
                <li><a href="#">About</a></li>
                <li><a href="#">Contact</a></li>
                <button>Login</button>
                <button>Sign Up</button>
            </ul>
        </nav>
        <div className="author-page">
            <h1>{author?.name || "No Author Name Avaiable"}</h1>
            <div className='bio'>
            <h2>{author?.bio || "No Description Avaiable"}</h2>
            </div>
            <h3>Ebooks</h3>
            <ul>
                {works.map((work: any) => (
                <li key={work.key}>
                    <strong>{work.title}</strong>
                    {work.covers?.length > 0 ? (
                    <img
                    src={`https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg`}
                    alt={`Cover of ${work.title}`}
                    onError={(e) => {
                        e.currentTarget.src = "/fallback-image.jpg";
                        e.currentTarget.alt = "Cover not available";
                    }}
                    />
                    ) : (
                        <p>No cover available</p>
                    )}
                </li>
                ))}
            </ul>
        </div>
        </>
    )
}

export default AuthorPage;