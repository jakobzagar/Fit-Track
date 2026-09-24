import {MemoryRouter} from "react-router";
import {render, screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {BrandLogo} from "../BrandLogo";

describe("BrandLogo", () => {
    test("links both logo variants to the home page by default", () => {
        render(
            <MemoryRouter>
                <BrandLogo />
            </MemoryRouter>,
        );

        expect(screen.getByRole("link", {name: /FitTrack/})).toHaveAttribute("href", "/");
    });

    test("can render without a link", () => {
        render(
            <MemoryRouter>
                <BrandLogo linked={false} />
            </MemoryRouter>,
        );

        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
});
