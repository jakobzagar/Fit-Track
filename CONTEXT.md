# FitTrack domain language

FitTrack models a personal exercise library and the lifecycle of planned, active, and completed training records. These terms are the canonical language used across product behavior and documentation.

## Language

**User**:
The person who owns an isolated exercise library and workout history.
_Avoid_: Account, athlete

**Exercise**:
A reusable, user-owned movement definition that may appear in many workouts. Exercise names are unique per user without regard to letter case, while their chosen casing is preserved for display. Archiving removes an exercise from new selection without releasing its name or deleting historical references.
_Avoid_: Workout exercise, movement record

**Workout**:
A user-owned ordered training plan or record that moves through draft, active, and completed states. It owns its workout exercises and sets.
_Avoid_: Routine, session record

**Workout exercise**:
The single occurrence of an exercise inside one workout, including its position, workout-specific notes, and the exercise description preserved when the occurrence was added. Each exercise may appear at most once in a workout; repeated efforts belong to its workout sets rather than separate workout exercise blocks.
_Avoid_: Exercise, movement

**Workout set**:
One planned or recorded effort belonging to a workout exercise, expressed with repetitions, duration, or both, and optionally weight.
_Avoid_: Exercise set, result

**Active workout**:
The user's single workout currently being performed. A user cannot have more than one active workout.
_Avoid_: Open workout, current routine

**Completed workout**:
A historical workout record that cannot be edited unless deliberately reopened, but can be deleted without reopening.
_Avoid_: Archived workout, finished routine

**Completed at**:
The instant when an active workout becomes completed. It is absent for draft and active workouts and is cleared if a completed workout is reopened.
_Avoid_: Performed at, planned date, workout date

**Previous performance**:
The most recent completed effort for the same exercise from another owned workout, shown as context during an active workout.
_Avoid_: Personal record, exercise history
