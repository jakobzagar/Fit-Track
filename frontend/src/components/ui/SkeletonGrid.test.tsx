import {render, screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {SkeletonGrid} from "./SkeletonGrid";

describe("SkeletonGrid", () => {
    test("marks the grid as busy while rendering the requested placeholders", () => {
        const {container} = render(<SkeletonGrid count={3} />);

        expect(screen.getByLabelText("Loading content")).toHaveAttribute("aria-busy", "true");
        expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
    });
});
