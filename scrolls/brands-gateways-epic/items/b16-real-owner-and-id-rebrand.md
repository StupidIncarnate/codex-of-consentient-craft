# B16: an owner must be a real, parsed object; an id may never be re-branded into another field

> **Re-planned 2026-09-29.** Order, chunking and sizes for this item are in [`EPIC.md`, "Phases 3 and 4 — the plan"](../EPIC.md), section 4.3. That plan wins on order and size; this file still specifies the rules. Counts below are from 2026-09-26 unless marked.

| | |
|---|---|
| Phase | Phase 4 — brands |
| Source | `scrolls/brands-types-tests-rules.md` (BR), B7 "an owner must be a real object", lines 801-816; B8 "an id may not be re-branded into another field", lines 818-888; rows 2259-2260 |
| Needs | [B15](b15-brand-migration.md) |
| Unblocks | T-items (Phase 5 runs alongside/after this), and Z01–Z07 |
| Packages touched | Wherever B15's migration created a contract only to get a name (B7), and wherever a re-brand of an id into another field exists today (B8) — census both at the start of this item, since B15's own migration may have already fixed some incidentally |
| Checks to run | `lint,typecheck,unit` |
| Split | One agent builds `require-real-owner` (reuses [B02](b02-contract-index-and-unused-contracts.md)'s C1 index); one agent builds `ban-id-rebrand` (needs the type checker); a third wave fixes whatever either rule flags |
| Runs alone | No |

## Why

**B7.** [B12](b12-require-object-contract-brands.md)'s B2 and B3 (no standalone brand, derived text)
close off inventing a new brand name directly — but a model blocked by those two rules could still invent
an *object* only to get a name for one field:

```
// flagged — contentContract is never parsed or built as a whole; only its field is used
const text = contentContract.shape.text.parse(raw);

// left alone — questContract is parsed as a whole when quest.json is read
const quest = questContract.parse(JSON.parse(raw));
```

An owner contract must count as parsed as a whole, in C1's sense (built in
[B02](b02-contract-index-and-unused-contracts.md)), somewhere in production code. C1 also counts a parse
of one field (`contentContract.shape.text.parse(raw)`) as the *contract* being used — B7 does not; that
difference is B7's whole job. A use of the owner as a type does not count either, since a branded object
can only come from a parse ([B12](b12-require-object-contract-brands.md)'s B1) — a type-only use adds
nothing except a way out: a function typed on `Content` that nothing calls.

**B8.** A value that carries an owner's `id` brand may not be parsed into a field with a different
brand. This closes the one way around B1's compiler refusal: since the compiler already refuses an id in
a differently-branded field, the only way around that refusal today is a re-parse — B8 refuses the
re-parse too, so the only fix left is the right one: reuse the id schema ([B13](b13-owner-field-reuse.md)'s
B4).

```
// before — mintedBy has its own brand, so the id is re-branded to fit
mintedBy: z.string().uuid().brand<'WorkItemMintedBy'>().optional(),
const next: WorkItem = { ...item, mintedBy: workItemContract.shape.mintedBy.parse(parent.id) };

// after — mintedBy reuses the id schema, so the id fits as it is
mintedBy: workItemId.optional(),
const next: WorkItem = { ...item, mintedBy: parent.id };
```

```
// flagged — parent.id carries 'WorkItemId', an owner's id
workItemContract.shape.mintedBy.parse(parent.id)

// left alone — createdAt is not an id, so copying the value is fine
workItemContract.shape.startedAt.parse(item.createdAt)
// left alone — a plain string from outside, parsed once
questContract.shape.id.parse(rawFromUrl)
```

## What counts as an id, and the three known re-brands (B8)

An id is a brand declared on an owner's `id` key. B8 only sees ids that **have** an owner — three
re-brands in the code (as of the source doc's read) show the edge:

| Re-brand | Where | Does B8 catch it? |
|---|---|---|
| `QuestWorkItemId` becomes `ProcessId` | `command-chat-output-emit-transformer.ts:48`: `processIdContract.parse(String(workItemId))` | Yes — the source is a work item's `id`. The fix depends on whether `ProcessId` got an owner ([B15](b15-brand-migration.md)'s open decision 4). |
| `ToolUseId` becomes `ToolName`, to use as a Map key | `merge-tool-entries-transformer.ts:37`: `toolNameContract.parse(toolUseId)` | No — `ToolUseId` is declared on `chatEntry.toolUseId`, not on an `id` key. |
| `AgentIdCorrelation` becomes `AgentId` | `tool-use-id-from-parent-lines-transformer.ts:45`: `agentIdContract.parse(toolUseResult.agentId)` | No — `AgentIdCorrelation` is declared on a stream line's `agentId`. |

Once each of these ids has an owner (resolved in [B15](b15-brand-migration.md)'s open decision 4), B4
([B13](b13-owner-field-reuse.md)) makes `toolUseId` and `agentId` reuse the owner's id, and B8 then sees
them too — this item runs *after* [B15](b15-brand-migration.md), so check whether these three re-brands
already disappeared as a side effect of that migration before treating them as still-open work.

**Most re-brands between brands that are not ids disappear under B2** ([B12](b12-require-object-contract-brands.md),
already executed by [B15](b15-brand-migration.md)) — the target is usually a standalone brand, which B2
removed, so the value now passes as a plain string with no parse at all:

| Re-brand (pre-migration) | Where | Under the rules |
|---|---|---|
| `displayLabelContract.parse(operation.text)`, from `OperationText` | `execution-panel-widget.tsx:341`, and twice more in the same file | `DisplayLabel` is gone; `operation.text` passes to a plain prop |
| `claudePermissionContract.parse(permission)`, from `McpPermission` | `settings-permissions-add-broker.ts:76` | Both gone; the settings contract's field brands the value when the settings are parsed |
| `filePathContract.parse(String(sessionFilePath))`, from `AbsoluteFilePath` | `quest-monitor-watcher-start-broker.ts:142` | Both gone; the path is a plain string |
| `repoRootCwdContract.parse(quest.worktreePath)` | `quest-cwd-resolve-broker.ts:81` | `RepoRootCwd` is gone (open decision 2, per [B15](b15-brand-migration.md)) |

Confirm each of these four is actually gone (i.e., [B15](b15-brand-migration.md) already removed the
standalone brand and the re-parse) before spending time on it in this item — if it is already gone,
check the box and move on; if it somehow survived the migration, fix it here.

**An object's own id copied into another of its own fields is a value, not a reference, and is left
alone.** `quest-write-route-broker.ts:54` sets `folder: questContract.shape.folder.parse(fields.folder ??
id)`, so a new quest's folder name defaults to its id, by design. B8 allows this specifically when the id
and the target field are properties of the **same object literal being parsed**:

```
// left alone — the quest's own id, into the same quest's folder
questContract.parse({ id, folder: fields.folder ?? id, … })
// flagged — another work item's id, into this work item's field
const next: WorkItem = { ...item, mintedBy: workItemContract.shape.mintedBy.parse(parent.id) };
```

## Current state

No rule folder named `require-real-owner` or `ban-id-rebrand` exists in
`packages/eslint-plugin/src/brokers/rule/` (confirmed this session, same scan as other items). This is
new work.

The three specific re-brand file/line citations above (`command-chat-output-emit-transformer.ts:48`,
`merge-tool-entries-transformer.ts:37`, `tool-use-id-from-parent-lines-transformer.ts:45`) and the four
"disappears under B2" citations were **not re-checked this session** — by the time this item runs,
[B15](b15-brand-migration.md) will already have changed most of the surrounding code; re-read each file
fresh rather than trusting these line numbers.

## Work

1. **Build `require-real-owner`.** Reuses [B02](b02-contract-index-and-unused-contracts.md)'s C1 index
   (parse-site tracking) — an owner contract is flagged when nothing in production code parses it *as a
   whole* (not just one of its fields via `.shape.<key>.parse(...)`). This needs the same index C1 uses,
   so it runs **ward only**, for the same three reasons C1 does (per BR "Where each rule runs": it reads
   other files; a contract is flagged for what other files do not contain; the fix — adding a whole-object
   parse — usually lands in a different file than the one holding the contract).
2. **Build `ban-id-rebrand`.** Needs the type checker: check the static type of the argument to a field
   schema's `.parse` call. Flag when that argument's static type carries a brand declared on some owner's
   `id` key, and the field being parsed into carries a *different* brand. The same-object exception needs
   a syntax check too: the id and the target field must be properties of the same object literal being
   parsed (`questContract.parse({ id, folder: fields.folder ?? id })`). Ward only — the type checker.
3. **Census both rules' likely hits fresh**, after [B15](b15-brand-migration.md) has landed, rather than
   trusting this file's pre-migration citations.
4. **Run both rules as a scan over the whole repo before switching them on**, hand-check a sample.
5. **Fix every flagged instance.** For `require-real-owner`: either delete the object (it was only ever a
   name-holder — inline its one field's brand directly where it's used, or restructure so the object is
   actually parsed as a whole somewhere real) or add a real whole-object parse where the data genuinely
   enters production (e.g., at a boundary that currently reads only one field off it). For `ban-id-rebrand`:
   change the target field to reuse the source id's schema (per [B13](b13-owner-field-reuse.md)'s B4),
   removing the field's own separate brand.
6. **Switch both rules on** once the repo passes clean.

## Lint rules this item adds or changes

| Rule | What it checks | Pre-edit? |
|---|---|---|
| `require-real-owner` | An owner contract must be parsed as a whole somewhere in production, not only through one of its fields | **No** — needs [B02](b02-contract-index-and-unused-contracts.md)'s repo-wide parse-site index |
| `ban-id-rebrand` | An id-branded value (declared on some owner's `id` key) may not be parsed into a differently-branded field, except when both are properties of the same object literal being parsed | **No** — needs the type checker |

## Teaching text this item changes

From BR "Architecture docs" (rows 2259-2260, referenced by line number in the item prompt — cross-check
against the actual table before writing, since this item's own read of BR's architecture-docs table did
not find distinct 2259/2260-specific rows beyond what [B13](b13-owner-field-reuse.md) already covers for
B4/B8 jointly at row 2332-2333). Confirm during execution which exact doc rows are still open for B7/B8
specifically and fold them into the Z-phase sweep
([Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md)) rather than
duplicating [B13](b13-owner-field-reuse.md)'s already-claimed rows.

## Done when

- [ ] `require-real-owner` exists, is ward-only, reads [B02](b02-contract-index-and-unused-contracts.md)'s
      index, and is scanned/hand-checked before switching on.
- [ ] `ban-id-rebrand` exists, is ward-only, uses the type checker, respects the same-object exception,
      and is scanned/hand-checked before switching on.
- [ ] Every flagged owner-only-for-a-name object is fixed (deleted or given a real whole-object parse).
- [ ] Every flagged id re-brand is fixed by reusing the source id's schema.
- [ ] Both rules are switched ON.
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0.

## Traps

- Every file/line citation in this item is pre-[B15](b15-brand-migration.md)-migration — re-read fresh,
  do not trust the numbers.
- Do not build `ban-id-rebrand` as a syntax-only rule — it genuinely needs the type checker to know
  whether the argument's static type carries an id brand; a text-pattern match will both over- and
  under-fire.
- The same-object exception is narrow: id and target field must be in the *same* object literal being
  parsed. Do not widen it to "the same function" or "the same broker" — that would let real bugs (a
  different object's id copied in) through.

## Concessions made while executing

