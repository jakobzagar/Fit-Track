import {render, screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {LoadingState} from "./LoadingState";

describe("LoadingState", () => {
    test("renders the supplied loading label", () => {
        render(<LoadingState label="Loading workouts" />);

        expect(screen.getByText("Loading workouts")).toBeInTheDocument();
    });
});
