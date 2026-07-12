import {useState} from "react";
import type {WorkoutSet} from "../../workouts/workout.types.ts";
import type {UpdateWorkoutSetInput} from "../schemas/workout.exercises.schemas.ts";
import {Button} from "../../../components/ui/Button.tsx";
import {Icon} from "../../../components/ui/Icon.tsx";

interface WorkoutSetInlineRowProps {
    workoutSet: WorkoutSet;
    disabled: boolean;
    onSave: (data: UpdateWorkoutSetInput) => Promise<void>;
    onToggleCompletion: (completed: boolean, data: UpdateWorkoutSetInput) => Promise<void>;
}

export function WorkoutSetInlineRow({
    workoutSet,
    disabled,
    onSave,
    onToggleCompletion,
}: WorkoutSetInlineRowProps) {
    const [reps, setReps] = useState(workoutSet.reps?.toString() ?? "");
    const [weight, setWeight] = useState(workoutSet.weight?.toString() ?? "");
    const [durationSeconds, setDurationSeconds] = useState(
        workoutSet.durationSeconds?.toString() ?? "",
    );
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    function getData(): UpdateWorkoutSetInput | null {
        if (reps === "" && durationSeconds === "") {
            setError("Enter reps or duration");
            return null;
        }

        const nextReps = reps === "" ? null : Number(reps);
        const nextWeight = weight === "" ? null : Number(weight);
        const nextDurationSeconds = durationSeconds === "" ? null : Number(durationSeconds);

        if (
            (nextReps !== null && (!Number.isInteger(nextReps) || nextReps <= 0)) ||
            (nextWeight !== null && (!Number.isFinite(nextWeight) || nextWeight < 0)) ||
            (nextDurationSeconds !== null &&
                (!Number.isInteger(nextDurationSeconds) || nextDurationSeconds <= 0))
        ) {
            setError("Check the entered values");
            return null;
        }

        setError("");
        return {
            reps: nextReps,
            weight: nextWeight,
            durationSeconds: nextDurationSeconds,
        };
    }

    async function run(action: (data: UpdateWorkoutSetInput) => Promise<void>) {
        const data = getData();
        if (!data) return;

        setIsSaving(true);
        try {
            await action(data);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Failed to save set");
        } finally {
            setIsSaving(false);
        }
    }

    const isCompleted = workoutSet.completedAt !== null;

    return (
        <div
            className={`rounded-[11px] border p-3 transition ${isCompleted ? "border-positive/40 bg-positive/8" : "border-line bg-ink"}`}
        >
            <div className="grid grid-cols-3 items-end gap-3 md:grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_148px]">
                <span className="hidden pb-4 text-center text-xs font-black text-dim md:block">
                    {workoutSet.setNumber}
                </span>
                <label>
                    Kg
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={weight}
                        disabled={disabled || isSaving || isCompleted}
                        onChange={(event) => setWeight(event.target.value)}
                    />
                </label>
                <label>
                    Reps
                    <input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        value={reps}
                        disabled={disabled || isSaving || isCompleted}
                        onChange={(event) => setReps(event.target.value)}
                    />
                </label>
                <label>
                    Sec
                    <input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        value={durationSeconds}
                        disabled={disabled || isSaving || isCompleted}
                        onChange={(event) => setDurationSeconds(event.target.value)}
                    />
                </label>
                <div className="col-span-full grid grid-cols-2 gap-2 md:col-span-1 md:grid-cols-1">
                    <Button
                        className="w-full"
                        variant={isCompleted ? "secondary" : "primary"}
                        size="sm"
                        type="button"
                        disabled={disabled || isSaving}
                        onClick={() => void run((data) => onToggleCompletion(!isCompleted, data))}
                    >
                        {!isCompleted && <Icon name="check" size={14} />}
                        {isCompleted ? "Undo set" : "Complete"}
                    </Button>
                    {!isCompleted && (
                        <Button
                            className="w-full"
                            variant="ghost"
                            size="sm"
                            type="button"
                            disabled={disabled || isSaving}
                            onClick={() => void run(onSave)}
                        >
                            {isSaving ? "Saving..." : "Save changes"}
                        </Button>
                    )}
                </div>
            </div>
            {error && <p className="mt-2 text-xs text-negative">{error}</p>}
        </div>
    );
}
