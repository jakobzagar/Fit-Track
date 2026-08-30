import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {LoginForm} from "../components/LoginForm";

describe("LoginForm", () => {
    test("shows validation errors and does not submit invalid data", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<LoginForm onSubmit={onSubmit} />);

        await user.click(screen.getByRole("button", {name: "Log In"}));

        const email = screen.getByLabelText("Email");
        const emailError = screen.getByText("Invalid email address");
        expect(emailError).toBeInTheDocument();
        expect(screen.getByText("Password is required")).toBeInTheDocument();
        expect(email).toHaveAttribute("aria-invalid", "true");
        expect(email).toHaveAttribute("aria-describedby", emailError.id);
        await waitFor(() => expect(email).toHaveFocus());
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
