import {render, screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {PageHeader} from "./PageHeader";

describe("PageHeader", () => {
    test("renders its content and optional action", () => {
        render(
            <PageHeader
                eyebrow="Training"
                title="Workouts"
                description="Plan your week"
                action={<button>Create workout</button>}
            />,
        );

        expect(screen.getByRole("heading", {name: "Workouts"})).toBeInTheDocument();
        expect(screen.getByText("Training")).toBeInTheDocument();
        expect(screen.getByText("Plan your week")).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Create workout"})).toBeInTheDocument();
    });
});
