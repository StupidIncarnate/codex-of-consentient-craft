/**
 * PURPOSE: The .gitignore lines ward's install ensures in a target repo. Reach for this rather than
 * spelling an entry at the responder: every one of these names something WARD writes into a repo it
 * runs in, so the list and the code that produces the files have to be changed together.
 *
 * USAGE:
 * gitignoreEntriesStatics.entries;
 * // Returns the lines to ensure, in the order they are appended
 */

export const gitignoreEntriesStatics = {
  entries: [
    // Ward's own run results.
    '.ward/',
    // Playwright's per-run output. Ward reaps these on the seven-day evidence window, but a repo
    // running e2e at all accumulates them faster than it commits, and they are pure output.
    'test-results/',
    // Ward writes this into the package root of every repo it runs e2e in and unlinks it
    // best-effort, so a run killed before its own cleanup leaves one behind. The GLOB is
    // load-bearing: the name carries the run's port, so an exact-name entry ignores nothing.
    '.ward-playwright-report*.json',
  ],
} as const;
