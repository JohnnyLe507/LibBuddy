import { Routes, Route, useLocation  } from 'react-router-dom';
import App from './pages/App';
import BookPage from './pages/book-page';
import AuthorPage from './pages/author-page';
import CategoryPage from './pages/category-page';
import Layout from './components/Layout';
import ReadingListPage from './pages/readinglist-page';
import NotFound from './pages/notfound';
import BrowsePage from './pages/browse-page';
import { AnimatePresence } from "framer-motion";

function Home() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Layout />}>
                    <Route index element={<App />} />
                    <Route path="/book/works/:id" element={<BookPage />} />
                    <Route path="/author/:id" element={<AuthorPage />} />
                    <Route path="/category/:subject" element={<CategoryPage />} />
                    <Route path="/reading-list" element={<ReadingListPage />} />
                    <Route path="/browse" element={<BrowsePage />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </AnimatePresence>
    );
}
export default Home