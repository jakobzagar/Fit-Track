import {http, HttpResponse} from "msw";
import {screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {API_URL} from "../../../test/constants";
import {renderWithProviders} from "../../../test/render";
import {server} from "../../../test/mocks/server";
import {user as currentUser} from "../../../test/fixtures/users";
import {useAuth} from "../hooks/useAuth";

function AuthState() {
    const {currentUser, isRestoringSession, signOut} = useAuth();

    if (isRestoringSession) return <p>Loading session</p>;

    return (
        <div>
            <p>{currentUser?.email ?? "Signed out"}</p>
            {currentUser && <button onClick={() => void signOut()}>Log out</button>}
        </div>
    );
}

describe("AuthProvider", () => {
    test("loads the current authenticated user", async () => {
        server.use(http.get(`${API_URL}/auth/me`, () => HttpResponse.json({user: currentUser})));

        renderWithProviders(<AuthState />);

        expect(screen.getByText("Loading session")).toBeInTheDocument();
        expect(await screen.findByText("jakob@example.com")).toBeInTheDocument();
    });

    test("continues with a signed-out state when no session exists", async () => {
        renderWithProviders(<AuthState />);

        expect(await screen.findByText("Signed out")).toBeInTheDocument();
    });

    test("distinguishes a temporary session failure from a signed-out state", async () => {
        let attempts = 0;
        server.use(
            http.get(`${API_URL}/auth/me`, () => {
                attempts += 1;
                return attempts === 1
                    ? new HttpResponse("<html>Service unavailable</html>", {
                          status: 503,
                          headers: {"Content-Type": "text/html"},
                      })
                    : HttpResponse.json({user: currentUser});
            }),
        );
        const {user} = renderWithProviders(<AuthState />);

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Unable to restore your session. Please try again.",
        );
        expect(screen.queryByText("Signed out")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "Try again"}));

        expect(await screen.findByText("jakob@example.com")).toBeInTheDocument();
        expect(attempts).toBe(2);
    });

    test("logs out and clears the current user", async () => {
        server.use(
            http.get(`${API_URL}/auth/me`, () => HttpResponse.json({user: currentUser})),
            http.post(`${API_URL}/auth/logout`, () =>
                HttpResponse.json({message: "Logged out successfully"}),
            ),
        );
        const {user} = renderWithProviders(<AuthState />);

        await user.click(await screen.findByRole("button", {name: "Log out"}));

        expect(await screen.findByText("Signed out")).toBeInTheDocument();
    });
});
