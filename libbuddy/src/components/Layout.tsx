import { Outlet } from "react-router-dom";
import NavBar from "./NavBar.tsx";
import ScrollToTop from "./ScrollToTop.tsx";

export default function Layout() {
    return (
        <>
            <ScrollToTop />
            <NavBar />
            <Outlet />
        </>
    );
}