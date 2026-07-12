import {useContext} from "react";
import {ConfirmDialogContext} from "./confirm-dialog.context";

export function useConfirmDialog() {
    const confirm = useContext(ConfirmDialogContext);

    if (!confirm) throw new Error("useConfirmDialog must be used inside ConfirmDialogProvider");
    return confirm;
}
