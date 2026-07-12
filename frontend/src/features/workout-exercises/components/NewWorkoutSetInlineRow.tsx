import {useState, type SubmitEvent} from "react";
import type {CreateWorkoutSetInput} from "../schemas/workout.exercises.schemas.ts";
import {Button} from "../../../components/ui/Button.tsx";

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
            className="grid grid-cols-3 items-end gap-3 rounded-[11px] border border-dashed border-line bg-panel-raised/40 p-3 md:grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_148px]"
            onSubmit={handleSubmit}
        >
            <span className="hidden pb-4 text-center text-xs font-black text-dim md:block">
                {setNumber}
            </span>
            <label>
                Kg
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={weight}
                    disabled={isSubmitting}
                    onChange={(event) => setWeight(event.target.value)}
                />
            </label>
            <label>
                Reps
                <input
                    type="number"
                    min="1"
                    value={reps}
                    disabled={isSubmitting}
                    onChange={(event) => setReps(event.target.value)}
                />
            </label>
            <label>
                Sec
                <input
                    type="number"
                    min="1"
                    value={durationSeconds}
                    disabled={isSubmitting}
                    onChange={(event) => setDurationSeconds(event.target.value)}
                />
            </label>
            <Button
                className="col-span-full w-full md:col-span-1"
                variant="secondary"
                size="sm"
                type="submit"
                disabled={isSubmitting}
            >
                {isSubmitting ? "..." : "Add"}
            </Button>
            {error && <p className="col-span-full text-xs text-negative">{error}</p>}
        </form>
    );
}
