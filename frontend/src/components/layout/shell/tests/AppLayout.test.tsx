import {MemoryRouter, Route, Routes} from "react-router";
import {render, screen} from "@testing-library/react";
import {describe, expect, test, vi} from "vitest";
import {AuthContext} from "../../../../features/auth/context/auth.context";
import {user} from "../../../../test/fixtures/users";
import {AppLayout} from "../AppLayout";

const authValue = {
    currentUser: user,
    isRestoringSession: false,
    setAuthenticatedUser: vi.fn(),
    signOut: vi.fn(),
};

function renderLayout(route: string) {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <AuthContext value={authValue}>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route path="/workouts" element={<h1>Workouts page</h1>} />
                        <Route
                            path="/workouts/:id/session"
                            element={<h1>Active workout page</h1>}
                        />
                    </Route>
                </Routes>
            </AuthContext>
        </MemoryRouter>,
    );
}

describe("AppLayout", () => {
    test("renders navigation and footer around normal pages", () => {
        renderLayout("/workouts");

        expect(screen.getByRole("navigation", {name: "Main navigation"})).toBeInTheDocument();
        expect(screen.getByRole("navigation", {name: "Footer navigation"})).toBeInTheDocument();
        expect(screen.getByRole("heading", {name: "Workouts page"})).toBeInTheDocument();
    });

    test("keeps the active workout free of app navigation", () => {
        renderLayout("/workouts/123/session");

        expect(screen.getByRole("heading", {name: "Active workout page"})).toBeInTheDocument();
        expect(screen.queryByRole("navigation", {name: "Main navigation"})).not.toBeInTheDocument();
        expect(
            screen.queryByRole("navigation", {name: "Footer navigation"}),
        ).not.toBeInTheDocument();
    });
});
