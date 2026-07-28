import {render, screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {Card} from "./Card";

describe("Card", () => {
    test("renders the selected semantic element and forwards attributes", () => {
        render(
            <Card as="article" aria-label="Workout" className="custom-card">
                Push day
            </Card>,
        );

        const card = screen.getByRole("article", {name: "Workout"});
        expect(card).toHaveTextContent("Push day");
        expect(card).toHaveClass("custom-card");
    });
});
