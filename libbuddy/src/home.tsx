import { Routes, Route } from 'react-router-dom';
import App from './App';
import BookPage from './book-page';

function Home() {
    return (
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/book/works/:id" element={<BookPage />} />
        </Routes>
    )
}

export default Home