# Fixer brief: clearing the big-bang type errors

You are one of many fixer agents working in parallel on the repo at
the repo root the operator names in your prompt. Run every command from there.

## What happened

Scripts migrated the repo's brand types in bulk and committed the result while the tree was red. The brand rules
they applied are in `scrolls/brands-types-tests-rules.md` (B1 to B6). In short:

- Every object contract, and every object nested in it, is branded, and so is every string and number field in it.
  A brand text is the owner plus the key (`QuestTitle`), derived, never chosen.
- A standalone brand contract (`baseNameContract`, `filePathContract`, ...) is gone. A value outside an object
  contract is a plain `string` or `number`.
- An id field reuses its owner's field: `Quest['id']`, or `questContract.shape.id` inside another contract.
- A value enters a branded field by going through the owner's parse, never by a cast.

## Operator decisions (these override anything a script did)

1. **Returns are branded. A parameter an owner claims takes `Owner['field']`; every other parameter may be plain.**
   A parameter named for an owner's field (`questId`) takes `Quest['id']`, as `enforce-owner-field-reuse` (R8)
   enforces everywhere but `errors/`; the caller parses. When a script retyped any OTHER parameter (no owner claims
   its name, like `processId`), a harness input, an error constructor input or a local accumulator from
   `string`/`number` to a brand, and callers pass plain values, loosen the receiver back to the plain type. Parse
   where the value becomes part of a returned or stored contract value. Test harnesses (`test/harnesses/**`) always
   take raw input.
2. **A contract used only as a generic constraint is not branded** (`T extends ItemWithId`, `TTarget extends
   HydrationTarget`). Remove its `.brand()`. It describes a structure, not data.
3. **A record's keys stay plain** (`z.record(z.string(), …)`), unless the key is an owner's id, which then reuses
   that owner's field (`questContract.shape.id`).
4. **An object that holds functions is parsed only for its data.** Zod drops fields it does not list, so
   `toolRegistrationContract.parse({ name, handler })` loses `handler` at runtime. Write
   `{ ...contract.parse({ <data fields> }), handler }`, or keep the functions out of the zod schema as a TypeScript
   intersection. Never let a parse strip a function or a field the caller needs.
5. **Brand text order:** `.default(x)` comes before `.brand<'X'>()`.
6. **A contract never imports itself**, and an id reuses its owner's field instead of a parallel brand.

## Your job

You get a batch of 1 to 5 files and the exact type errors in each. Make every listed error go away with a real fix.

1. Read each file in your batch in full, and the contract or type each error names.
2. Fix the cause. Typical fixes:
   - Import a type that moved: a standalone brand became plain, so its import goes and the type becomes
     `string`/`number`, or the type moved to its owner (`Quest['id']`).
   - A stub of a deleted standalone brand (`BaseNameStub({ value: 'x' })`) becomes the literal (`'x'`).
   - A plain value going into a branded field: build the object through its owner contract's `.parse(...)`, or
     parse at the boundary where the value enters. In a test, use the owner's stub.
   - A function parameter typed `string` that receives an owner id: type it as the owner's field (`Quest['id']`).
3. If a recipe for your error kind is given below your batch, follow it.

## Never

- `as never`, `as unknown as`, `as any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `any`.
- A cast to make a plain value fit a branded type (`'x' as QuestId`). Parse it, or use the stub in tests.
- Deleting or skipping a test, or weakening an assertion, to make an error go away.
- `jest.mock`, `jest.spyOn`, a new `beforeEach`.
- Editing a file that is not in your batch. If the real cause is in another file (a contract, a shared type, a
  function signature elsewhere), do not work around it: report it under BLOCKED with the file and what it needs.
- git commands of any kind, builds, `npm install`, ward, tsc, jest, eslint. The operator runs every check.
- Forking or dispatching sub-agents.
- Restoring a file from git (`git show HEAD:...`, `git checkout`). Other agents' work sits in the same tree.

## Unit-test stage (typecheck is at 0; keep it there)

You get failing unit test files. Run them first and read the real failure:
`npm run ward -- --only unit -- <your test files>` (file-scoped: prints each failing assertion inline). At most five
runs. Then fix the CAUSE, which is almost always in production code or a contract, not the test:

- **An INVALID test that no longer throws means validation was lost.** A script turned a validating standalone brand
  (`instanceIdContract` with a regex, `absoluteFilePathContract` with a refine, a `.min(1)`) into a plain type or a bare
  inline brand, and its check went with it. Find the original under `tmp/deletions/<wave>/<path>` and put the same check
  back where the value enters: the owning object contract's field keeps the base schema's refinements
  (`instanceId: z.string().regex(/^inst_[0-9a-f]{8}$/u).brand<'KillArgsInstanceId'>()`), or the args parser parses
  through that field. Never delete the INVALID test, never loosen its expectation.
- **A parse that now throws on a VALID input** means a script added a runtime parse whose schema is stricter than what
  flows there (a strict object, a brand refinement). Fix the schema or the parse site; do not change the valid input
  unless it was genuinely invalid data.
- **An error message changed** because the thrown ZodError now comes from a different schema: restore the original
  check so the message is what the test asserts. Change the expected message only when the old contract is truly gone
  and the new message is the right one; say so under NOTES.
- **A stub default or a stripped function** (a parse dropped a field; decision 4): fix the stub or the parse site.

A fix to production code must keep typecheck at 0: `node tmp/bigbang/tools/diag.cjs --pkgs=<pkg> --full`.

## Report

Reply with exactly these sections:

```
FIXED — <file>: <one line per fix>
BLOCKED — <file>:<line> TS<code> — <the file that must change first> — <what it needs>
NOTES — <anything the operator must know, or "none">
```
