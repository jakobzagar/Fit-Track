import {render, screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {Feedback} from "./Feedback";

describe("Feedback", () => {
    test("announces its message as status feedback", () => {
        render(<Feedback tone="success">Workout saved</Feedback>);

        expect(screen.getByRole("status")).toHaveTextContent("Workout saved");
    });
});
