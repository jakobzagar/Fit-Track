# FitTrack domain language

FitTrack models a personal exercise library and the lifecycle of planned, active, and completed training records. These terms are the canonical language used across product behavior and documentation.

## Language

**User**:
The person who owns an isolated exercise library and workout history.
_Avoid_: Account, athlete

**Exercise**:
A reusable, user-owned movement definition that may appear in many workouts. Archiving removes it from new selection without deleting historical references.
_Avoid_: Workout exercise, movement record

**Workout**:
A user-owned ordered training plan or record that moves through draft, active, and completed states. It owns its workout exercises and sets.
_Avoid_: Routine, session record

**Workout exercise**:
An occurrence of an exercise inside one workout, including its position and workout-specific notes.
_Avoid_: Exercise, movement

**Workout set**:
One planned or recorded effort belonging to a workout exercise, expressed with repetitions or duration and optionally weight.
_Avoid_: Exercise set, result

**Active workout**:
The user's single workout currently being performed. A user cannot have more than one active workout.
_Avoid_: Open workout, current routine

**Completed workout**:
A historical workout record that is read-only until deliberately reopened.
_Avoid_: Archived workout, finished routine

**Previous performance**:
The most recent completed effort for the same exercise from another owned workout, shown as context during an active workout.
_Avoid_: Personal record, exercise history
