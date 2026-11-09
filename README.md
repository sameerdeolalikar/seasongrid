# SeasonGrid

SeasonGrid is a local calendar application for planning care of fictional workshop equipment. It combines a monthly calendar and schedule list with one-off or weekly recurrence, multi-day occurrences, same-equipment conflict notices, editing and undo/redo. Its Python/SQLite backend uses explicit calendar-day semantics and stores validated revisioned documents; planned work expands recurrence, exceptions and accessible scheduling interactions.

This is a new local application prototype with original synthetic examples and no claimed user base. It shares a small original local-workspace foundation with other personal utility projects; its domain model and workflows are specific to this application. No external service, account or telemetry is required.

## Implemented baseline

Monthly 42-cell calendar; date-only single/weekly schedules; multi-day spans; explicit occurrence counts; same-equipment overlap notices; search/equipment filters; series editing; undo/redo; JSON interchange and SQLite persistence.

## Run

Python 3.11+ is required; there are no Python runtime dependencies.

```sh
python3 server.py
# Open http://127.0.0.1:7435
```

Run from the repository root. `--port` changes the port; `--data PATH` chooses the SQLite library (default `.local-data/library.sqlite3`). Use the printed `127.0.0.1` address: Host, Origin and custom-header checks protect local mutations. This server is intended for local use, not internet hosting. Back up your library before experimenting with it.

## Test

```sh
python3 -m unittest discover -s tests -v
# In a separate terminal, run the server with a disposable --data path.
npm ci
npx playwright install chromium
npm run test:ui
```

Browser tests use Node.js 20+ and pinned Playwright. They create synthetic saved documents. Set `BASE_URL` for a custom test server and `UI_SCREENSHOTS` for screenshots outside application source. Chromium requires its normal OS libraries. No hosted CI or other-browser certification is claimed.

## Project structure

- `core.py`: normalization, constraints and domain analysis.
- `server.py`: loopback HTTP boundary and optimistic SQLite revisions.
- `web/`: interface, DOM/SVG rendering, dialogs and edit history.
- `examples/sample.json`: original fictional fixture.
- `tests/`: core regression cases and browser workflows.

## Scope and limits

Dates are calendar days, not instants: no time-of-day, timezone or DST scheduling is implemented. Ends are exclusive; adjacent bookings do not conflict. Editing one rendered occurrence edits the entire series. Individual exceptions, monthly rules, drag scheduling, reminders and external calendar integration are not available. Maximum 150 schedules and 52 occurrences each. Equipment names use case-insensitive matching for conflict checks.

Documents have at most 150 entries; the library supports 100 documents. Request/import size is bounded to 256 KB. Undo/redo is per-tab memory, not durable history. Export drafts before closing; there is no automatic crash recovery yet. Optimistic revisions reject stale saves, but merging conflicts is future work.

Event notes must be text of at most 1000 characters. Omitted, null or empty notes become “—”; other non-text values are rejected without changing the saved document.

## Planned development

[ROADMAP.md](ROADMAP.md) specifies approximately **74–110 hours** of proposed work with acceptance criteria. [QUALITY-PLAN.md](QUALITY-PLAN.md) describes representative review dimensions and transition cases. Estimates are future engineering effort, not completed hours or promised paid work. [CONTRIBUTING.md](CONTRIBUTING.md) explains contribution conventions.

## License

MIT. See [LICENSE](LICENSE).
