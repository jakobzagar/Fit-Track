import {AppError} from "../../common/errors/app.error.js";

type WorkoutStatus = "DRAFT" | "ACTIVE" | "COMPLETED";

export function assertWorkoutIsMutable(status: WorkoutStatus) {
    if (status === "COMPLETED") {
        throw new AppError("Completed workout is read-only", 409);
    }
}
