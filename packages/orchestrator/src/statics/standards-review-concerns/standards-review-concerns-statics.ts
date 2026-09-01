/**
 * PURPOSE: The five standing quality concerns, written once and interpolated into all three reviewer
 * prompts. Reach for this when you want to change what EVERY reviewer looks for; a question only one
 * kind of reviewer asks belongs in that reviewer's own prompt instead.
 *
 * USAGE:
 * standardsReviewConcernsStatics.markdown;
 * // The five concerns as review questions, ready to interpolate into a reviewer prompt
 *
 * THIS IS GUIDANCE, NOT A LEDGER. Nothing counts what a reviewer answers here and no gate refuses a
 * signal over a concern nobody took. An earlier version made each (file, concern) pair a unit with a
 * recorded disposition, and the server refused the parent's `done` until every one carried an entry.
 * That measured 18 dispositions competing with real review work inside one session's turn, so the
 * ledger, the checklist tool and the gate all went. What is left is the five questions.
 *
 * WHY THESE FIVE AND NOT MORE. Every mechanical rule is already enforced by lint, so a concern that
 * repeats one buys nothing and costs a reading pass. What is here is the judgement a linter cannot
 * make. Dead code is deliberately absent — whether an export has a consumer is a property of the
 * whole import graph after later work lands, and no session can answer it from inside its own scope.
 *
 * BUDGET: three reviewer prompts interpolate this whole block, so a character here is three
 * characters served, and each of those three prompts has to clear
 * `mcpToolResultStatics.maxVerbatimChars` on its own.
 */

export const standardsReviewConcernsStatics = {
  markdown: `## The five standing concerns

Take all five against a file in ONE reading. Open the file once, ask every question below, then move
to the next file. Do not make five passes over the same tree.

**Skip anything lint already enforces.** Naming, imports, exports, destructuring, return types,
no-any, proxy colocation, stub usage, no-console, silent catches, unused code, test name prefixes,
\`describe\` shape. Lint has those. What is left is judgement.

**Fix what you find, where the fix is small and clearly yours.** Hand up anything structural, anything
crossing into work you do not own, and anything needing a decision.

### craft

- **Does the name agree with the signature, and the signature with the body?** Read all three in that
  order. A \`findLatest\` that returns the first match is a finding.
- **Does a thrown error say enough to act on?** An error naming no path, no id and no cause leaves the
  next reader nothing.
- **Is the PURPOSE header true?** Lint checks it exists. Nothing checks it is correct, because no test
  and no typecheck reads a comment — and \`discover\` with \`verbose: true\` then serves that header to every later
  agent as the file's description. Four shapes to flag: a return-shape claim the code contradicts; a
  validation claim the contract does not make; a claim derived from the file's NAME rather than its
  body; a PURPOSE that only restates the signature. Read the zod chain itself rather than trusting a
  \`.refine()\` message. Correct the header to what the code does now. Correct the code instead only
  when the code is independently wrong.

### perf

Four shapes are findings:

1. **Quadratic loops** — \`.filter(... .find(...))\`, or a repeated \`indexOf\`/\`includes\` inside a loop.
2. **N+1** — a per-item \`await\` on a database, HTTP or filesystem call that could batch.
3. **Sync I/O on a hot path** — \`readFileSync\`, \`execSync\`.
4. **Unbounded work** — a loop or recursion with no cap, over data a caller or the disk supplies.

Simplification counts here too: an abstraction nothing needs, a conditional chain that flattens to one
expression, a hand-rolled scan a \`Map\` or \`Set\` does in one pass.

**Judge the path it sits on.**

| Where the code runs | Finding? |
|---|---|
| a request, websocket or orchestration path | likely |
| startup, a migration, a one-off | usually not |
| an array bounded to a small constant | usually not |

### dedup

New code reimplementing what the repo already has, or two new files doing one job under two names.

**Search the whole repo, never just the files in front of you.** Search only your own scope and two
sessions ship the same function twice, because the earlier copy is already on disk where only a
repo-wide \`discover\` grep sees it.

The duplicate detector at \`packages/tooling/src/brokers/duplicate-detection/\` compares string and
regex literals ONLY. It reads no AST, so a clean run from it says nothing about duplicate logic.
Structural duplication is yours to judge: name both implementations and say what you compared —
parameters, return shape, control flow. Never report that two things looked similar.

### integrity

**Skip the signature sweep.** \`tsc\` and ward already catch every consumer that stops compiling. What
you own is the change that compiles and still means something different:

- **A semantic change behind an unchanged signature.** Same parameters, same return type, different
  meaning — units, ordering, whether a bound is inclusive, what an empty array now signifies.
  \`discover\` grep the export name, then read each call site against the NEW meaning.
- **A stub or fixture updated to keep a suite green** rather than to encode the new behaviour. Read
  \`@dungeonmaster/shared\` contracts hardest: a branded type breaks consumers silently at parse time,
  and a \`.default(...)\` papering over a break may itself be the defect.

### test-cases

**Did every branch this work ADDED get a test?** Walk the new and changed control flow — each
\`if\`/\`else\`, each \`switch\` arm, each ternary, each optional chain, each \`try\`/\`catch\`, each early
return — and ask whether a case exercises it. A branch with no case is a finding, whatever some
higher-level test covers.

Judge the assertion, not just its presence. A test asserting \`rendered\` or \`was called\` proves
nothing and counts as no case at all. Write the missing case yourself where you can.

### Two questions you skip on some files

**Do not ask \`perf\` or \`integrity\` of a declaration-shaped file** — a \`*-contract.ts\`, \`*.stub.ts\`,
\`*.proxy.ts\`, a test, an e2e, a harness, or a barrel \`index.ts\`. Measured across 88 such files, those
two produced zero findings, and that zero is a property of the question: \`perf\` against a zod schema
asks whether a declaration has a quadratic loop.

The other three still apply in full. \`test-cases\` in particular still finds a branch added to a proxy
or a stub that ships with no case.

### Dead code is not one of your concerns

Do not hunt orphans. Whether an export has a consumer depends on the whole import graph after later
work lands, and you cannot answer that from inside your own scope. Deleting an export while you fix
something else is fine.`,
} as const;
