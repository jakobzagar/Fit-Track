import type {ExerciseStatus} from "@fit-track/shared/exercises";

interface ExerciseStatusTabsProps {
    status: ExerciseStatus;
    onChange: (status: ExerciseStatus) => void;
}

export function ExerciseStatusTabs({status, onChange}: ExerciseStatusTabsProps) {
    return (
        <div
            className="inline-flex w-fit rounded-[11px] border border-line bg-panel p-1"
            role="tablist"
            aria-label="Exercise status"
        >
            {(["active", "archived"] as const).map((option) => (
                <button
                    key={option}
                    className={`min-h-11 rounded-[8px] px-4 text-xs font-extrabold tracking-[0.08em] uppercase transition ${status === option ? "bg-flame text-ink" : "text-dim hover:text-cream"}`}
                    type="button"
                    role="tab"
                    aria-selected={status === option}
                    onClick={() => onChange(option)}
                >
                    {option === "active" ? "Active" : "Archived"}
                </button>
            ))}
        </div>
    );
}
