import { Routes, Route } from 'react-router-dom';
import App from './App';
import BookPage from './book-page';
import AuthorPage from './author-page';
import CategoryPage from './category-page';
import Layout from './Layout';
import ReadingListPage from './readinglist-page';
import NotFound from './notfound';

function Home() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<App />} />
                <Route path="/book/works/:id" element={<BookPage />} />
                <Route path="/author/:id" element={<AuthorPage />} />
                <Route path="/category/:subject" element={<CategoryPage />} />
                <Route path="/reading-list" element={<ReadingListPage />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    )
}

export default Home