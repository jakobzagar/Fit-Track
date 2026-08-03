import {useEffect, useId, useRef, type ReactNode} from "react";
import {Icon} from "./Icon";

interface FormDialogProps {
    title: string;
    description?: string;
    children: ReactNode;
    onClose: () => void;
}

export function FormDialog({title, description, children, onClose}: FormDialogProps) {
    const titleId = useId();
    const descriptionId = useId();
    const dialogRef = useRef<HTMLElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        previousFocusRef.current = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const firstField = dialogRef.current?.querySelector<HTMLElement>(
            "input:not(:disabled), textarea:not(:disabled), select:not(:disabled)",
        );
        (firstField ?? closeButtonRef.current)?.focus();

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== "Tab") return;
            const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
                "button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]",
            );
            if (!focusable?.length) return;

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
    }, [onClose]);

    return (
        <div
            className="form-dialog-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                ref={dialogRef}
                className="form-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
            >
                <div className="form-dialog-header">
                    <div>
                        <h2 id={titleId}>{title}</h2>
                        {description && <p id={descriptionId}>{description}</p>}
                    </div>
                    <button
                        ref={closeButtonRef}
                        className="form-dialog-close"
                        type="button"
                        aria-label="Close dialog"
                        onClick={onClose}
                    >
                        <Icon name="close" size={18} />
                    </button>
                </div>
                {children}
            </section>
        </div>
    );
}
