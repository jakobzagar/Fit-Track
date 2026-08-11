import {useEffect, useRef, useState} from "react";
import type {WorkoutSet} from "../../workouts/workout.types";
import type {UpdateWorkoutSetInput} from "../schemas/workout.exercises.schemas";
import {parseEditedWorkoutSet} from "../schemas/workout-set-input.parser";

interface WorkoutSetDraftOptions {
    workoutSet: WorkoutSet;
    onSave: (data: UpdateWorkoutSetInput) => Promise<void>;
    onToggleCompletion: (completed: boolean, data: UpdateWorkoutSetInput) => Promise<void>;
    onDirtyChange?: (setId: string, isDirty: boolean) => void;
}

function valuesFrom(workoutSet: WorkoutSet) {
    return {
        reps: workoutSet.reps?.toString() ?? "",
        weight: workoutSet.weight?.toString() ?? "",
        durationSeconds: workoutSet.durationSeconds?.toString() ?? "",
    };
}

export function useWorkoutSetDraft({
    workoutSet,
    onSave,
    onToggleCompletion,
    onDirtyChange,
}: WorkoutSetDraftOptions) {
    const firstInputRef = useRef<HTMLInputElement>(null);
    const [values, setValues] = useState(() => valuesFrom(workoutSet));
    const [savedValues, setSavedValues] = useState(() => valuesFrom(workoutSet));
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const isDirty = Object.keys(values).some(
        (key) => values[key as keyof typeof values] !== savedValues[key as keyof typeof values],
    );

    useEffect(() => {
        onDirtyChange?.(workoutSet.id, isDirty);
        return () => onDirtyChange?.(workoutSet.id, false);
    }, [isDirty, onDirtyChange, workoutSet.id]);

    function setValue(field: keyof typeof values, value: string) {
        setValues((current) => ({...current, [field]: value}));
    }

    function parse() {
        const result = parseEditedWorkoutSet(values);
        if (result.success) {
            setError("");
            return result.data;
        }
        setError(
            result.errors.reps ??
                result.errors.weight ??
                result.errors.durationSeconds ??
                result.errors.form ??
                "Check the entered values",
        );
        queueMicrotask(() => firstInputRef.current?.focus());
        return null;
    }

    async function execute(
        action: (data: UpdateWorkoutSetInput) => Promise<void>,
        successMessage: string,
        rememberValues: boolean,
    ) {
        const data = parse();
        if (!data) return;
        setIsSaving(true);
        try {
            await action(data);
            if (rememberValues) setSavedValues(values);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : successMessage);
        } finally {
            setIsSaving(false);
        }
    }

    return {
        firstInputRef,
        values,
        setValue,
        error,
        isSaving,
        isDirty,
        save: () => execute(onSave, "Failed to save set", true),
        saveAndComplete: () =>
            execute((data) => onToggleCompletion(true, data), "Failed to complete set", true),
        toggleCompletion: (completed: boolean) =>
            execute((data) => onToggleCompletion(completed, data), "Failed to save set", false),
    };
}
