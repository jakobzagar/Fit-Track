import {http, HttpResponse} from "msw";
import {screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {API_URL} from "../../../test/constants";
import {renderWithProviders} from "../../../test/render";
import {server} from "../../../test/mocks/server";
import {useAuth} from "../hooks/useAuth";

const currentUser = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "Jakob",
    email: "jakob@example.com",
    createdAt: "2026-07-26T10:00:00.000Z",
    updatedAt: "2026-07-26T10:00:00.000Z",
};

function AuthState() {
    const {user, isLoading, signOut} = useAuth();

    if (isLoading) return <p>Loading session</p>;

    return (
        <div>
            <p>{user?.email ?? "Signed out"}</p>
            {user && <button onClick={() => void signOut()}>Log out</button>}
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
