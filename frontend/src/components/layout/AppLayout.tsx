import {Outlet, useLocation} from "react-router";
import {Navbar} from "./Navbar";
import {Footer} from "./Footer";

export function AppLayout() {
    const {pathname} = useLocation();
    const isWorkoutSession = pathname.endsWith("/session");

    if (isWorkoutSession) {
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
