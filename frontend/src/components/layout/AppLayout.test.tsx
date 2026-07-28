import {MemoryRouter, Route, Routes} from "react-router";
import {render, screen} from "@testing-library/react";
import {describe, expect, test, vi} from "vitest";
import {AuthContext} from "../../features/auth/context/auth.context";
import {AppLayout} from "./AppLayout";

const authValue = {
    user: {
        id: "123e4567-e89b-42d3-a456-426614174000",
        name: "Jakob",
        email: "jakob@example.com",
        createdAt: "2026-07-26T10:00:00.000Z",
        updatedAt: "2026-07-26T10:00:00.000Z",
    },
    isLoading: false,
    setUser: vi.fn(),
    signOut: vi.fn(),
};

function renderLayout(route: string) {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <AuthContext value={authValue}>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route path="/workouts" element={<h1>Workouts page</h1>} />
                        <Route path="/workouts/:id/session" element={<h1>Session page</h1>} />
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

    test("keeps the live session free of app navigation", () => {
        renderLayout("/workouts/123/session");

        expect(screen.getByRole("heading", {name: "Session page"})).toBeInTheDocument();
        expect(screen.queryByRole("navigation", {name: "Main navigation"})).not.toBeInTheDocument();
        expect(
            screen.queryByRole("navigation", {name: "Footer navigation"}),
        ).not.toBeInTheDocument();
    });
});
