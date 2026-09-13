import {Outlet} from "react-router";
import {Footer} from "../footer/Footer";
import {Navbar} from "../navigation/Navbar";

export function AppLayout() {
    return (
        <div className="app-shell">
            <Navbar />

            <main className="app-main">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}
