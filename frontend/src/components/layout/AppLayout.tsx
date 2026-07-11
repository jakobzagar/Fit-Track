import {Outlet} from "react-router";
import {Navbar} from "./Navbar";
import {Footer} from "./Footer";

export function AppLayout() {
    return (
        <div>
            <Navbar />

            <main>
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}
