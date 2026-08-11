import {useEffect, type ReactNode} from "react";
import {Icon} from "../display/Icon";

interface FeedbackProps {
    children: ReactNode;
    tone?: "error" | "info" | "success";
    onDismiss?: () => void;
    autoDismissMs?: number;
}

const tones = {
    error: "border-negative/30 bg-negative/8 text-red-200",
    info: "border-line bg-panel-raised text-dim",
    success: "border-positive/30 bg-positive/8 text-green-200",
};

export function Feedback({
    children,
    tone = "error",
    onDismiss,
    autoDismissMs = tone === "success" ? 5000 : undefined,
}: FeedbackProps) {
    useEffect(() => {
        if (!onDismiss || !autoDismissMs) return;
        const timeout = window.setTimeout(onDismiss, autoDismissMs);
        return () => window.clearTimeout(timeout);
    }, [autoDismissMs, onDismiss]);

    return (
        <div
            className={`flex items-start justify-between gap-3 rounded-[10px] border px-4 py-3 text-sm leading-6 ${tones[tone]}`}
            role={tone === "error" ? "alert" : "status"}
        >
            <span>{children}</span>
            {onDismiss && (
                <button
                    className="-my-2 -mr-2 grid size-11 shrink-0 place-items-center rounded-md text-current opacity-70 transition hover:bg-white/8 hover:opacity-100"
                    type="button"
                    aria-label="Dismiss message"
                    onClick={onDismiss}
                >
                    <Icon name="close" size={15} />
                </button>
            )}
        </div>
    );
}
