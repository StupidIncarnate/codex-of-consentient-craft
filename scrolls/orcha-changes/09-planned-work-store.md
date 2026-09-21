# 09 — reading and writing the plan file

```
GOAL      A plan lands at <questFolder>/planned-work/<operationItemId>.json and comes back.
AFTER     07 (the shape)
BEFORE    15 · 17 · 18
PACKAGE   @dungeonmaster/orchestrator
MODEL     sonnet
```

**Small story, and it is separate because the path constant has a rule that catches people out.**

---

## BUILD

### The path

```
<questFolder>/
  quest.json                              ← workItems[]: the sessions that RAN
  planned-work/<operationItemId>.json     ← pieces[]: the sessions the planner INTENDED
  ward-results/<id>.json
  riftcarver-results/<id>.log
```

`planned-work` is a new dirname. It goes in
`packages/shared/src/statics/locations/locations-statics.ts` — **add it there, and do not spell the
string anywhere else.** A lint rule in this repo enforces that values from that module are the only
legal location-shape literals repo-wide.

**The trap:** that module's own header states the rule — a value "MUST be a complete filename or
dirname, something you would see whole in a directory listing." So `planned-work/<id>.json` is not one
value. It is a `plannedWork` dirname, composed with the id by the resolver broker the way every other
nested quest path already is. Putting the joined string in as one value breaks the module's contract
on the first read.

### The two brokers

| | |
|---|---|
| a read broker | takes `{ questFolder, operationItemId }`, returns the parsed plan or **null** |
| a write broker | takes `{ questFolder, operationItemId, plan }`, writes it |

**A missing plan file is `null`, not a throw.** A scope whose planner has not run yet legitimately has
none, and story 18 serves `piece: null` to a planner for exactly this reason.

**Write atomically**, the way `packages/orchestrator/src/brokers/quest/persist/quest-persist-broker.ts`
does. Copy its pattern rather than inventing one. A half-written plan file is a scope that cannot be read and cannot be
rewritten.

---

## DONE WHEN

Integration tests, using `installTestbedCreateBroker` from `@dungeonmaster/testing` for an isolated
temp directory under the OS `/tmp`. **Never write test files into the repo — not even `<repoRoot>/tmp`.**

```ts
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
const testbed = installTestbedCreateBroker({ baseName: BaseNameStub({ value: 'planned-work' }) });
```

| Assert | |
|---|---|
| a plan written then read comes back identical | round-trip |
| reading a missing file returns `null` | not a throw, not `{}` |
| the directory is created if absent | a first plan on a fresh quest |
| the path composes from the locations statics, not from a literal | assert the resolver, so a later rename is one edit |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| validate the plan on read | story 08 validates on WRITE, at the tool boundary. A file already on disk is read as-is |
| render it as markdown | story 18 |
| amend a plan | story 17's `amendment` payload |
