import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {createMemoryRouter, Link, RouterProvider} from "react-router";
import {describe, expect, test, vi} from "vitest";
import {RouteChangeEffects} from "../routing/RouteChangeEffects";

describe("RouteChangeEffects", () => {
    test("updates the page title and focuses the new page heading after navigation", async () => {
        window.scrollTo = vi.fn();
        const router = createMemoryRouter(
            [
                {
                    element: <RouteChangeEffects />,
                    children: [
                        {
                            path: "/",
                            element: (
                                <main>
                                    <h1>Home</h1>
                                    <Link to="/workouts">Open workouts</Link>
                                </main>
                            ),
                        },
                        {
                            path: "/workouts",
                            element: (
                                <main>
                                    <h1>Workouts</h1>
                                </main>
                            ),
                        },
                    ],
                },
            ],
            {initialEntries: ["/"]},
        );
        const user = userEvent.setup();
        render(<RouterProvider router={router} />);

        expect(document.title).toBe("FitTrack · Train with purpose");
        await user.click(screen.getByRole("link", {name: "Open workouts"}));

        const heading = await screen.findByRole("heading", {name: "Workouts"});
        await vi.waitFor(() => expect(heading).toHaveFocus());
        expect(document.title).toBe("Workouts · FitTrack");
    });
});
