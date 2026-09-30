# DEF-132: `dom` with `text: "full"` glues text nodes together

| | |
|---|---|
| Status | ready |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-078 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`run ... --steps '[{"step":"goto","path":"/"},{"step":"dom","target":"[data-testid=\"GUILD_LIST\"]","text":"full"}]'` (run_18) returns `"text":"GUILDS+ Guild 1"`: every text node glued together (`textContent`), so the `<p>` "GUILDS" and the `<button>` "+" read as one word and could be taken for a guild named "GUILDS+". Checked in Chrome on the same element: `textContent` gives `"GUILDS+ Guild 1"`, `innerText` gives `"GUILDS\n\n+\nGuild 1"`, and walking the text nodes gives `"GUILDS · + · Guild 1"`.

Today: `dom-read-transformer.ts:42` still has `text = (element.textContent || '')...`.

## What should happen

Full text joins trimmed text nodes with ` · `. That keeps one line and does not depend on layout.

## Where to look

- `packages/siegelense/src/transformers/dom-read/dom-read-transformer.ts:42` (the old ledger cited `dom-read-layer-adapter.ts:46`) and its test (`:16-24` asserts `element.textContent`)
- `packages/siegelense/src/statics/docs/` (a line in the docs statics)

## History

Small change. Was `queued`.
