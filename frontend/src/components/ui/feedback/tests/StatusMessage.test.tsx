import {act, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {StatusMessage} from "../StatusMessage";

describe("StatusMessage", () => {
    test("announces its message as status feedback", () => {
        render(<StatusMessage tone="success">Workout saved</StatusMessage>);

        expect(screen.getByRole("status")).toHaveTextContent("Workout saved");
    });

    test("announces errors urgently", () => {
        render(<StatusMessage>Could not save workout</StatusMessage>);
        expect(screen.getByRole("alert")).toHaveTextContent("Could not save workout");
    });

    test("allows feedback to be dismissed", async () => {
        const onDismiss = vi.fn();
        const user = userEvent.setup();
        render(
            <StatusMessage tone="success" onDismiss={onDismiss} autoDismissMs={undefined}>
                Workout saved
            </StatusMessage>,
        );

        await user.click(screen.getByRole("button", {name: "Dismiss message"}));
        expect(onDismiss).toHaveBeenCalledOnce();
    });

    test("automatically dismisses success feedback", async () => {
        vi.useFakeTimers();
        const onDismiss = vi.fn();
        render(
            <StatusMessage tone="success" onDismiss={onDismiss}>
                Workout saved
            </StatusMessage>,
        );

        await act(() => vi.advanceTimersByTime(5000));
        expect(onDismiss).toHaveBeenCalledOnce();
        vi.useRealTimers();
    });
});
