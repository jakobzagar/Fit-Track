import {useState, type Dispatch, type SetStateAction} from "react";
import {
    addExerciseToWorkout as requestAddExerciseToWorkout,
    addWorkoutSet as requestAddWorkoutSet,
    setWorkoutSetCompletion,
    updateWorkoutSet,
} from "../../workout-exercises/api/workout-exercises.api";
import type {
    AddExerciseToWorkoutInput,
    CreateWorkoutSetInput,
    UpdateWorkoutSetInput,
} from "@fit-track/shared/workouts";
import {getPreviousPerformances} from "../../api/workouts.api";
import type {PreviousPerformance, Workout, WorkoutSet} from "@fit-track/shared/workouts";

export function useActiveWorkoutMutations(
    workoutId: string | undefined,
    setWorkout: Dispatch<SetStateAction<Workout | null>>,
    setPreviousPerformances: Dispatch<SetStateAction<PreviousPerformance[]>>,
    setError: Dispatch<SetStateAction<string>>,
) {
    const [copyingExerciseId, setCopyingExerciseId] = useState<string | null>(null);

    function replaceSet(workoutExerciseId: string, nextSet: WorkoutSet) {
        setWorkout((current) =>
            current
                ? {
                      ...current,
                      workoutExercises: current.workoutExercises.map((item) =>
                          item.id === workoutExerciseId
                              ? {
                                    ...item,
                                    sets: item.sets.map((set) =>
                                        set.id === nextSet.id ? nextSet : set,
                                    ),
                                }
                              : item,
                      ),
                  }
                : null,
        );
    }

    async function addExerciseToWorkout(data: AddExerciseToWorkoutInput) {
        if (!workoutId) return;
        setError("");
        try {
            const {workoutExercise} = await requestAddExerciseToWorkout(workoutId, data);
            setWorkout((current) =>
                current
                    ? {
                          ...current,
                          workoutExercises: [
                              ...current.workoutExercises,
                              {...workoutExercise, sets: []},
                          ],
                      }
                    : null,
            );
            const performances = await getPreviousPerformances(workoutId);
            setPreviousPerformances(performances.previousPerformances);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to add exercise");
            throw caught;
        }
    }

    async function addWorkoutSet(workoutExerciseId: string, data: CreateWorkoutSetInput) {
        if (!workoutId) return;
        setError("");
        const {workoutSet} = await requestAddWorkoutSet(workoutId, workoutExerciseId, data);
        setWorkout((current) =>
            current
                ? {
                      ...current,
                      workoutExercises: current.workoutExercises.map((item) =>
                          item.id === workoutExerciseId
                              ? {...item, sets: [...item.sets, workoutSet]}
                              : item,
                      ),
                  }
                : null,
        );
    }

    async function copyPreviousSet(workoutExerciseId: string, lastSet: WorkoutSet) {
        setCopyingExerciseId(workoutExerciseId);
        try {
            await addWorkoutSet(workoutExerciseId, {
                ...(lastSet.reps !== null && {reps: lastSet.reps}),
                ...(lastSet.weight !== null && {weight: lastSet.weight}),
                ...(lastSet.durationSeconds !== null && {durationSeconds: lastSet.durationSeconds}),
            });
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to copy set");
        } finally {
            setCopyingExerciseId(null);
        }
    }

    async function saveWorkoutSet(
        workoutExerciseId: string,
        workoutSetId: string,
        data: UpdateWorkoutSetInput,
    ) {
        if (!workoutId) return;
        const {workoutSet} = await updateWorkoutSet(
            workoutId,
            workoutExerciseId,
            workoutSetId,
            data,
        );
        replaceSet(workoutExerciseId, workoutSet);
    }

    async function toggleWorkoutSetCompletion(
        workoutExerciseId: string,
        workoutSetId: string,
        completed: boolean,
        data: UpdateWorkoutSetInput,
    ) {
        if (!workoutId) return;
        const {workoutSet} = await setWorkoutSetCompletion(
            workoutId,
            workoutExerciseId,
            workoutSetId,
            {...data, completed},
        );
        replaceSet(workoutExerciseId, workoutSet);
    }

    return {
        copyingExerciseId,
        setCopyingExerciseId,
        addExerciseToWorkout,
        addWorkoutSet,
        copyPreviousSet,
        saveWorkoutSet,
        toggleWorkoutSetCompletion,
    };
}
