# Fixer brief: clearing the big-bang type errors

You are one of many fixer agents working in parallel on the repo at
`/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot`. Run every command from there.

## What happened

Scripts migrated the repo's brand types in bulk and committed the result while the tree was red. The brand rules
they applied are in `scrolls/brands-types-tests-rules.md` (B1 to B6). In short:

- Every object contract, and every object nested in it, is branded, and so is every string and number field in it.
  A brand text is the owner plus the key (`QuestTitle`), derived, never chosen.
- A standalone brand contract (`baseNameContract`, `filePathContract`, ...) is gone. A value outside an object
  contract is a plain `string` or `number`.
- An id field reuses its owner's field: `Quest['id']`, or `questContract.shape.id` inside another contract.
- A value enters a branded field by going through the owner's parse, never by a cast.

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

## Report

Reply with exactly these sections:

```
FIXED — <file>: <one line per fix>
BLOCKED — <file>:<line> TS<code> — <the file that must change first> — <what it needs>
NOTES — <anything the operator must know, or "none">
```
