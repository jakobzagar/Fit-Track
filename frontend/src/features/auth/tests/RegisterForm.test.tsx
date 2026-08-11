import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {RegisterForm} from "../components/RegisterForm";

describe("RegisterForm", () => {
    test("shows validation errors and does not submit invalid data", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<RegisterForm onSubmit={onSubmit} />);

        await user.click(screen.getByRole("button", {name: "Register"}));

        expect(screen.getByText("Name is required")).toBeInTheDocument();
        expect(screen.getByText("Invalid email address")).toBeInTheDocument();
        expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    test("normalizes and submits valid registration data", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(<RegisterForm onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText("Name"), "  Jakob  ");
        await user.type(screen.getByLabelText("Email"), "  JAKOB@EXAMPLE.COM  ");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", {name: "Register"}));

        expect(onSubmit).toHaveBeenCalledOnce();
        expect(onSubmit).toHaveBeenCalledWith({
            name: "Jakob",
            email: "jakob@example.com",
            password: "password123",
        });
    });
});
