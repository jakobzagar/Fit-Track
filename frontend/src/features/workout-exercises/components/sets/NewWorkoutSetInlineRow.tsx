import {useId, useRef, useState, type SubmitEvent} from "react";
import type {CreateWorkoutSetInput} from "@fit-track/shared/workout-exercises";
import {Button} from "../../../../components/ui/actions/Button.tsx";
import {parseNewWorkoutSet} from "../../schemas/workout-set-input.parser.ts";

interface NewWorkoutSetInlineRowProps {
    setNumber: number;
    onSubmit: (data: CreateWorkoutSetInput) => Promise<void>;
}

export function NewWorkoutSetInlineRow({setNumber, onSubmit}: NewWorkoutSetInlineRowProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const id = useId();
    const [reps, setReps] = useState("");
    const [weight, setWeight] = useState("");
    const [durationSeconds, setDurationSeconds] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const result = parseNewWorkoutSet({reps, weight, durationSeconds});
        if (!result.success) {
            setError(
                result.errors.reps ??
                    result.errors.weight ??
                    result.errors.durationSeconds ??
                    result.errors.form ??
                    "Check the entered values",
            );
            queueMicrotask(() =>
                formRef.current?.querySelector<HTMLInputElement>("input")?.focus(),
            );
            return;
        }

        setError("");
        setIsSubmitting(true);
        try {
            await onSubmit(result.data);
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
            ref={formRef}
            className="grid grid-cols-3 items-center gap-3 rounded-[11px] border border-dashed border-line bg-panel-raised/40 p-3 md:grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_148px]"
            onSubmit={handleSubmit}
        >
            <span className="hidden text-center text-xs font-black text-dim md:block">
                {setNumber}
            </span>
            <label>
                <span className="md:sr-only">Weight (kg)</span>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={weight}
                    disabled={isSubmitting}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${id}-error` : undefined}
                    onChange={(event) => setWeight(event.target.value)}
                />
            </label>
            <label>
                <span className="md:sr-only">Reps</span>
                <input
                    type="number"
                    min="1"
                    value={reps}
                    disabled={isSubmitting}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${id}-error` : undefined}
                    onChange={(event) => setReps(event.target.value)}
                />
            </label>
            <label>
                <span className="md:sr-only">Duration (seconds)</span>
                <input
                    type="number"
                    min="1"
                    value={durationSeconds}
                    disabled={isSubmitting}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${id}-error` : undefined}
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
            {error && (
                <p id={`${id}-error`} className="field-error col-span-full">
                    {error}
                </p>
            )}
        </form>
    );
}
