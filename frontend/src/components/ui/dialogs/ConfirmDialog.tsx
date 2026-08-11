import type {RefObject} from "react";
import {Button} from "../actions/Button";
import type {ConfirmDialogOptions} from "./confirm-dialog.context";

export function ConfirmDialog({
    dialog,
    cancelButtonRef,
    onClose,
}: {
    dialog: ConfirmDialogOptions;
    cancelButtonRef: RefObject<HTMLButtonElement | null>;
    onClose: (confirmed: boolean) => void;
}) {
    return (
        <div
            className="confirm-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose(false);
            }}
        >
            <section
                className="confirm-dialog"
                data-confirm-dialog
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-message"
            >
                <span
                    className={`confirm-dialog-mark ${dialog.variant === "danger" ? "is-danger" : ""}`}
                >
                    !
                </span>
                <p className="eyebrow">Confirm action</p>
                <h2 id="confirm-dialog-title">{dialog.title}</h2>
                <p id="confirm-dialog-message" className="confirm-dialog-message">
                    {dialog.message}
                </p>
                <div className="confirm-dialog-actions">
                    <Button
                        ref={cancelButtonRef}
                        variant="secondary"
                        onClick={() => onClose(false)}
                    >
                        {dialog.cancelLabel ?? "Cancel"}
                    </Button>
                    <Button
                        variant={dialog.variant === "danger" ? "danger" : "primary"}
                        onClick={() => onClose(true)}
                    >
                        {dialog.confirmLabel ?? "Confirm"}
                    </Button>
                </div>
            </section>
        </div>
    );
}
