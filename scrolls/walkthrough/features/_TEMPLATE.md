# <Feature name> — walkthrough

Case prefix: `<XX>` · Packages: `<pkg>`, `<pkg>` · Main sources: `<scroll or doc paths>`

## What changed

Five to ten plain lines. What the feature does now, and what the refactor changed about it. Name the commits or
scrolls a reader can check. State rules in the present tense.

## How to reach it

A table of every surface a person can touch for this feature.

| Surface | How to reach it | Notes |
|---|---|---|
| CLI command / URL / MCP tool / slash command | exact invocation or route | build needed? dev server? |

## Setup

A numbered list. What must be true before case 1: a build, a dev server, seeded data (name the `siegelense start
--seed <recipe>` or hydration recipe that produces it), an instance id to capture, and so on.

## Test cases

One table per sub-surface. Every documented flag, every enum value, every error path, every UI state gets a row.
The walkthrough driver fills the Result column during the walkthrough.

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| XX-01 | exact command, or exact clicks | what the person should see, concretely | `none` / `unit` / `integration` / `e2e`, with one test path | P1 | |

- **Pri P1** — no automated test crosses the real surface for this case, or the only tests mock the boundary.
  These are the cases the walkthrough exists for.
- **Pri P2** — covered by tests, but worth one look on the real surface.
- **Pri P3** — well covered. Run it only if time allows.
- **Result** — blank until run. Then `pass`, `fail DEF-NN`, or `skip — <reason>`.

## Known open items

Items the scrolls already record as unfinished or suspect for this feature, each with a pointer.

## Sources

The scrolls, docs and entry-point files a future session should read to understand this feature.
