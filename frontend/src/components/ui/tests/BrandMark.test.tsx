import {MemoryRouter} from "react-router";
import {render, screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {BrandMark} from "../display/BrandMark";

describe("BrandMark", () => {
    test("links both logo variants to the home page by default", () => {
        render(
            <MemoryRouter>
                <BrandMark />
            </MemoryRouter>,
        );

        expect(screen.getByRole("link", {name: /FitTrack/})).toHaveAttribute("href", "/");
    });

    test("can render without a link", () => {
        render(
            <MemoryRouter>
                <BrandMark linked={false} />
            </MemoryRouter>,
        );

        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
});
