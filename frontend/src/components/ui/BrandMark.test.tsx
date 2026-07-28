import {MemoryRouter} from "react-router";
import {render, screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {BrandMark} from "./BrandMark";

describe("BrandMark", () => {
    test("links both logo variants to the home page by default", () => {
        render(
            <MemoryRouter>
                <BrandMark />
            </MemoryRouter>,
        );

        expect(screen.getByRole("link")).toHaveAttribute("href", "/");
        expect(screen.getAllByRole("img", {name: "FitTrack"})).toHaveLength(2);
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
