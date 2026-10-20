# SeasonGrid: quality and interaction plan

This is a finite, risk-based plan, not a claim to cover every possible corner case. No model comparison or winner is established. The application is an ordinary utility, not model-evaluation infrastructure. Some scenarios below require future features; never describe them as existing defects or inject defects to create an evaluation.

## Ten review dimensions

1. **Understanding:** implement the stated user outcome and distinguish current constraints from planned capability.
2. **Layout and alignment:** inspect the main workspace, inspector, dialogs, overflow containers and narrow-width reflow.
3. **Typography:** test long names, numbers/units, multiline content, clipping and readable hierarchy.
4. **Colors and styling:** check contrast, selected/disabled/error/conflict states and non-color indicators.
5. **Images, icons and assets:** verify original SVG/CSS visuals, geometry and export fidelity where relevant; mark unrelated asset work not applicable.
6. **Responsive behavior:** test 390px and desktop widths, browser zoom, long content and nested scroll. New touch/RTL behavior requires its own verification.
7. **Interactions and state:** exercise the disclosed transition cases below; check pointer and keyboard paths, undo, cancellation and persisted values.
8. **Accessibility and usability:** inspect semantic controls, meaningful names, tab order, focus return, Escape, visible focus and error announcements. Automated audits alone are insufficient.
9. **Completeness and regressions:** include a passing control, malformed input, empty/maximum documents, stale saves, import/export and the next normal action after the requested change.
10. **Rendered verification:** record actual screenshots and interaction outcomes at matched inputs, state and viewport. Distinguish implementation evidence from author verification; screenshots alone do not prove interactions.

## Domain transition cases

### Recurrence boundaries

Sequence: Inspect a multi-day event across October/November, edit its series, undo, then export; occurrence count and dates must remain consistent.

Control: An adjacent same-equipment event beginning at the exclusive end does not conflict.

### Date validity

Sequence: Exercise leap days, December/January boundaries, invalid dates and maximum occurrence counts; reject invalid input without partial saves.

Control: A one-off event normalizes to exactly one occurrence.

### Filtered editing

Sequence: Filter equipment, edit a recurring series, clear the filter and reopen; logical series identity and conflict notices must agree.

Control: Filtering alone never rewrites recurrence definitions.

### Future time/gesture interaction

Sequence: Drag one occurrence across a DST boundary and choose this-and-future scope; time semantics, exceptions, focus and undo must agree.

Control: A date-only event retains its original calendar date. PLANNED: timed events and exceptions.

## Cross-cutting cases

- Empty versus filtered-empty content; duplicate IDs; wrong schema version; whitespace, Unicode and very long text.
- Exact limits and one beyond; invalid numeric types; atomic rejection preserving the previous document.
- Save after undo/redo; import after dirty edits; cancel import; failed import then a valid retry; another-tab stale write.
- Dialog cancellation and focus return; deleting or filtering the focused item; keyboard operation without pointer input.
- Long lists inside constrained panels, 200% browser zoom, reduced motion and locale/RTL requirements when introduced.
- Future asynchronous work: delayed/out-of-order responses, cancellation, retries and storage failures. Freeze expected user outcomes before testing.

## Evidence and scope

Core and browser test files define current automated coverage. Do not equate this planning checklist with passed tests. Use two or three decisive disclosed sequences for a particular comparison plus a relevant preservation check. Give both implementations the same starting commit, prompt, fixtures and evidence access. Record ties and missing evidence honestly; complexity does not guarantee a difference between assistants. Full comparison transcripts, paid runs and actual submission approval are outside this application repository.
