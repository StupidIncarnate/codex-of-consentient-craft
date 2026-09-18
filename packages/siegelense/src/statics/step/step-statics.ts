/**
 * PURPOSE: The step vocabulary's own knobs — the step verbs that ship, grouped by whether a verb
 * ACTS on the page (and therefore captures unasked), CAPTURES beside its own reading, or TARGETS an
 * element (and therefore participates in the ambiguity rule), plus the two defaults a caller gets
 * when it omits them from a step or a batch. `stepVerbContract` derives its enum from `verbs.all`
 * rather than retyping the list, so a verb arriving in a later chunk never leaves two lists to keep
 * in sync.
 *
 * USAGE:
 * stepStatics.verbs.all;
 * // Returns ['goto', 'waitFor', 'click', 'type', 'screenshot', 'eval', 'look', 'seed', 'until']
 *
 * stepStatics.defaults.stopOn;
 * // Returns 'error' — a batch stops on its first failing step unless the caller says 'never'
 */

export const stepStatics = {
  verbs: {
    // siegelense-tooling.md line 2557's "Steps that exist today and are kept" table, narrowed to
    // the verbs built so far — `key`, `paste`, `box`, `dom`, `storage` and `file`, and the other
    // new ones at line 2585, are what Part 7 still defers.
    all: [
      'goto',
      'waitFor',
      'click',
      'type',
      'screenshot',
      'eval',
      'look',
      'box',
      'dom',
      'seed',
      'until',
      'key',
      'health',
      'resize',
      'request',
      'before',
      'file',
      'storage',
      'paste',
      'hold',
    ],
    // goto, click, type, key, resize and paste CHANGE the page. `look` does not, which is why it is not here — but it
    // still captures, through `capturing` below.
    acting: ['goto', 'click', 'type', 'key', 'resize', 'paste'],
    // Which verbs resolve a shot path, and therefore capture. `acting` plus `look`: "Returns the
    // KEY inline and writes the SHOT, returning its path" (siegelense-tooling.md line 2587). Kept
    // apart from `acting` rather than folded into it, because `acting` also answers "did this step
    // change the page", and a reading step that answered yes to that would be a lie in every place
    // that asks.
    capturing: ['goto', 'click', 'type', 'look', 'key', 'health', 'resize', 'paste', 'hold'],
    // The members whose step carries a `target` selector or a `ref`, so each is subject to the
    // ambiguity rule: one match proceeds, AMBIGUOUS throws carrying the candidates, NO MATCH throws
    // naming the near misses (siegelense-tooling.md line 2109). A `ref` can never be ambiguous — it
    // binds to one element — but it resolves through the same door, which is what keeps one place
    // deciding whether a step may act at all.
    targeting: ['waitFor', 'click', 'type', 'paste'],
    // Which verbs act on or read a live Playwright page, so each errors by NAME against a
    // browserless spec rather than answering an empty key (siegelense-tooling.md lines 1613,
    // 2128-2130). `seed` is the first verb that is NOT one: it touches disk and HTTP and never a
    // screen — "a recipe touches STATE, never a screen" (siegelense-recipes.md line 471) — so it
    // runs against `dungeonmaster-headless` exactly as it runs against a browsered lane. `until`
    // sits outside this list too, for a different reason: only its `file` form needs no browser,
    // while its `visible`/`predicate`/`console`/`response` forms do — that split happens PER FORM
    // inside `stepUntilBroker` itself, not here, so this list stays "every member needs a browser
    // for every form" rather than "sometimes".
    browser: [
      'goto',
      'waitFor',
      'click',
      'type',
      'screenshot',
      'eval',
      'look',
      'box',
      'dom',
      'key',
      'health',
      'resize',
      'before',
      'storage',
      'paste',
      'hold',
    ],
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
