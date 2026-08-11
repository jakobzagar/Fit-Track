import {useState} from "react";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test} from "vitest";
import {ConfirmDialogProvider} from "../dialogs/ConfirmDialogProvider";
import {useConfirmDialog} from "../dialogs/useConfirmDialog";

function DialogHarness() {
    const confirm = useConfirmDialog();
    const [result, setResult] = useState("pending");

    async function openDialog() {
        const confirmed = await confirm({
            title: "Delete workout?",
            message: "This cannot be undone.",
            confirmLabel: "Delete",
            variant: "danger",
        });
        setResult(confirmed ? "confirmed" : "cancelled");
    }

    return (
        <>
            <button onClick={() => void openDialog()}>Open dialog</button>
            <output>{result}</output>
        </>
    );
}

function renderDialog() {
    return render(
        <ConfirmDialogProvider>
            <DialogHarness />
        </ConfirmDialogProvider>,
    );
}

describe("ConfirmDialogProvider", () => {
    test("resolves confirmation and restores focus", async () => {
        const user = userEvent.setup();
        renderDialog();
        const trigger = screen.getByRole("button", {name: "Open dialog"});

        await user.click(trigger);
        const dialog = screen.getByRole("alertdialog", {name: "Delete workout?"});

        expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
        expect(screen.getByRole("button", {name: "Cancel"})).toHaveFocus();
        expect(document.body).toHaveStyle({overflow: "hidden"});

        await user.click(screen.getByRole("button", {name: "Delete"}));

        expect(screen.getByText("confirmed")).toBeInTheDocument();
        expect(dialog).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });

    test("cancels with Escape", async () => {
        const user = userEvent.setup();
        renderDialog();

        await user.click(screen.getByRole("button", {name: "Open dialog"}));
        await user.keyboard("{Escape}");

        expect(screen.getByText("cancelled")).toBeInTheDocument();
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
});
