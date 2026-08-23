import {useId} from "react";
import {Button} from "../../../../../components/ui/actions/Button";
import {Icon} from "../../../../../components/ui/display/Icon";
import type {WorkoutSet} from "@fit-track/shared/workouts";
import {useWorkoutSetDraft} from "../../hooks/useWorkoutSetDraft";
import type {UpdateWorkoutSetInput} from "@fit-track/shared/workouts";

interface WorkoutSetInlineRowProps {
    workoutSet: WorkoutSet;
    disabled: boolean;
    onSave: (data: UpdateWorkoutSetInput) => Promise<void>;
    onToggleCompletion: (completed: boolean, data: UpdateWorkoutSetInput) => Promise<void>;
    onDirtyChange?: (setId: string, isDirty: boolean) => void;
}

export function WorkoutSetInlineRow(props: WorkoutSetInlineRowProps) {
    const {workoutSet, disabled} = props;
    const id = useId();
    const {
        firstInputRef,
        values,
        setValue,
        error,
        isSaving,
        isDirty,
        save,
        saveAndComplete,
        toggleCompletion,
    } = useWorkoutSetDraft(props);
    const isCompleted = workoutSet.completedAt !== null;
    const inputDisabled = disabled || isSaving || isCompleted;

    return (
        <div
            className={`rounded-[11px] border p-3 transition ${isCompleted ? "border-positive/40 bg-positive/8" : "border-line bg-ink"}`}
        >
            <div className="grid grid-cols-3 items-center gap-3 md:grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_148px]">
                <span className="hidden text-center text-xs font-black text-dim md:block">
                    {workoutSet.setNumber}
                </span>
                <SetInput
                    ref={firstInputRef}
                    label="Weight (kg)"
                    value={values.weight}
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    disabled={inputDisabled}
                    errorId={error ? `${id}-error` : undefined}
                    onChange={(value) => setValue("weight", value)}
                />
                <SetInput
                    label="Reps"
                    value={values.reps}
                    min="1"
                    inputMode="numeric"
                    disabled={inputDisabled}
                    errorId={error ? `${id}-error` : undefined}
                    onChange={(value) => setValue("reps", value)}
                />
                <SetInput
                    label="Duration (seconds)"
                    value={values.durationSeconds}
                    min="1"
                    inputMode="numeric"
                    disabled={inputDisabled}
                    errorId={error ? `${id}-error` : undefined}
                    onChange={(value) => setValue("durationSeconds", value)}
                />
                <div className="col-span-full md:col-span-1">
                    {!isCompleted && isDirty ? (
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
                            <Button
                                className="w-full"
                                variant="ghost"
                                size="sm"
                                type="button"
                                disabled={disabled || isSaving}
                                onClick={() => void save()}
                            >
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                            <Button
                                className="w-full"
                                size="sm"
                                type="button"
                                disabled={disabled || isSaving}
                                onClick={() => void saveAndComplete()}
                            >
                                Save &amp; complete
                            </Button>
                        </div>
                    ) : (
                        <Button
                            className="w-full"
                            variant={isCompleted ? "secondary" : "primary"}
                            size="sm"
                            type="button"
                            disabled={disabled || isSaving}
                            onClick={() => void toggleCompletion(!isCompleted)}
                        >
                            {!isCompleted && <Icon name="check" size={14} />}
                            {isCompleted ? "Undo set" : "Complete"}
                        </Button>
                    )}
                </div>
            </div>
            {error && (
                <p id={`${id}-error`} className="field-error mt-2">
                    {error}
                </p>
            )}
        </div>
    );
}

interface SetInputProps {
    ref?: React.Ref<HTMLInputElement>;
    label: string;
    value: string;
    min: string;
    step?: string;
    inputMode: "decimal" | "numeric";
    disabled: boolean;
    errorId?: string;
    onChange: (value: string) => void;
}

function SetInput({ref, label, value, errorId, onChange, ...inputProps}: SetInputProps) {
    return (
        <label>
            <span className="md:sr-only">{label}</span>
            <input
                ref={ref}
                type="number"
                value={value}
                aria-invalid={errorId ? true : undefined}
                aria-describedby={errorId}
                onChange={(event) => onChange(event.target.value)}
                {...inputProps}
            />
        </label>
    );
}
