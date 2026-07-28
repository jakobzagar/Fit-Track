import {createRef} from "react";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {Button} from "./Button";

describe("Button", () => {
    test("forwards button props, clicks, and its ref", async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        const ref = createRef<HTMLButtonElement>();

        render(
            <Button ref={ref} type="submit" onClick={onClick} fullWidth>
                Save
            </Button>,
        );

        const button = screen.getByRole("button", {name: "Save"});
        await user.click(button);

        expect(onClick).toHaveBeenCalledOnce();
        expect(button).toHaveAttribute("type", "submit");
        expect(button).toHaveClass("w-full");
        expect(ref.current).toBe(button);
    });

    test("does not fire clicks when disabled", async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        render(
            <Button disabled onClick={onClick}>
                Save
            </Button>,
        );

        await user.click(screen.getByRole("button", {name: "Save"}));

        expect(onClick).not.toHaveBeenCalled();
    });
});
