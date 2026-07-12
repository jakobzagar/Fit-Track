import type {ReactNode} from "react";

interface FeedbackProps {
    children: ReactNode;
    tone?: "error" | "info" | "success";
}

const tones = {
    error: "border-negative/30 bg-negative/8 text-red-200",
    info: "border-line bg-panel-raised text-dim",
    success: "border-positive/30 bg-positive/8 text-green-200",
};

export function Feedback({children, tone = "error"}: FeedbackProps) {
    return (
        <div
            className={`rounded-[10px] border px-4 py-3 text-sm leading-6 ${tones[tone]}`}
            role="status"
        >
            {children}
        </div>
    );
}
