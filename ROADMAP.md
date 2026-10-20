# SeasonGrid: development plan

Estimated future effort: **74–110 hours**. These milestones are proposed, not implemented or approved paid work. Reassess scope after practical use.

## 1. Recurrence and exceptions — 18–26 hours

Add monthly rules, skipped dates and single/this-and-future/whole-series edits with explicit scope and deterministic expansion. Cover leap years and missing month days.

Definition of done: documented behavior, regression tests, matched before/after UI evidence where visible, valid import/export, and preservation of current undo and storage behavior.

## 2. Calendar interactions — 14–22 hours

Add keyboard and pointer rescheduling, range selection, drag cancellation and week/agenda views. Make continuation and conflict feedback unambiguous.

Definition of done: documented behavior, regression tests, matched before/after UI evidence where visible, valid import/export, and preservation of current undo and storage behavior.

## 3. Optional timed scheduling — 18–26 hours

Design timezone-aware events with explicit DST gaps/folds and duration semantics while retaining date-only schedules. Add frozen-zone fixtures rather than relying on machine locale.

Definition of done: documented behavior, regression tests, matched before/after UI evidence where visible, valid import/export, and preservation of current undo and storage behavior.

## 4. Async state and persistence — 12–18 hours

Add draft recovery, conflict comparison, cancellable imports and stable selection after recurrence edits or filtering.

Definition of done: documented behavior, regression tests, matched before/after UI evidence where visible, valid import/export, and preservation of current undo and storage behavior.

## 5. Accessibility and release — 12–18 hours

Add roving calendar focus, locale first-weekday preferences, RTL/reduced-motion checks and narrow-screen agenda workflows with cross-browser verification.

Definition of done: documented behavior, regression tests, matched before/after UI evidence where visible, valid import/export, and preservation of current undo and storage behavior.

## Suggested first session

Add single-occurrence exceptions with an explicit edit-scope dialog. Verify month boundaries, identity, undo and exported recurrence definitions.

## Delivery order

Freeze the user-visible requirement and a passing control before implementation. Finish one bounded feature at a time; do not combine all milestones into one evaluation prompt. Record implemented behavior and remaining limitations in the README after each release.
