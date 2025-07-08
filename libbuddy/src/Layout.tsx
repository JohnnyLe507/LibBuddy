import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import ScrollToTop from "./ScrollToTop";

export default function Layout() {
    return (
        <>
            <ScrollToTop />
            <NavBar />
            <Outlet />
        </>
    );
}