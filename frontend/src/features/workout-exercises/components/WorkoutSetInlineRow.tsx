import {useState} from "react";
import type {WorkoutSet} from "../../workouts/workout.types.ts";
import type {UpdateWorkoutSetInput} from "../schemas/workout.exercises.schemas.ts";

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
            className={`rounded-lg border p-3 ${isCompleted ? "border-green-500 bg-green-50" : ""}`}
        >
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-end gap-2">
                <span className="pb-2 font-medium">{workoutSet.setNumber}</span>
                <label className="text-sm">
                    Weight
                    <input
                        className="block w-full rounded border p-2"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={weight}
                        disabled={disabled || isSaving || isCompleted}
                        onChange={(event) => setWeight(event.target.value)}
                    />
                </label>
                <label className="text-sm">
                    Reps
                    <input
                        className="block w-full rounded border p-2"
                        type="number"
                        min="1"
                        inputMode="numeric"
                        value={reps}
                        disabled={disabled || isSaving || isCompleted}
                        onChange={(event) => setReps(event.target.value)}
                    />
                </label>
                <label className="text-sm">
                    Seconds
                    <input
                        className="block w-full rounded border p-2"
                        type="number"
                        min="1"
                        inputMode="numeric"
                        value={durationSeconds}
                        disabled={disabled || isSaving || isCompleted}
                        onChange={(event) => setDurationSeconds(event.target.value)}
                    />
                </label>
                <button
                    className="rounded border px-3 py-2"
                    type="button"
                    disabled={disabled || isSaving}
                    onClick={() => void run((data) => onToggleCompletion(!isCompleted, data))}
                >
                    {isCompleted ? "Undo" : "✓"}
                </button>
            </div>

            {!isCompleted && (
                <button
                    className="mt-2 text-sm underline"
                    type="button"
                    disabled={disabled || isSaving}
                    onClick={() => void run(onSave)}
                >
                    {isSaving ? "Saving..." : "Save changes"}
                </button>
            )}
            {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
        </div>
    );
}
