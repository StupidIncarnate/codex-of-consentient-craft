# T09: A generated catalog of the test infrastructure

| | |
|---|---|
| Phase | Phase 5 — tests and mocking |
| Source | `scrolls/brands-types-tests-rules.md`, "What dungeonmaster ships for tests, what the gateway holds, and how models find it" (lines 1956-1986) |
| Needs | B03, T05, T06 |
| Unblocks | none named |
| Packages touched | `mcp` (`get-testing-patterns`), `shared` (session snippet) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent |
| Runs alone | no |

## Why

`@dungeonmaster/testing` ships the cover (I/O trap, MSW setup) and the mocking API; the gateway holds
the test data for outside packages (each wrapper's proxy, each module's stubs, beside the code they
belong to). A consumer's `node_modules` copy of `@dungeonmaster/testing` is not indexed by the search
tools a model uses, but the gateway's pieces live in the consumer's own `packages/@gateway/`, which they
do index. Without a generated catalog and a pointer to it, a model has no single place to learn what test
infrastructure exists and where — it either invents its own or misses what is already there.

## Current state

- `get-testing-patterns` is served from
  `packages/mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts`,
  confirmed to exist. Its current content was not read in full in this pass; treat every specific line
  number the source doc cites (e.g. `:623`, `:734`, `:225`) as "not checked" until the executing agent
  opens the file, since this doc's own line numbers are dated 2026-09-24/25 and the file has likely
  changed since.
- No generated catalog exists yet — confirmed by reading the broker file's presence only, not its
  content; the executing agent should confirm directly whether any catalog-building step already exists
  before writing one from scratch.
- The session-snippet pointer does not exist yet — `packages/shared/src/statics/session-snippet/session-snippet-statics.ts`
  exists (confirmed present) but was not read for this specific pointer's presence.

## Work

1. **Generate the catalog from `@dungeonmaster/testing`'s entry points and every `.proxy`/`.stub` file,
   with each file's PURPOSE header.** The catalog's rows are: name, purpose, import path — read
   mechanically off each file's own PURPOSE header (the same header every file in this repo already
   carries per the comment-discipline convention) rather than hand-maintained prose, so the catalog cannot
   drift from the code it describes.

2. **Wire the catalog into `get-testing-patterns`.** The broker should build or read the generated catalog
   and serve it as part of its output, rather than the hand-written testing-patterns text carrying its own
   separate, driftable list of what exists.

3. **Have the lint messages that mention test infrastructure read the same generated list**, per the
   doc's own requirement that "neither can drift from the code." Specifically: `enforce-proxy-child-creation`'s
   message (T1), and `ban-invented-failures`'s message (T5, naming the recorded-failure stub to use) should
   resolve their suggestion text from this same catalog/list, not a separately hand-written string.

4. **Add a session-snippet pointer** in `packages/shared/src/statics/session-snippet/session-snippet-statics.ts`
   naming the catalog and that `get-testing-patterns` serves it — this reaches every session start, in
   every repo `dungeonmaster init` has touched, per the doc's own channel table:

   | Channel | When the model sees it | What it carries |
   |---|---|---|
   | The trap's and MSW's failure message (T8) | when a unit test makes a call nothing staged | the call, and what to stage it with |
   | The lint error (T5) | when it writes a hand-made failure | the recorded-failure stub to use instead |
   | `enforce-proxy-child-creation` (T1) | when a proxy leaves out a wrapper its file calls | the wrapper proxy's name and the file it sits in |
   | `get-testing-patterns` | at session start | a catalog of the test infrastructure: name, purpose, import path |
   | A session snippet | every session start, in every repo `dungeonmaster init` touched | a pointer to the catalog |

## Lint rules this item adds or changes

None new. This item changes what existing rule messages (T1's `enforce-proxy-child-creation`, T5's
`ban-invented-failures`) point at — the source, not the rule's own trigger condition.

## Teaching text this item changes

The session-snippet addition above is this item's own teaching-text change; do not duplicate it in Z02
(architecture/session-snippet text) — Z02 covers the other snippet rows named in BR's architecture-docs
table, and this specific pointer belongs to T09 since it only makes sense once the catalog it points to
exists.

## Done when

- A generated catalog exists, built from `@dungeonmaster/testing`'s entry points and every `.proxy`/`.stub`
  file's PURPOSE header.
- `get-testing-patterns` serves the catalog (or reads from it) instead of, or alongside, hand-written
  prose describing what exists.
- `enforce-proxy-child-creation` and `ban-invented-failures`'s lint messages resolve their suggestion text
  from the same catalog.
- A session snippet points at the catalog.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- This item needs B03 (every workspace package's stubs and proxies moved onto per-file `.proxy`/`.stub`
  imports — the gateway's own equivalent, G26, already landed), T05 (recorded failures replacing invented
  ones) and T06 (proxy child creation resolving each per-file path) all done first — the catalog it builds
  has to describe the finished layout, not the pre-migration one, or it ships stale the day it is written.
- Do not hand-write the catalog's rows — generate them from PURPOSE headers, so a later file addition or
  rename updates the catalog automatically instead of silently going stale.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
