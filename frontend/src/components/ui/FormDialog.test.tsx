import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {FormDialog} from "./FormDialog";

describe("FormDialog", () => {
    test("focuses the first field and closes with Escape", async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        render(
            <FormDialog title="Create workout" onClose={onClose}>
                <label>
                    Name
                    <input />
                </label>
            </FormDialog>,
        );

        expect(screen.getByLabelText("Name")).toHaveFocus();
        await user.keyboard("{Escape}");
        expect(onClose).toHaveBeenCalledOnce();
    });
});
