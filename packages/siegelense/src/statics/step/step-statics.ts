/**
 * PURPOSE: The step vocabulary's own knobs — every step verb this repo ships, grouped by whether a
 * verb ACTS on the page (and therefore captures unasked), TARGETS one (and therefore participates in
 * the ambiguity rule), or needs a BROWSER at all — plus the two defaults a caller gets when it omits
 * them from a step or a batch. `stepVerbContract` derives its enum from `verbs.all` rather than
 * retyping the list, so a new verb arriving in a later chunk never leaves two lists to keep in sync.
 *
 * USAGE:
 * stepStatics.verbs.all;
 * // Returns every step verb this repo ships, 'seed' included
 *
 * stepStatics.defaults.stopOn;
 * // Returns 'error' — a batch stops on its first failing step unless the caller says 'never'
 */

export const stepStatics = {
  verbs: {
    // siegelense-tooling.md line 2365's "Steps that exist today and are kept" table, narrowed
    // to what this chunk ships — `look`, `key`, `paste`, `box`, `dom`, `storage`, `file`,
    // `console`, `network` and `ws` are the ones Part 7 defers to a later chunk. `seed` is the
    // first member that runs a recipe rather than driving a page.
    all: ['goto', 'waitFor', 'click', 'type', 'screenshot', 'eval', 'seed'],
    // goto, click and type change the page, so every one of them captures a shot unasked —
    // "Every acting step captures unasked" (chunk-02-driver-and-batch.md §2).
    acting: ['goto', 'click', 'type'],
    // waitFor, click and type are the three members whose step carries a `target`
    // selector, so all three are subject to the ambiguity rule: one match proceeds, AMBIGUOUS
    // throws carrying the candidates, NO MATCH throws naming the near misses
    // (siegelense-tooling.md line 1961).
    targeting: ['waitFor', 'click', 'type'],
    // A step in this list acts on or reads a live Playwright page, so it errors by NAME against a
    // browserless spec rather than answering an empty key (siegelense-tooling.md lines 1613,
    // 2128-2130). `seed` runs a recipe against the instance directly and never touches a page, so
    // it stays out of this list — adding it here would make the one verb built to work without a
    // browser refuse itself on the browserless lane it exists for.
    browser: ['goto', 'waitFor', 'click', 'type', 'screenshot', 'eval'],
  },
  defaults: {
    // A batch stops on its first failing step unless the caller sets `stopOn: 'never'`
    // (siegelense-tooling.md line 1638) — batching is the only way a sub-second race is
    // reachable, and stopping avoids running the rest of a batch past a step that already broke.
    stopOn: 'error',
    // A step that omits `expect` is assumed to succeed, so an unexpected failure is what stops
    // the batch (siegelense-tooling.md line 1639) — an attacking step names `expect: 'error'`
    // explicitly rather than the whole batch loosening for every step in it.
    expect: 'ok',
  },
} as const;
