/**
 * PURPOSE: Every knob the KEY reads itself by — which elements become rows, which never do, the flag
 * vocabulary, the attrs allow-list and its budget, and the two glyphs the element column borrows for
 * a link. Reach for this over `driverStatics`: driverStatics holds the DRIVER's timings and sizes,
 * while everything here shapes one reading of one page and is quoted by the in-page source string,
 * the renderer and the contracts alike, so none of the three can disagree about what a flag is called
 * or how long a value may be.
 *
 * A FLAG EARNS ITS PLACE BY BEING ABSENT ON MOST ROWS (siegelense-tooling.md line 549). A flag that
 * fires everywhere is a column, a column that reads the same on every row is noise, and noise is what
 * a ~243-token key cannot afford. Adding one to `flags.all` is a change to this file, which is where
 * that rule is, so the rule is read by whoever would break it.
 *
 * USAGE:
 * keyStatics.flags.all;
 * // Returns the complete flag vocabulary, in siegelense-tooling.md's own table order
 *
 * keyStatics.excluded.tags;
 * // Returns the seven tags a key never carries a row for
 */

export const keyStatics = {
  // siegelense-tooling.md lines 417-437, in that table's own order. Each entry's comment is what the
  // flag ANSWERS and how it is computed, because the computation is the only part a reader cannot
  // recover from the name.
  flags: {
    all: [
      // a click here does nothing — and that looks exactly like a broken control. The attribute.
      'disabled',
      // the same, on a control that still TAKES the click and does nothing with it. Reported
      // separately from `disabled` precisely because it is that flag's blind spot.
      'aria-disabled',
      // where the keyboard is. `document.activeElement`.
      'focused',
      // control state, from the aria attributes.
      'selected',
      'checked',
      'expanded',
      // this subtree says it is loading — the stuck-spinner class, stated by the app. `aria-busy`.
      'busy',
      // a field the app has marked wrong. The sad path's own signal. `aria-invalid`, and `:invalid`.
      'invalid',
      // an announcement region — where a TOAST lands. Absence here is itself a finding.
      'live',
      'alert',
      'status',
      // painted, and invisible to assistive tech. Often a duplicate nobody meant. The attribute, on
      // a box that HAS size.
      'aria-hidden',
      // present, sized, painted, and not there. Slips past every visibility check, which is why
      // `opacity: 0` is flagged here rather than excluded alongside `display: none`.
      'invisible-opacity-0',
      // painted, but outside the viewport — `isVisible()` says true and means little. The rect
      // against innerWidth/innerHeight.
      'offscreen',
      // the reading is PARTIAL — rows exist past the fold of this container.
      // `scrollHeight`/`clientHeight` and `scrollTop`.
      'scrollable',
      // something paints on top. Also `isVisible(): true`. `elementFromPoint` at the rect centre.
      'covered',
      // the label is cut: `text` shows the full string and the screen does not.
      // `scrollWidth`/`scrollHeight` against client.
      'clipped-x',
      'clipped-y',
      // cut with no visual sign it was cut — worse than an ellipsis, and silent. Overflow hidden,
      // no `text-overflow`.
      'cut-no-ellipsis',
      // technically painted, perceptually absent. Computed colour against computed background.
      'low-contrast',
      // present in the tree, zero-size somewhere above. Walking up for a zero width or height.
      'collapsed-ancestor',
      // a container with a box and no content in it — the partial-blank case.
      'empty',
      // looks clickable, keyboard cannot reach it. A PROXY, and it says so: `cursor: pointer` on a
      // non-focusable tag with no `tabindex`. Never a listener check — React delegates to the root,
      // so a per-element listener answer is "none" for every button in this app.
      'not-tabbable',
      // an `<img>` that loaded nothing. A sprite-heavy UI hides this well. `naturalWidth === 0`.
      'broken-image',
    ],
  },
  excluded: {
    // siegelense-tooling.md line 573, "Excluded outright". Zero-size boxes, `display: none` and
    // `visibility: hidden` are excluded too, but they are conditions rather than names, so they live
    // in the reader's own source rather than in a list.
    tags: ['style', 'script', 'meta', 'link', 'title', 'head', 'noscript'],
  },
  rows: {
    // An element earns a row by being ADDRESSABLE: it carries a testId, paints its own words, is a
    // control, or is an image. A bare wrapper `<div>` is none of those, which is the whole mechanism
    // behind "intermediate wrapper divs collapse out on their own" (line 572) — nothing prunes them,
    // they simply never qualify.
    interactiveSelector:
      'a,button,input,select,textarea,summary,[role],[tabindex],[contenteditable]',
    // Tags that count as their own content for the `empty` flag and for the row test, beyond own
    // text and the interactive set.
    contentTags: ['img', 'svg', 'canvas', 'video', 'iframe'],
    // The tags whose `value` is a reading. Every control exposes a `value` property — a `<button>`
    // reports the empty string — so reading it off the interactive set put a bare `""` beside every
    // button's own label, which is the text column spending its width on nothing.
    fieldTags: ['input', 'textarea', 'select'],
  },
  attrs: {
    // siegelense-tooling.md lines 461-467 — exactly these, and nothing else. `data-*` is matched by
    // prefix rather than listed. `className` is deliberately absent and must stay absent: most of it
    // is build-generated, and a class is the MECHANISM behind something a person sees rather than
    // the thing itself, so putting it on every row invites a walk to settle a unit on it.
    allowed: ['href', 'maxlength', 'pattern', 'required', 'type', 'title'],
    dataPrefix: 'data-',
    // The element column already carries the testId, and a column that repeats it is a column
    // spending its budget on something already on the row.
    neverRepeated: ['data-testid'],
    // The determinism guard (lines 474-478). A framework writes runtime ids into data attributes —
    // one minted per mount — and a key carrying one differs between two readings of the same state,
    // which makes the element delta churn on a page nothing touched. Held as a {source, flags} pair
    // rather than a literal so the in-page source string can rebuild the RegExp on the other side of
    // `page.evaluate`, where a RegExp does not survive.
    runtimeIdPattern: {
      // a uuid; a 12+ character hex run; React's own `useId` form (`:r3:`); a 16+ character
      // base36-looking run with both letters and digits.
      source:
        '^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{12,}|:r[0-9a-z]+:|(?=[a-z0-9]*[0-9])(?=[a-z0-9]*[a-z])[a-z0-9]{16,})$',
      flags: 'iu',
    },
    // The same determinism guard, aimed at a DOM `id` rather than an attribute value, and looser
    // because a generated id is SEGMENTED where a generated attribute value usually is not.
    // Measured on this app: Mantine mints `mantine-gwrqe5vg6-label` and `mantine-nsg303p87-label`
    // per mount, so a key carrying either differs between two readings of the same state — which is
    // exactly the element-delta churn the attrs guard exists to prevent, arriving through the
    // element column instead. Matches a `-`/`_` segment of six or more characters holding a digit
    // with a letter somewhere AFTER it, which is what a random base36 run looks like and what
    // `EXECUTION_ROW_0`, `quest-row-2` and `main-content` do not.
    generatedIdPattern: {
      source:
        '(?:^|[-_])(?=[A-Za-z0-9]{6,}(?:[-_]|$))[A-Za-z0-9]*[0-9][A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*(?:[-_]|$)',
      flags: 'u',
    },
  },
  limits: {
    // The key is ~243 tokens because every column is short (line 469). These are what keep it there.
    maxRows: 200,
    maxDepth: 12,
    textChars: 80,
    attrsPerRow: 4,
    attrValueChars: 40,
  },
  contrast: {
    // WCAG AA's large-text floor. Below it a label is technically painted and perceptually absent;
    // the spec's own example row reads `low-contrast 1.4`.
    threshold: 3,
  },
  arrows: {
    // The element column's compact form, kept for the attrs column: `→ /queue`, never
    // `href="/queue"`. `↗` marks `target="_blank"`, which earns a glyph because a click that opens a
    // tab breaks a walk.
    link: '→',
    newTab: '↗',
  },
  naming: {
    // The four rungs (lines 578-585), each catching what the one above missed. `scope` is the tree
    // itself — a row's nesting under its nearest testId ancestor — and `nth` is the `[n/m]` marker,
    // so neither is a value this list hands anyone; the list exists so the ladder is stated where
    // the reader is built rather than only in the spec.
    ladder: ['own-text', 'attributes', 'scope', 'nth'],
    // Rung 2: the attributes that name an element which paints no words of its own, in the order
    // they are tried. `placeholder` and `value` are on this list because the spec names them, and
    // the reader serves them from their own COLUMNS instead of folding them into the text — for a
    // field they are different questions, so an empty field whose text read back as its own hint
    // would answer the wrong one.
    attributes: ['aria-label', 'title', 'alt', 'placeholder', 'value', 'name'],
  },
} as const;
