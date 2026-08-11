import {AppError} from "../../../common/errors/app.error.js";
import type {WorkoutStatus} from "@fit-track/shared/workouts";

export function assertWorkoutIsMutable(status: WorkoutStatus) {
    if (status === "COMPLETED") {
        throw new AppError("Completed workout is read-only", 409);
    }
}
