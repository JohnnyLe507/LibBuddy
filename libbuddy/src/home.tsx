import { Routes, Route } from 'react-router-dom';
import App from './App';
import BookPage from './book-page';
import AuthorPage from './author-page';
import CategoryPage from './category-page';
import Layout from './Layout';

function Home() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<App />} />
                <Route path="/book/works/:id" element={<BookPage />} />
                <Route path="/author/:id" element={<AuthorPage />} />
                <Route path="/category/:subject" element={<CategoryPage />} />
            </Route>
        </Routes>
    )
}

export default Home