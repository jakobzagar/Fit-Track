import {useState, type SubmitEvent} from "react";
import type {CreateWorkoutSetInput} from "../schemas/workout.exercises.schemas.ts";

interface NewWorkoutSetInlineRowProps {
    setNumber: number;
    onSubmit: (data: CreateWorkoutSetInput) => Promise<void>;
}

export function NewWorkoutSetInlineRow({setNumber, onSubmit}: NewWorkoutSetInlineRowProps) {
    const [reps, setReps] = useState("");
    const [weight, setWeight] = useState("");
    const [durationSeconds, setDurationSeconds] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        if (reps === "" && durationSeconds === "") {
            setError("Enter reps or duration");
            return;
        }

        const data: CreateWorkoutSetInput = {
            ...(reps !== "" && {reps: Number(reps)}),
            ...(weight !== "" && {weight: Number(weight)}),
            ...(durationSeconds !== "" && {durationSeconds: Number(durationSeconds)}),
        };

        setError("");
        setIsSubmitting(true);
        try {
            await onSubmit(data);
            setReps("");
            setWeight("");
            setDurationSeconds("");
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Failed to add set");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form
            className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-end gap-2"
            onSubmit={handleSubmit}
        >
            <span className="pb-2 font-medium">{setNumber}</span>
            <label className="text-sm">
                Weight
                <input
                    className="block w-full rounded border p-2"
                    type="number"
                    min="0"
                    step="0.01"
                    value={weight}
                    disabled={isSubmitting}
                    onChange={(event) => setWeight(event.target.value)}
                />
            </label>
            <label className="text-sm">
                Reps
                <input
                    className="block w-full rounded border p-2"
                    type="number"
                    min="1"
                    value={reps}
                    disabled={isSubmitting}
                    onChange={(event) => setReps(event.target.value)}
                />
            </label>
            <label className="text-sm">
                Seconds
                <input
                    className="block w-full rounded border p-2"
                    type="number"
                    min="1"
                    value={durationSeconds}
                    disabled={isSubmitting}
                    onChange={(event) => setDurationSeconds(event.target.value)}
                />
            </label>
            <button className="rounded border px-3 py-2" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "..." : "Add"}
            </button>
            {error && <p className="col-span-full text-sm text-red-700">{error}</p>}
        </form>
    );
}
