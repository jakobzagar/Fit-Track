import {MemoryRouter} from "react-router";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {AuthContext} from "../../../features/auth/context/auth.context";
import {user} from "../../../test/fixtures/users";
import {Navbar} from "../navigation/Navbar";

const authValue = {
    user,
    isLoading: false,
    setUser: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined),
};

function renderNavbar() {
    return render(
        <MemoryRouter initialEntries={["/workouts"]}>
            <AuthContext value={authValue}>
                <Navbar />
            </AuthContext>
        </MemoryRouter>,
    );
}

describe("Navbar", () => {
    test("shows the user, navigation, and changes theme", async () => {
        const user = userEvent.setup();
        document.documentElement.dataset.theme = "dark";
        renderNavbar();

        expect(screen.getByText("Jakob")).toBeInTheDocument();
        expect(screen.getAllByRole("link", {name: "Workouts"})[0]).toHaveAttribute(
            "aria-current",
            "page",
        );

        await user.click(screen.getByRole("button", {name: "Switch to light theme"}));
        expect(document.documentElement.dataset.theme).toBe("light");
        expect(localStorage.getItem("fittrack-theme")).toBe("light");
    });

    test("signs out from the desktop action", async () => {
        const user = userEvent.setup();
        authValue.signOut.mockClear();
        renderNavbar();

        await user.click(screen.getAllByRole("button", {name: "Log out"})[0]);

        expect(authValue.signOut).toHaveBeenCalledOnce();
    });

    test("shows a logout error and supports the mobile action", async () => {
        const user = userEvent.setup();
        authValue.signOut.mockRejectedValueOnce(new Error("Logout unavailable"));
        renderNavbar();

        await user.click(screen.getAllByRole("button", {name: "Log out"})[1]);

        expect(await screen.findByText("Logout unavailable")).toBeInTheDocument();
        expect(screen.getAllByRole("button", {name: "Log out"})[1]).toBeEnabled();
    });
});
