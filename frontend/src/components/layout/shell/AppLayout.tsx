import {Outlet, useLocation} from "react-router";
import {Footer} from "../footer/Footer";
import {Navbar} from "../navigation/Navbar";

export function AppLayout() {
    const {pathname} = useLocation();
    const isActiveWorkoutRoute = pathname.endsWith("/session");

    if (isActiveWorkoutRoute) {
        return (
            <main className="app-main min-h-screen">
                <Outlet />
            </main>
        );
    }

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
