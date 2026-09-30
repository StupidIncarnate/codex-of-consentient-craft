# DEF-131: `hold`, `reset`, `storage` and `dom` readings print raw JSON in the text view

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | siegelense |
| Found | 2026-09-28, walkthrough cases SL-076, SL-077, SL-080 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`results ... --kind steps` (the human view) still prints the `hold`, `reset`, `storage` and `dom` readings as raw JSON. `box` was fixed (`ref 24: 260×36 at (472, 351) — visible, in viewport (viewport 1280×720)`).

Also (SL-077): `dom` on a container returns `"text":""` (its words sit in children) with no hint.

## What should happen

Each of those step kinds reads as one readable line in the text view; raw JSON only under `--json`. For `dom` with empty own text, add a note such as `own text empty; N descendants have text — use text: "full"`.

## Where to look

The step-reading render transformers under `packages/siegelense/src/transformers/` (search `step-reading-render` / `results-answer-render`), and `packages/siegelense/src/transformers/dom-read/dom-read-transformer.ts`.

## History

`468a03425`, merge `b2366eb0c`, ward run `1790716477991-987e`: `box` and `seed` text views fixed (DEF-131, DEF-134). Contrast found at SL-077: `dom` shows the Name input's `id` and counts `PIXEL_BTN` as 3, so DEF-126 and DEF-127 were `look`-only bugs.
