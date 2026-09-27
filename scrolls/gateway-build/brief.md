# Gateway build: shared brief for every agent

`scrolls/adapters-to-one-place.md` is the original design doc for the gateway.
`scrolls/gateway/followup-sustainability.md` now holds the standards that replace and extend it,
including the current layout and naming rules, under "Gateway standards decided." This file keeps
only the build-phase decisions that other files still cite by number: "What we are building" rule 3
and rule 6, and "Orchestrator rulings made during the build" 1 and 2. The numbering below stays
fixed for that reason. A superseded item says so and points to where the current rule lives.

## What we are building

1. The gateway's layout and subpath naming now live in "Gateway standards decided," in
   `scrolls/gateway/followup-sustainability.md`.
2. A wrapper keeps the outside function's own name when it keeps the same meaning and a compatible
   argument shape. When the arguments or the meaning change, the wrapper gets a new name, such as
   `readFileIfExists` or `readJsonFile`.
3. Curated modules expose no raw functions. `@dungeonmaster/node/fs` never re-exports Node's raw
   `readFile`. Everything that touches the outside world on the host is wrapped: Node `fs`,
   `child_process`, `net`, `readline`, and the browser's `fetch`, `localStorage`, `WebSocket`. Every
   `@dungeonmaster/bin` module is curated.
4. A package that needs its own setup work, such as testing-library, gets wrapped instead of passed
   through. Every other outside package our code imports gets a pass-through (`export * from
   'pkg'`). Item 15 of `scrolls/gateway/followup-sustainability.md` describes the problem the one
   wrapped case, `render`, caused.
5. No adapter stays now. `scrolls/gateway/followup-sustainability.md`, in "Replace every adapter
   with the gateway, then delete what nothing uses," says the `adapters/` folder type goes away once
   the last adapter moves.
6. Do not move code. Write new files in the gateway. Existing adapters and their callers stay
   untouched until the orchestrator starts the consumption phase, which
   `scrolls/gateway/followup-sustainability.md` describes in "Replace every adapter with the
   gateway, then delete what nothing uses."
7. A gateway wrapper takes and returns plain values, or the outside package's own types, and never
   imports our contracts. Items 22 and 26 of `scrolls/gateway/followup-sustainability.md` set the
   fuller rule: return `unknown` for our own data, and use the gateway's own branded schema for a
   gateway type one of our contracts holds.

## Rules that bind every agent

- Never disable a lint rule to make gateway or caller code pass: no `eslint-disable`, no turning a
  rule off in config, no `// @ts-ignore`, no `as unknown as`. When a rule blocks correct code, stop
  and report the rule name, the file, and the exact error.
- Stay in your lane. Touch only the files and folders your prompt names — another agent may be
  working in the next folder at the same time.
- Sad paths are part of the job: a missing file, permission denied, a directory where a file should
  be, invalid JSON, empty output, a process that exits non-zero or never starts, a network refusal,
  a timeout. When an adapter being replaced skips one of these, the gateway version handles it,
  proven by a test.

## Orchestrator rulings made during the build

1. **Calling shape.** A wrapper that keeps the outside function's name also keeps its calling shape,
   positional arguments included. A wrapper with a new name takes one destructured object argument.
2. **Case collisions.** When a global is also exported by a Node module whose name matches ignoring
   case, the global has no subpath of its own. `URL` and `URLSearchParams` come from
   `@dungeonmaster/node/url`. Two sibling folders must never differ only by case.
3. **Staging a Node-style error in a proxy:** use `.implement(() => { throw error; })`. The testing
   package's `.throws()` rewrites a non-`Error` value into a new `Error` and loses `code`.
4. **A `bin` function never hides a failure as an empty value.** A missing program, a non-zero exit,
   or a folder that is not a repo is either thrown with the command and its output, or returned as
   an explicit value.
