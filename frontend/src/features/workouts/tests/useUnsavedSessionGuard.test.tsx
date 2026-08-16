import {render, waitFor} from "@testing-library/react";
import {createMemoryRouter, RouterProvider} from "react-router";
import {describe, expect, test, vi} from "vitest";
import type {ConfirmDialogFunction} from "../../../components/ui/dialogs/context/confirm-dialog.context";
import {useUnsavedSessionGuard} from "../hooks/session/useUnsavedSessionGuard";

function renderGuard({
    dirtySetCount = 0,
    isFinishing = false,
    confirm = vi.fn().mockResolvedValue(false),
} = {}) {
    function Harness() {
        useUnsavedSessionGuard({dirtySetCount, isFinishing, confirm});
        return <p>Session</p>;
    }

    const router = createMemoryRouter(
        [
            {path: "/session", element: <Harness />},
            {path: "/workouts", element: <p>Workouts</p>},
        ],
        {initialEntries: ["/session"]},
    );
    render(<RouterProvider router={router} />);
    return {router, confirm};
}

describe("useUnsavedSessionGuard", () => {
    test("prevents browser unload only while changes are dirty", () => {
        const clean = renderGuard();
        const cleanEvent = new Event("beforeunload", {cancelable: true});
        window.dispatchEvent(cleanEvent);
        expect(cleanEvent.defaultPrevented).toBe(false);

        clean.router.dispose();
        const dirty = renderGuard({dirtySetCount: 1});
        const dirtyEvent = new Event("beforeunload", {cancelable: true});
        window.dispatchEvent(dirtyEvent);
        expect(dirtyEvent.defaultPrevented).toBe(true);
        dirty.router.dispose();
    });

    test("does not prevent unload while the workout is finishing", () => {
        const {router} = renderGuard({dirtySetCount: 2, isFinishing: true});
        const event = new Event("beforeunload", {cancelable: true});
        window.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(false);
        router.dispose();
    });

    test("continues blocked navigation after discard is confirmed", async () => {
        const confirm = vi.fn<ConfirmDialogFunction>().mockResolvedValue(true);
        const {router} = renderGuard({dirtySetCount: 2, confirm});

        void router.navigate("/workouts");

        await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
        expect(confirm.mock.calls[0][0].title).toBe("Discard unsaved set changes?");
        expect(confirm.mock.calls[0][0].message).toContain("2 sets have unsaved changes");
        await waitFor(() => expect(router.state.location.pathname).toBe("/workouts"));
    });
});
