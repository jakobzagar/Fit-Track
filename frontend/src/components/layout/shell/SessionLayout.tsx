import {Outlet} from "react-router";

export function SessionLayout() {
    return (
        <main className="app-main min-h-screen">
            <Outlet />
        </main>
    );
}
