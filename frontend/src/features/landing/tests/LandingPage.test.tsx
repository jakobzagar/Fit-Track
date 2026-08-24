import {MemoryRouter} from "react-router";
import {render, screen} from "@testing-library/react";
import {describe, expect, test, vi} from "vitest";
import {AuthContext, type AuthContextValue} from "../../auth/context/auth.context";
import {user as authenticatedUser} from "../../../test/fixtures/users";
import {LandingPage} from "../pages/LandingPage";

function renderPage(user: AuthContextValue["user"]) {
    return render(
        <MemoryRouter>
            <AuthContext value={{user, isLoading: false, setUser: vi.fn(), signOut: vi.fn()}}>
                <LandingPage />
            </AuthContext>
        </MemoryRouter>,
    );
}

describe("LandingPage", () => {
    test("invites a visitor to register", () => {
        renderPage(null);

        expect(screen.getByRole("heading", {name: /Train withpurpose\./i})).toBeInTheDocument();
        expect(screen.getAllByRole("link", {name: /Start training/})[0]).toHaveAttribute(
            "href",
            "/register",
        );
        expect(screen.getAllByRole("link", {name: "Log in"}).length).toBeGreaterThan(0);
        expect(screen.getAllByRole("article")).toHaveLength(3);
    });

    test("sends an authenticated user to the dashboard", () => {
        renderPage(authenticatedUser);

        expect(screen.getAllByRole("link", {name: /Open dashboard/})[0]).toHaveAttribute(
            "href",
            "/workouts",
        );
        expect(screen.queryByRole("link", {name: "Register"})).not.toBeInTheDocument();
    });
});
