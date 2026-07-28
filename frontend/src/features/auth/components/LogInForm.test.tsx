import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {LoginForm} from "./LogInForm";

describe("LoginForm", () => {
    test("shows validation errors and does not submit invalid data", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<LoginForm onSubmit={onSubmit} />);

        await user.click(screen.getByRole("button", {name: "Log In"}));

        expect(screen.getByText("Invalid email address")).toBeInTheDocument();
        expect(screen.getByText("Password is required")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    test("rejects a password longer than 72 characters", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<LoginForm onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText("Email"), "jakob@example.com");
        await user.type(screen.getByLabelText("Password"), "a".repeat(73));
        await user.click(screen.getByRole("button", {name: "Log In"}));

        expect(screen.getByText("Password is too long")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    test("normalizes and submits valid credentials", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(<LoginForm onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText("Email"), "  JAKOB@EXAMPLE.COM  ");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", {name: "Log In"}));

        expect(onSubmit).toHaveBeenCalledOnce();
        expect(onSubmit).toHaveBeenCalledWith({
            email: "jakob@example.com",
            password: "password123",
        });
    });
});
