import type {ExerciseView} from "../../hooks/useExercises";

interface ExerciseStatusTabsProps {
    view: ExerciseView;
    onChange: (view: ExerciseView) => void;
}

export function ExerciseStatusTabs({view, onChange}: ExerciseStatusTabsProps) {
    return (
        <div
            className="inline-flex w-fit rounded-[11px] border border-line bg-panel p-1"
            role="tablist"
            aria-label="Exercise status"
        >
            {(["active", "archived"] as const).map((option) => (
                <button
                    key={option}
                    className={`min-h-11 rounded-[8px] px-4 text-xs font-extrabold tracking-[0.08em] uppercase transition ${view === option ? "bg-flame text-ink" : "text-dim hover:text-cream"}`}
                    type="button"
                    role="tab"
                    aria-selected={view === option}
                    onClick={() => onChange(option)}
                >
                    {option === "active" ? "Active" : "Archived"}
                </button>
            ))}
        </div>
    );
}
