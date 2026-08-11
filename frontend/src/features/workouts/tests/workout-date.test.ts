import {describe, expect, test} from "vitest";
import {formatWorkoutDate, workoutDateInputValue} from "../utils/workout-date";

describe("workout dates", () => {
    test("preserves the stored calendar date independently of the local timezone", () => {
        const timestamp = "2026-07-26T00:00:00.000Z";

        expect(workoutDateInputValue(timestamp)).toBe("2026-07-26");
        expect(
            formatWorkoutDate(
                timestamp,
                {year: "numeric", month: "2-digit", day: "2-digit"},
                "en-CA",
            ),
        ).toBe("2026-07-26");
    });
});
