import {render, screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {AppProviders} from "./providers";
import {AppRouter} from "./router";

describe("AppRouter", () => {
    test("renders the not-found page for an unknown route", () => {
        window.history.pushState({}, "", "/unknown-page");

        render(
            <AppProviders>
                <AppRouter />
            </AppProviders>,
        );

        expect(screen.getByRole("heading", {name: "Page not found"})).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "Go home"})).toHaveAttribute("href", "/");
        expect(screen.getByRole("link", {name: "Go to workouts"})).toHaveAttribute(
            "href",
            "/workouts",
        );
    });
});
