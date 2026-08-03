import {useCallback, useEffect} from "react";
import {useBlocker} from "react-router";
import type {ConfirmDialogOptions} from "../../../components/ui/confirm-dialog.context";

type Confirm = (options: ConfirmDialogOptions) => Promise<boolean>;

export function useUnsavedSessionGuard({
    dirtySetCount,
    isFinishing,
    confirm,
}: {
    dirtySetCount: number;
    isFinishing: boolean;
    confirm: Confirm;
}) {
    const blocker = useBlocker(
        useCallback(() => dirtySetCount > 0 && !isFinishing, [dirtySetCount, isFinishing]),
    );

    useEffect(() => {
        function warnBeforeLeaving(event: BeforeUnloadEvent) {
            if (dirtySetCount > 0 && !isFinishing) event.preventDefault();
        }

        window.addEventListener("beforeunload", warnBeforeLeaving);
        return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
    }, [dirtySetCount, isFinishing]);

    useEffect(() => {
        if (blocker.state !== "blocked") return;

        let isCurrent = true;
        void confirm({
            title: "Discard unsaved set changes?",
            message: `${dirtySetCount === 1 ? "One set has" : `${dirtySetCount} sets have`} unsaved changes. Save them before leaving if you want to keep the edits.`,
            confirmLabel: "Discard and leave",
            variant: "danger",
        }).then((confirmed) => {
            if (!isCurrent || blocker.state !== "blocked") return;
            if (confirmed) blocker.proceed();
            else blocker.reset();
        });

        return () => {
            isCurrent = false;
        };
    }, [blocker, confirm, dirtySetCount]);
}
