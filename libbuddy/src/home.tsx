import { Routes, Route } from 'react-router-dom';
import App from './App';
import BookPage from './book-page';
import AuthorPage from './author-page';

function Home() {
    return (
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/book/works/:id" element={<BookPage />} />
            <Route path="/author/:id" element={<AuthorPage />} />
        </Routes>
    )
}

export default Home