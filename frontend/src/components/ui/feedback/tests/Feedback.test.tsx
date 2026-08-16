import {act, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {Feedback} from "../Feedback";

describe("Feedback", () => {
    test("announces its message as status feedback", () => {
        render(<Feedback tone="success">Workout saved</Feedback>);

        expect(screen.getByRole("status")).toHaveTextContent("Workout saved");
    });

    test("announces errors urgently", () => {
        render(<Feedback>Could not save workout</Feedback>);
        expect(screen.getByRole("alert")).toHaveTextContent("Could not save workout");
    });

    test("allows feedback to be dismissed", async () => {
        const onDismiss = vi.fn();
        const user = userEvent.setup();
        render(
            <Feedback tone="success" onDismiss={onDismiss} autoDismissMs={undefined}>
                Workout saved
            </Feedback>,
        );

        await user.click(screen.getByRole("button", {name: "Dismiss message"}));
        expect(onDismiss).toHaveBeenCalledOnce();
    });

    test("automatically dismisses success feedback", async () => {
        vi.useFakeTimers();
        const onDismiss = vi.fn();
        render(
            <Feedback tone="success" onDismiss={onDismiss}>
                Workout saved
            </Feedback>,
        );

        await act(() => vi.advanceTimersByTime(5000));
        expect(onDismiss).toHaveBeenCalledOnce();
        vi.useRealTimers();
    });
});
