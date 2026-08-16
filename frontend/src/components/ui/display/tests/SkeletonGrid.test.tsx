import {render, screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {SkeletonGrid} from "../SkeletonGrid";

describe("SkeletonGrid", () => {
    test("exposes its loading state to assistive technology", () => {
        render(<SkeletonGrid count={3} />);

        expect(screen.getByLabelText("Loading content")).toHaveAttribute("aria-busy", "true");
    });
});
