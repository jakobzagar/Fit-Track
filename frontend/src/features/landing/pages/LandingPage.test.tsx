import {MemoryRouter} from "react-router";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {AuthContext, type AuthContextValue} from "../../auth/context/auth.context";
import {LandingPage} from "./LandingPage";

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

    test("allows visitors to change theme", async () => {
        const user = userEvent.setup();
        document.documentElement.dataset.theme = "dark";
        renderPage(null);

        await user.click(screen.getByRole("button", {name: "Switch to light theme"}));
        expect(document.documentElement.dataset.theme).toBe("light");
        expect(localStorage.getItem("fittrack-theme")).toBe("light");
    });

    test("sends an authenticated user to the dashboard", () => {
        renderPage({
            id: "123e4567-e89b-42d3-a456-426614174000",
            name: "Jakob",
            email: "jakob@example.com",
            createdAt: "2026-07-26T10:00:00.000Z",
            updatedAt: "2026-07-26T10:00:00.000Z",
        });

        expect(screen.getAllByRole("link", {name: /Open dashboard/})[0]).toHaveAttribute(
            "href",
            "/workouts",
        );
        expect(screen.queryByRole("link", {name: "Create account"})).not.toBeInTheDocument();
    });
});
