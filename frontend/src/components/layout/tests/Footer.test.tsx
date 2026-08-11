import {MemoryRouter} from "react-router";
import {render, screen} from "@testing-library/react";
import {describe, expect, test, vi} from "vitest";
import {AuthContext, type AuthContextValue} from "../../../features/auth/context/auth.context";
import {user as authenticatedUser} from "../../../test/fixtures/users";
import {Footer} from "../footer/Footer";

function renderFooter(user: AuthContextValue["user"], variant: "app" | "landing" = "landing") {
    return render(
        <MemoryRouter>
            <AuthContext value={{user, isLoading: false, setUser: vi.fn(), signOut: vi.fn()}}>
                <Footer variant={variant} />
            </AuthContext>
        </MemoryRouter>,
    );
}

describe("Footer", () => {
    test("offers authentication links to a visitor", () => {
        renderFooter(null);
        expect(screen.getByRole("link", {name: "Log in"})).toHaveAttribute("href", "/login");
        expect(screen.getByRole("link", {name: "Create account"})).toHaveAttribute(
            "href",
            "/register",
        );
    });

    test("offers the dashboard to an authenticated user", () => {
        renderFooter(authenticatedUser);
        expect(screen.getByRole("link", {name: "Dashboard"})).toHaveAttribute("href", "/workouts");
    });

    test("renders app navigation in app mode", () => {
        renderFooter(null, "app");
        expect(screen.getByRole("navigation", {name: "Footer navigation"})).toBeInTheDocument();
    });
});
