import {useCallback, useEffect, useRef, useState, type ReactNode} from "react";
import {Button} from "./Button";
import {ConfirmDialogContext, type ConfirmDialogOptions} from "./confirm-dialog.context";

interface PendingDialog extends ConfirmDialogOptions {
    resolve: (confirmed: boolean) => void;
}

export function ConfirmDialogProvider({children}: {children: ReactNode}) {
    const [dialog, setDialog] = useState<PendingDialog | null>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const confirm = useCallback((options: ConfirmDialogOptions) => {
        return new Promise<boolean>((resolve) => {
            previousFocusRef.current = document.activeElement as HTMLElement | null;
            setDialog({...options, resolve});
        });
    }, []);

    const close = useCallback((confirmed: boolean) => {
        setDialog((current) => {
            current?.resolve(confirmed);
            return null;
        });
    }, []);

    useEffect(() => {
        if (!dialog) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        cancelButtonRef.current?.focus();

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") close(false);
            if (event.key !== "Tab") return;

            const focusable = document.querySelectorAll<HTMLElement>(
                "[data-confirm-dialog] button:not(:disabled)",
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
            previousFocusRef.current?.focus();
        };
    }, [close, dialog]);

    return (
        <ConfirmDialogContext value={confirm}>
            {children}
            {dialog && (
                <div
                    className="confirm-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) close(false);
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
                                onClick={() => close(false)}
                            >
                                {dialog.cancelLabel ?? "Cancel"}
                            </Button>
                            <Button
                                variant={dialog.variant === "danger" ? "danger" : "primary"}
                                onClick={() => close(true)}
                            >
                                {dialog.confirmLabel ?? "Confirm"}
                            </Button>
                        </div>
                    </section>
                </div>
            )}
        </ConfirmDialogContext>
    );
}
