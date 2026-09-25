# Brands, library types and adapters: the rules, before and after

Written 2026-09-24. This doc is complete on its own: the rules for brands, library types, adapters,
tests and mocking, the evidence behind them, the unit-test I/O trap that is already built, and the
order of work.

## The problem in one paragraph

Models keep producing brands that check nothing (`ContentText`), hand copies of library types (a 597-line copy of ESTree), and adapters that only pass a call along (217 of 349). Models do this
because our own rules demand it, not because they misunderstand. Every rule that asks a model to judge
whether a type or an adapter is worth having gets the answer "yes, make one". Agreeing costs the model
less than judging.

## The principle

**A rule may not ask anyone to decide. The answer must follow from the code's structure.**
Structure means where something is declared, what it imports, and what surrounds a call. A rule built
that way needs no list for anyone to maintain. It also works unchanged in a consumer repo, because it
reads that repo's own code.

**A rule works when a machine can tell a good answer from a hollow one.** Every failure measured below
is a rule whose only check was that the model complied. Models also relearn every convention each
session, because none of it is in their training. So a rule is taught at the moment of the mistake, by
a lint or compiler message that names the fix, not by doctrine read up front.

**No rule is a list a model can edit.** "These packages may skip an adapter" becomes a list, and models
add to lists to get past errors. Every rule here checks structure, runtime behaviour, or the repo's own
code.

## Four rules that cause the mess today

| Today's rule                                                                                          | Where it lives                                                                                                                                                                                                                                                                         | What it forces                                                                                   | What models produce                                                                                                       |
|-------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Every `z.string()` / `z.number()` needs `.brand()`, and no function returns plain `string` / `number` | `require-zod-on-primitives`, `ban-primitives`, `packages/mcp/src/statics/folder-constraints/contracts-constraints.md:22`: "All contracts MUST use `.brand<'TypeName'>()` on primitives", and `transformers-constraints.md:36`: "All transformers MUST validate output using contracts" | A brand on every piece of text, including loose text no object owns, with a name the model picks | `ContentText`: 894 type uses counting tests (486 without), on 108 object fields under 75 different keys, checking nothing |
| A contract may import no npm package except zod                                                       | `packages/shared/src/statics/folder-config/folder-config-statics.ts:38-45`                                                                                                                                                                                                             | A contract cannot `import type` a library's own types                                            | Hand copies of ESTree, ESLint's rule context, `ts.SourceFile`, `ChildProcess`, `fs.Stats`                                 |
| Adapters must not return library types                                                                | `packages/mcp/src/statics/folder-constraints/adapters-constraints.md:93`: "ALL outputs MUST use contracts (no returning npm package types)"                                                                                                                                            | The same copies, plus a cast to get the library object into them                                 | About 18 of the 99 production `as unknown as` casts                                                                       |
| Only `adapters/` may import from `node_modules`                                                       | `folder-config-statics.ts:158-166`                                                                                                                                                                                                                                                     | Every Node or npm call needs its own adapter file                                                | 85 pure pass-throughs, 62 pass-throughs plus a parse, copied into up to 10 packages each                                  |

## What we measured

Scratch scripts and outputs are in `tmp/` at the repo root, which is not committed. Every number here
comes from a scan on 2026-09-24.

### Brands

| Finding                                                                           | Number                                                                                                   |
|-----------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Brand names declared in `*-contract.ts` files                                     | 941                                                                                                      |
| Declared only inline, on one object field                                         | 542                                                                                                      |
| Standalone brand contracts also used as an object field                           | 187                                                                                                      |
| Standalone brand contracts never used as an object field                          | 212 (51 with no type use at all)                                                                         |
| Brand names declared in more than one contract file                               | 175                                                                                                      |
| Inline branded fields whose brand text contains every word of the field's key     | 809 of 919                                                                                               |
| Contracts that carry `QuestId` as a field                                         | 31, and `Quest` is not one of them: `quest-contract.ts:36` declares its own inline `.brand<'QuestId'>()` |
| Contracts that carry `ProcessId`                                                  | 19, and no "Process" object exists                                                                       |
| Uses of indexed-access types like `Quest['id']`                                   | 307 (221 outside tests)                                                                                  |
| Sites passing two different ID brands side by side, where a brand prevents a swap | 126                                                                                                      |

A known bug comes from brand names clashing. `FolderType` is `z.string()` in mcp and `z.enum([...])` in
shared. Zod treats two brands with the same text as the same type. So the two are interchangeable to
TypeScript, yet they check different things (`packages/mcp/CLAUDE.md` records it).

### Library type copies

| Contract                                                                          | Copies                                                                                                                 | Lines         | Parsed on real data in production?                                                                                   |
|-----------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|---------------|----------------------------------------------------------------------------------------------------------------------|
| `eslint-plugin/src/contracts/tsestree/tsestree-contract.ts`                       | TSESTree from `@typescript-eslint/utils`                                                                               | 597           | No                                                                                                                   |
| `eslint-plugin/src/contracts/eslint-context/eslint-context-contract.ts`           | ESLint `Rule.RuleContext` and friends                                                                                  | 95            | No                                                                                                                   |
| `testing/src/contracts/typescript-source-file/...`                                | `ts.SourceFile`                                                                                                        | 18            | No                                                                                                                   |
| `hooks/src/contracts/child-process/...`                                           | Node `ChildProcess`                                                                                                    | 18            | No                                                                                                                   |
| `hooks/src/contracts/file-stats/...`                                              | Node `fs.Stats`                                                                                                        | 19            | No                                                                                                                   |
| `eslint-plugin/src/statics/tsestree-node-type/tsestree-node-type-statics.ts`      | TSESTree's `AST_NODE_TYPES`. Its header says "AST node type constants without external dependencies". Used by 7 files. | 183           | Not a contract: a statics copy                                                                                       |
| `testing/src/contracts/timer-handle/timer-handle-contract.ts`                     | Node's `NodeJS.Timeout`, as `z.object({})` plus a hand-typed `hasRef`                                                  | 14+           | No. `is-timer-holding-loop-guard.ts:22` calls `handle.hasRef()` on it.                                               |
| `package.json`, `tsconfig.json`, and the Jest, ESLint and Playwright JSON reports | Data from files and other processes                                                                                    | 15 to 65 each | **Yes.** These describe outside data, not library objects. `package.json` has 4 copies (cli, ward, shared, testing). |

The TSESTree copy shows why copying failed even on its own terms:

- It is one flat node type with every field optional. Real TSESTree is a union: checking
  `node.type === 'CallExpression'` tells the compiler `node.callee` exists. The files using the copy do
  288 `.type === '...'` checks and still need 325 `?.` guards, because the check narrows nothing.
- It brands `name` as `Identifier`, but nothing ever parses a node. The brand was never checked. Casts
  fill the gaps: `rule-enforce-contract-usage-in-tests-broker.ts:160` reports on
  `imports.contractImportNode ?? ({} as Tsestree)`.
- 119 non-test files in `eslint-plugin` and 14 in `local-eslint` depend on it.

### Adapters (all 349 read and sorted)

| What the adapter does                                                         | Count | Typical length |
|-------------------------------------------------------------------------------|-------|----------------|
| Passes one call through unchanged                                             | 85    | 22 lines       |
| Passes the call on to another workspace package                               | 70    | 18 lines       |
| One call plus a parse of the result                                           | 62    | 23 lines       |
| Encodes how to talk to an outside system (several calls, flags, env, framing) | 57    | 63 lines       |
| Decides what a failure means (catch and branch, retry, timeout, default)      | 39    | 33 lines       |
| Sets up a library object with real logic                                      | 27    | 76 lines       |
| UI component or test helper filed as an adapter                               | 9     | 21 lines       |

| Proxy finding                                                         | Count                                                                                           |
|-----------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Empty proxy                                                           | 70                                                                                              |
| A default answer that matches every call                              | 48                                                                                              |
| No way to stage a failure                                             | 141                                                                                             |
| Invents a failure, such as `new Error('ENOENT: ...')` with no `.code` | 49 (an undercount: two sorters counted "rejects with whatever `Error` the test passes" as real) |

| Duplication finding                        | Number                                                                                       |
|--------------------------------------------|----------------------------------------------------------------------------------------------|
| Adapters that import an outside module     | 205                                                                                          |
| Distinct outside functions they wrap       | 111                                                                                          |
| Functions wrapped in more than one package | 34                                                                                           |
| Worst cases                                | `writeFile` in 10 packages, `readFile` in 9, `dirname` in 9, `existsSync` in 8, `spawn` in 5 |

Most adapter imports are Node built-ins: `fs` 114, `path` 29, `child_process` 18. About 80 are real
npm libraries.

### Adapters any rule must keep

These hold real logic. Any rule that removes adapters must leave them alone.

| Package       | Adapters                                                                                                         |
|---------------|------------------------------------------------------------------------------------------------------------------|
| orchestrator  | `child-process-spawn-stream-json`, `fs-watch-tail`, `http-readiness-poll`, `fs-walk-files`, `git-log-name-only`  |
| shared        | `child-process-spawn-capture`, `net-free-port-pair`                                                              |
| ward          | `crypto-hash-files`                                                                                              |
| siegelense    | `playwright-session`, `key-read-layer`, `settle-poll-layer`, `net-unix-serve`, `net-unix-request`, `fetch-probe` |
| web           | `indexed-db-draft-images-read`, `indexed-db-draft-images-replace`, `elk-layout`                                  |
| testing       | `typescript-mock-calls-to-statements`, `jest-register-mock`, `jest-register-spy-on`                              |
| eslint-plugin | `eslint-rule-tester`                                                                                             |

### Handling, proxies and brands that do work

**Handling lives everywhere except the adapter.** The "missing file" handling an adapter should hold is
written at the call sites instead. `fsReadFileAdapter` sits inside `try`/`catch` at 35 sites in 7
packages, and behind `.catch` at 30 sites in 6 more, written four different ways: `catch {}` with a
comment, `catch { return []; }`, `.catch(() => null)`, and digging through `error.cause` for `ENOENT`.

**One of those losses is user
data.** `mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.ts:62-67`
swallows every read error and leaves the settings as `{}`; line 119 writes the result. A `settings.json`
that is unreadable, or has one JSON error, is replaced by a file holding only `permissions`, losing the
user's other settings, including the hooks other installers wrote. Found by reading, not by running.

**Forwarders drift.** mcp wraps 17 `StartOrchestrator` methods and server wraps 42; 7 are wrapped by
both, each with its own proxy. mcp's `get-quest` adapter spreads `...(stage && { stage })` where
orchestrator checks `stage !== undefined`, so an empty string behaves differently on each side.

**Where a brand's contract checks something real, the brand works.** It catches bad data at the first
parse. Across the brands in shared:

| What a shared brand's contract checks          | Brands | Most used (files using it)                                   |
|------------------------------------------------|--------|--------------------------------------------------------------|
| Nothing                                        | 11     | `ContentText` (263), `ErrorMessage` (104), `Identifier` (92) |
| Only "not empty"                               | 23     | `QuestId` (241), `SessionId` (93), `ProcessId` (75)          |
| A real check (uuid, regex, refine, int, range) | 44     | `AbsoluteFilePath` (394), `GuildId` (93), `ExitCode` (31)    |

`GuildId` checks for a UUID, and `AbsoluteFilePath` in shared checks for a leading `/`: both fail on bad
data at the parse. That is the part of branding these rules keep, as a check on an owned field.

## Two kinds of library

The rules below depend on one distinction: **who calls whom.**

|                                | An outside system                                 | A host library                                                                                                   |
|--------------------------------|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| Who starts the call            | Our code calls it                                 | It calls our code                                                                                                |
| Examples                       | The Claude CLI, git, `fs`, HTTP, glob, Playwright | ESLint (calls our rule's `create` and visitors), React (renders our components), Hono (calls our handlers), Jest |
| What crosses over              | Data, or a failure                                | Live objects: ESLint's `context`, AST nodes, React props                                                         |
| Can an adapter sit in between? | Yes                                               | No. Our code *is* the use of the library.                                                                        |

No rule has to be told which kind a library is. A host library's types show up in our code as
parameters, and nobody wraps a failure around `useState` or an AST node. The rules key on handling and
on type-versus-value imports, and those separate the two kinds on their own.

A library can be both kinds. Jest runs our tests as a host. The testing package also calls Jest's API (`jest.fn`, `jest.mock`) through adapters that hold real logic, such as `jest-register-mock`, which
dispatches answers by argument. Those calls go through adapters like any outside system's.

## The rules

Words used below:

- **Owner**: the object contract a field is declared on. `questContract` owns `id`.
- **Leaf**: a `z.string()` or `z.number()` schema inside an object contract, at any depth, including
  inside an array.
- **Brand text**: the text inside `.brand<'...'>()`. Zod treats two brands with the same text as one
  type.
- **Outside function**: a function brought in by a value import (not `import type`) from a package
  outside the repo. Node built-ins count. So do the platform's I/O globals, such as `fetch`,
  `WebSocket` and `indexedDB`: the platform fixes which globals do I/O, not the repo. Pure globals such as `JSON.parse` and `new RegExp` do not count, because they do no I/O. Workspace packages (`@dungeonmaster/*`, or a consumer's own workspace packages) do not count.
- **Handling**: code that wraps a call and decides what its failure means: a `catch`, `.catch`, a
  rejection handler, `Promise.allSettled`, a retry loop, a timeout race, or a branch on `error.code`
  inside the `catch`. Classifying an error value that arrived as data, after someone else caught it,
  is not handling.
- **Claimed**: an outside function that an adapter handles. Rule A2 defines it.
- **Pass-through**: an adapter that makes one outside call, passes its parameters straight through, and
  returns the result unchanged, or wrapped only in a standalone brand that B6 removes. Many today return
  a fixed `{ success: true }` instead, which A7 refuses.

### Brands

The brand rules answer two questions with no judgement: whether a value gets a brand (B1, B6), and
what the brand is called (B3). B9 says which object shapes must be contracts. The rest keep one source for each brand.

#### B1: every object contract, every object nested in it, and every string and number field carries a brand, and nothing else does

Whether to brand is not a choice. Every object gets a brand, every nested object gets one, and every
leaf gets one. B3 derives each text.

A value that is not a field of an object contract gets no brand of its own. A loose parameter, return or
local is a plain `string` or `number`. A value taken off an object keeps its field's brand through the
owner's type, such as `Quest['id']`. That is the field's brand travelling with the value, not a new one.

```
// before — some fields branded, some not, and the model picks each text
export const workItemContract = z.object({
  id: questWorkItemIdContract,                                            // a standalone brand
  status: workItemStatusContract,
  retryCount: z.number().int().nonnegative().brand<'FailCount'>(),        // work-item-contract.ts:49
  maxAttempts: z.number().int().positive().brand<'MaxAttempts'>(),
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),               // same text as 10 other fields
  errorMessage: z.string().brand<'ErrorMessage'>().optional(),
  mintedBy: questWorkItemIdContract.optional(),
});

// after — the object and every leaf branded, every text derived
const workItemId = z.string().uuid().brand<'WorkItemId'>();         // local, not exported (B2)
export const workItemContract = z
  .object({
    id: workItemId,
    status: z.enum(['pending', 'in_progress', 'complete']),                // enum: no brand
    retryCount: z.number().int().nonnegative().brand<'WorkItemRetryCount'>(),
    maxAttempts: z.number().int().positive().brand<'WorkItemMaxAttempts'>(),
    createdAt: z.string().datetime().brand<'WorkItemCreatedAt'>(),
    errorMessage: z.string().brand<'WorkItemErrorMessage'>().optional(),
    mintedBy: workItemId.optional(),                                 // reuse: carries 'WorkItemId'
    resumeOnly: z.boolean().optional(),                                    // boolean: no brand
  })
  .brand<'WorkItem'>();
```

What gets a brand is decided by the kind of schema:

| Schema                                                                                     | Brand?                                                                                                                                            |
|--------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| An object contract                                                                         | Yes. The text is the owner's name: `z.object({ … }).brand<'WorkItem'>()`                                                                          |
| An object nested in a field                                                                | Yes. The text is the owner plus the key: `owner: z.object({ … }).brand<'QuestOwner'>()`. Its leaves are branded too.                              |
| An array of objects                                                                        | Each element object gets a brand with the array field's key: `items: z.array(z.object({ … }).brand<'QuestItems'>())`. The array itself gets none. |
| A `z.string()` or `z.number()` leaf                                                        | Yes. The text is the owner plus the key (B3).                                                                                                     |
| An element of an array of strings or numbers                                               | Yes, with the array field's key: `tags: z.array(z.string().brand<'QuestTags'>())`                                                                 |
| An enum or literal                                                                         | No. A literal type already cannot be confused with free text.                                                                                     |
| A boolean                                                                                  | No                                                                                                                                                |
| A reuse of another owner's field (B4), or of the owner's own local id const (B2)           | It keeps the source's brand                                                                                                                       |
| A string or number that is not a field of an object contract: a parameter, return or local | No brand of its own. It stays plain, or carries a field's brand through `Owner['key']`. An object that a function returns is a contract (B9).     |

```
// flagged
questContract = z.object({ title: z.string().min(1).brand<'QuestTitle'>() })         // the object has no brand
questContract = z.object({ title: z.string().min(1) }).brand<'Quest'>()              // leaf with no brand
questContract = z.object({ tags: z.array(z.string()) }).brand<'Quest'>()             // array leaf with no brand
questContract = z.object({ owner: z.object({ name: z.string().brand<'QuestOwnerName'>() }) }).brand<'Quest'>()   // nested object with no brand
workItemContract = z.object({ status: z.enum([...]).brand<'WorkItemStatus'>() }).brand<'WorkItem'>()   // enums take no brand
export const timeoutMsContract = z.number().brand<'TimeoutMs'>();            // not an object field: no brand
const text = z.string().brand<'ContentText'>().parse(line);                  // not an object field: no brand
const modulePath = source as ModulePath;       // a cast mints a standalone brand (B2): ast-get-imports-transformer.ts:28
(): { camel: Identifier; pascal: Identifier } => …   // kebab-case-variants-transformer.ts:19: a TS type, not a contract

// left alone
(): KebabCaseVariants => …                           // a returned object is a contract (B9)
questContract = z.object({ title: z.string().min(1).brand<'QuestTitle'>() }).brand<'Quest'>()
questContract = z.object({ tags: z.array(z.string().brand<'QuestTags'>()) }).brand<'Quest'>()
questContract = z.object({ owner: z.object({ name: z.string().brand<'QuestOwnerName'>() }).brand<'QuestOwner'>() }).brand<'Quest'>()
workItemContract = z.object({ status: z.enum([...]), resumeOnly: z.boolean() }).brand<'WorkItem'>()
({ questId }: { questId: Quest['id'] })                  // the field's own brand, taken off the object
({ timeoutMs }: { timeoutMs: number })                   // loose value: plain
const modulePath: string = source;                       // loose value: plain
```

Ins and outs:

- **Build an object through its root contract's parse.** `contract.parse({ … })` brands every leaf in
  one step, so it costs nothing extra. Most code already builds this way: 100 of 102 object builds in
  orchestrator's transformers, and all 72 in siegelense's and web's. Three other styles exist, and each
  should become one root parse:

  | Style today | Example | Under B1 |
    |---|---|---|
  | Parse each leaf, push an unparsed literal | `results.push({ filePathArg: contentTextContract.parse(rawArg) })` in `fs-watch-tail-calls-extract-transformer.ts:47`, one of 7 such files in shared | `results.push(fsWatchTailCallContract.parse({ filePathArg: rawArg }))` |
  | Build field by field, then parse the whole again | `cli-args-parse-transformer.ts` parses fields at lines 58, 72 and 80, then `wardConfigContract.parse(parsed)` at line 173 | Collect raw values, parse once at the end |
  | A generic helper that merges any object with an id, and casts | `quest-item-deep-merge-transformer.ts:57` assigns `merged[key] = updateParams.value`; `quest-array-upsert-transformer.ts:44` casts `update as ItemWithId` | The helper cannot know the owner at each key, so it re-parses the root object (the quest) after merging, and does not cast |

- **A parse of an object written entirely as literals checks almost nothing.** The compiler already
  checks the field types, so the parse only adds zod's refinements, such as `.min(1)`. The rule still
  requires it, because a cast would skip those refinements. The way to avoid the ceremony is the
  shape: when a function reports one fact, it returns a plain value (B6), not a one-field object. A7's
  `fsRmIfExistsAdapter` returns `Promise<boolean>`, not `{ removed: boolean }`.
- **A typed object literal needs a parse for each new value.** `const next: WorkItem = { ...item,
  retryCount: … }` compiles only if `retryCount` is already a `WorkItemRetryCount`.
- **Reading costs nothing.** A branded string is still a string: `.length`, template literals and
  comparisons all work.
- **Two unrelated fields do not accept each other's values.** `startedAt: item.createdAt` does not
  compile. Copy it with a parse: `workItemContract.shape.startedAt.parse(item.createdAt)`. B8 allows
  this, because `createdAt` is not an id.
- **Contracts that describe outside data follow B1 too.** A `package.json` contract brands
  `PackageJsonName`, `PackageJsonVersion` and so on. Describe only the fields code reads. `z.object`
  drops unknown keys by default.
- **A branded object can only come from a parse.** The compiler refuses a hand-built literal typed as
  `Quest`, because the literal lacks the object's brand. So "build through the root contract's parse"
  is enforced by the compiler, not by review. Spreading a parsed object keeps its brand:
  `const next: Quest = { ...quest, title: newTitle }` compiles when `newTitle` is a `QuestTitle`.
- **This needs zod v4.** In zod v3, `.brand()` on an object wraps it, and the wrapper has no `.shape`:
  `questContract.shape` is `undefined` at runtime and a type error. Every `questContract.shape.id` in
  this doc would have to be `questContract.unwrap().shape.id`. In zod v4, a branded object keeps
  `.shape`. Both were checked against the zod 3.25 package, which also ships v4 under `zod/v4`
  (`tmp/brand-proto/proto-object-brand.ts` for v3, `proto-object-brand-v4.ts` for v4). The examples in
  this doc assume v4. The repo uses zod 3.25 today, so the upgrade comes first.

Why: today some fields get a brand and some do not, and the model decides which. Branding every object
and every leaf removes that decision. B3 derives every text, so branding everything adds no name anyone
has to pick. Most inline brands today already contain their key's words (809 of 919), so this mostly
writes down what models already do.

How a machine checks it: the lint rule `require-object-contract-brands`, which reads only the syntax.

| What the rule checks                                                                                                                                | Where                                                                                                                                                        | Message                                                                                                                 |
|-----------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| Every `z.object(...)` in a contract ends in `.brand<'…'>()`                                                                                         | Every `z.object` call in `contracts/`, at any depth, including inside `z.array(...)`                                                                         | `z.object in {{file}} has no brand. Add .brand<'{{expected}}'>().`                                                      |
| Every `z.string()` and `z.number()` leaf inside it has `.brand<'…'>()` somewhere in its chain, except a key `enforce-owner-field-reuse` claims (B4) | Each property value, through `.optional()`, `.nullable()`, `.default()`, `.min()` and other chained calls, and inside `z.array(...)`                         | `Field {{key}} has no brand. Add .brand<'{{expected}}'>().`                                                             |
| No brand on an enum, literal or boolean                                                                                                             | `z.enum`, `z.literal`, `z.boolean` chains                                                                                                                    | `{{key}} is an enum, literal or boolean. Remove the brand.`                                                             |
| The brand text equals the derived text (B3)                                                                                                         | Every `.brand<'…'>()` on an object or a leaf                                                                                                                 | `Brand text '{{actual}}' must be '{{expected}}'.`                                                                       |
| A field that reuses another schema is left alone                                                                                                    | A property value that is an identifier or a `.shape.<key>` access, such as `questContract.shape.id`                                                          | none                                                                                                                    |
| No `.brand<'…'>()` anywhere else (B2)                                                                                                               | Every `.brand(` call in any file that is not on a `z.object(...)` or inside one. The one exception is a local, unexported const that its owner uses as `id`. | `A brand sits only on an object contract or one of its fields. Move it onto the field that owns the value, or drop it.` |
| A local id const's text is its owner's `id` text (B3)                                                                                               | The const's declaration, traced to the owner field that uses it as `id`                                                                                      | `Brand text '{{actual}}' must be '{{expected}}', the id of {{owner}}.`                                                  |

It has an autofix. Every expected text is derived from the const name and the key path, so the fixer
can write the missing `.brand<'…'>()` itself, and a wrong text can be replaced. Nothing is left for a
model to choose. This rule replaces `require-zod-on-primitives` (see "Today's rules and docs that
change"). B3's naming check is the fourth row above, so it needs no separate rule.

#### B2: a brand is declared only on an object contract, or inline on a field of one

No standalone brand contract. No exported brand type. The only way to get a brand is through the object
that owns it.

```
// before — a standalone brand contract and its exported type
// quest-id-contract.ts
export const questIdContract = z.string().min(1).brand<'QuestId'>();
export type QuestId = z.infer<typeof questIdContract>;

// content-text-contract.ts
export const contentTextContract = z.string().brand<'ContentText'>();

// after — the brand lives on its owner's field
// quest-contract.ts
export const questContract = z
  .object({
    id: z.string().min(1).brand<'QuestId'>(),
    title: z.string().min(1).brand<'QuestTitle'>(),
  })
  .brand<'Quest'>();
export type Quest = z.infer<typeof questContract>;

// a function that needs one field takes it through the owner's type
export const questPauseBroker = async ({ questId }: { questId: Quest['id'] }) => { … };

// minting one value parses it through the owner
const questId = questContract.shape.id.parse(rawFromUrl);
```

```
// flagged
export const questIdContract = z.string().min(1).brand<'QuestId'>();      // standalone brand
const label = z.string().brand<'Label'>();                                 // a local brand no owner uses as its `id`
export const workItemId = z.string().uuid().brand<'WorkItemId'>();        // the exception's const, but exported
export type QuestId = z.infer<typeof questContract>['id'];                 // exported brand type (see B5)

// left alone
export const questContract = z.object({ id: z.string().min(1).brand<'QuestId'>() }).brand<'Quest'>();
({ questId }: { questId: Quest['id'] })
// the exception below: local, not exported, and used by its owner as `id`
const workItemId = z.string().uuid().brand<'WorkItemId'>();
export const workItemContract = z.object({ id: workItemId, mintedBy: workItemId.optional() }).brand<'WorkItem'>();
```

Ins and outs:

- **One exception, for an owner that points at itself.** `WorkItem` holds its own id in `dependsOn`,
  `insertedBy` and `mintedBy` (`work-item-contract.ts:27,46,71,105`). A contract cannot reference its own `.shape` while it is being declared. So an owner may hold its id in a local const that is
  **not exported**. The const's name does not matter. Its brand text follows the owner field that uses
  it as `id` (B3):

  ```typescript
  // work-item-contract.ts
  const workItemId = z.string().uuid().brand<'WorkItemId'>();   // local, not exported
  export const workItemContract = z
    .object({
      id: workItemId,
      dependsOn: z.array(workItemId).default([]),
      mintedBy: workItemId.optional(),
    })
    .brand<'WorkItem'>();
  ```

- **A format check that many owners need lives in `statics/` as a pattern.** Each field writes the
  check inline and adds its own brand. Contracts may already import `statics/`, so this adds no new
  folder type and no new type name:

  ```typescript
  // statics/path/path-statics.ts
  export const pathStatics = { absolutePattern: /^(\/|[A-Za-z]:\\)/u } as const;
  // guild-contract.ts
  path: z.string().regex(pathStatics.absolutePattern).brand<'GuildPath'>(),
  ```

  Two rule changes make this work. `statics/` joins the folders that may hold a regex. And a statics
  file needs a colocated test only when it holds a regex, because the pattern is logic and the rest of
  a statics file is data. Both are in "Today's rules and docs that change".

  Zod's own checks cover most other formats inline: `.uuid()`, `.datetime()`, `.int().positive()`.
  A shared contract with no brand, such as `absolutePathContract = z.string().refine(...)`, is not used.
  The contracts convention exports a type with every contract, and `AbsolutePath = string` would
  suggest a check the type does not carry.

- **A value with no owner stays plain.** A path built by `join`, or a timeout, is a plain `string` or
  `number` until it is put into an owned field. The field's parse checks it there. This gives up some
  mix-up safety for loose values. In exchange, no invented names (B6).
- **Several ids have no owner today.** `SessionId`, `ProcessId`, `AgentId`, `ToolUseId`, `InstanceId`
  and `RunId` are carried by many contracts, but no contract has them as its own `id`. `sessionId`,
  for example, is a field of `sessionRecordContract`, `questSessionContract`, `sessionListItemContract`
  and `activeSessionResultContract`, and none of them has a session `id`. Under B2 these ids would go
  plain. Open decision 7 covers what to do.
- **Mix-up safety is kept wherever it exists today.** `Quest['id']` resolves to the branded type. A
  function taking `{ questId: Quest['id']; guildId: Guild['id'] }` still refuses swapped arguments.

Why: a standalone brand is a name someone had to choose, and choosing is the step models get wrong.
Tying the brand to its owner removes the choice.

How a machine checks it: syntax only. `.brand(` must sit directly on a `z.object(...)` call, or in the
value of a property of one, at any depth, or in a local unexported const that the owner uses as its
`id`. This is the sixth row of `require-object-contract-brands` (B1).

#### B3: the brand text is the owner's name plus the field key

The owner's name is the const that holds the `z.object`, without its `Contract` suffix, in PascalCase.
The object's own brand is the owner's name. A field's brand is the owner's name plus the field's key
in PascalCase, so `used_percentage` becomes `UsedPercentage`. A nested object's brand is the owner's
name plus its key, and its fields add their keys after that. A local id const (B2) takes the text of
the field that uses it as `id`.

```
// before — the model picks any text
retryCount: z.number().int().nonnegative().brand<'FailCount'>(),        // work-item-contract.ts:49
createdAt: z.string().datetime().brand<'IsoTimestamp'>(),               // same text as 10 other fields

// after — the text is derived
retryCount: z.number().int().nonnegative().brand<'WorkItemRetryCount'>(),
createdAt: z.string().datetime().brand<'WorkItemCreatedAt'>(),
```

```
// flagged
questContract = z.object({ id: z.string().brand<'QuestId'>() }).brand<'QuestContract'>()   // must be 'Quest'
questContract = z.object({ id: z.string().brand<'Id'>() }).brand<'Quest'>()               // must be 'QuestId'
workItemContract = z.object({ retryCount: z.number().brand<'FailCount'>() }).brand<'WorkItem'>()

// left alone
questContract = z.object({ id: z.string().brand<'QuestId'>() }).brand<'Quest'>()
guildContract = z.object({ id: z.string().uuid().brand<'GuildId'>() }).brand<'Guild'>()
questContract = z.object({ owner: z.object({ name: z.string().brand<'QuestOwnerName'>() }).brand<'QuestOwner'>() }).brand<'Quest'>()
```

Ins and outs:

- **An object nested inline adds each key on the path.** `questContract.owner` is `'QuestOwner'`, and
  `questContract.owner.name` is `'QuestOwnerName'`. A nested object moved into a layer file keeps the
  same text: it follows the key the parent uses it under (C7).
- **Each object branch of a union takes the owner's name.** Every branch of
  `carveResultContract = z.discriminatedUnion('ok', [...])` is `.brand<'CarveResult'>()`, and its
  fields add their keys, such as `'CarveResultError'`. A key that appears in several branches uses the
  same schema in each, so one brand text never means two checks. The lint rule compares them.
- **Two brands share a text only if they share an owner and a key.** C8 keeps owner names unique
  across packages. So duplicate names such as the 175 today, and the `FolderType` clash, cannot happen
  for a brand that is declared. They can only come
  from reuse, and B4 governs reuse.
- **`ContentText` cannot be written.** No owner-plus-key produces it, except a fake `Content` object,
  which B7 catches.
- **Reusing a brand keeps its source's text.** `dependsOn: z.array(workItemId)` carries
  `'WorkItemId'`. B3 checks where a brand is declared, not where it is reused.

Why: a derived text leaves nothing to decide, and it makes the text unique by construction.

How a machine checks it: syntax only. Read the const name and the key path, then compare the text.
This is the fourth row of `require-object-contract-brands` (B1).

#### B4: a field or parameter that holds another object's field uses that field's type

```
// before — referring contracts import a standalone brand; brokers take a plain string
// some-contract.ts
questId: questIdContract,
// some-broker.ts
({ questId }: { questId: string })                                // plain, so any string is accepted

// after — contracts reuse the owner's schema
// some-contract.ts
questId: questContract.shape.id,
// some-broker.ts
({ questId }: { questId: Quest['id'] })
```

```
// flagged in a contract file, contracts/some/some-contract.ts — questContract exists and has an `id` key
someContract = z.object({ questId: z.string().min(1) }).brand<'Some'>()               // must be questContract.shape.id
someContract = z.object({ questId: z.string().brand<'SomeQuestId'>() }).brand<'Some'>()   // its own brand: still must reuse
someContract = z.object({ questId: z.string().brand<'QuestId'>() }).brand<'Some'>()   // redeclares another owner's brand

// flagged in any file: brokers, transformers, responders, widgets and the rest
({ questId }: { questId: string })                                    // must be Quest['id']
({ parentQuestId }: { parentQuestId: string })                        // ends with QuestId

// left alone
someContract = z.object({ questId: questContract.shape.id }).brand<'Some'>()   // contract file
({ questId }: { questId: Quest['id'] })                                        // any file
({ label }: { label: string })                                                 // no Label owner exists
```

Ins and outs:

- **Plain ids are common today.** Production code has 30 parameters named `questId` typed as a plain
  `string`, so a model can pass `'op-id-1'` and nothing stops it.
- **The name decides.** A key or parameter named `<owner><Key>` (like `questId`), or ending in it (like
  `parentQuestId`), must reuse that owner's field when the owner contract exists. The list of names is
  simply the repo's own object contracts. Another repo's `InvoiceNumber` works the same way.
- **B4 wins over B1 and B3.** A field B4 catches is a reuse, so it declares no brand of its own. The
  two lint rules share one index so they never disagree about a key (see "How a machine checks it"
  below).
- **Short names need a floor.** An owner called `Item` with key `id` would claim every name ending in
  `ItemId`, including `workItemId`. Open decision 9 covers it.
- **Import cycles.** `quest-contract.ts` imports `work-item-contract.ts` (line 33). If a work item ever
  needs `questId`, then `questContract.shape.id` is an import cycle. See open decision 1.
- **Several fields of the same kind share one brand.** The brand says what kind of value it is. The
  name says what role it plays.

  ```typescript
  export const dealContract = z
    .object({
      id: z.string().uuid().brand<'DealId'>(),
      ownerUserId: userContract.shape.id,     // brand 'UserId'
      salesUserId: userContract.shape.id,     // brand 'UserId'
    })
    .brand<'Deal'>();

  ({ ownerUserId: someUser.id })            // compiles: a User['id'] is a UserId
  ({ ownerUserId: deal.salesUserId })       // compiles: both are users
  ({ ownerUserId: deal.id })                // refused by the compiler: a DealId is not a UserId
  ```

  Names guard against swapping roles. `enforce-object-destructuring-params` makes every argument
  named at the call, so a swap has to be written out as `{ ownerUserId: deal.salesUserId }`, where a
  reader can see it. A positional swap cannot happen.

  A role brand on top, such as `userContract.shape.id.brand<'DealOwnerUserId'>()`, would pass B3's
  naming check. The rules do not ask for one. Someone would have to decide which fields deserve a role
  brand, and that decision is the step models get wrong.
- **A role name that does not say its kind escapes B4, and B1 plus B8 catch it.** B4 catches
  `ownerUserId` because the name ends in `UserId`. It cannot catch these fields, which exist today:

  | Field | What it holds |
    |---|---|
  | `WorkItem.mintedBy`, `insertedBy`, `dependsOn` | Work item ids |
  | `heldBy` | An `InstanceId` |

  B1 refuses `mintedBy: z.string()`, because a leaf needs a brand. If `mintedBy` gets its own brand,
  `'WorkItemMintedBy'`, the compiler refuses `mintedBy: workItem.id`, because a `WorkItemId` is not a
  `WorkItemMintedBy`. The one way around that is to re-brand the id with a parse, and B8 refuses that.
  So the only fix left is to reuse the work item's id schema.

  | Rule | Catches | Needs the type checker? |
    |---|---|---|
  | B4 | Fields and parameters whose name says the kind | No |
  | B1, then the compiler | Fields whose name says only the role | No |
  | B8 | The re-brand that would get around the compiler | Yes |

Why: this keeps one source for each brand's check. The name decides, keyed on owner contracts rather
than on standalone brand names.

How a machine checks it: the lint rule `enforce-owner-field-reuse`, built on a repo-wide index of
object contracts and their keys. The type checker is not needed. It has two checks, with different
scopes:

| Check                                                                                               | Where                                 | Message                                                                       | Autofix                                                   |
|-----------------------------------------------------------------------------------------------------|---------------------------------------|-------------------------------------------------------------------------------|-----------------------------------------------------------|
| A key named `<owner><Key>`, or ending in it, is `ownerContract.shape.key`                           | Every `z.object(...)` in `contracts/` | `{{key}} holds {{owner}}'s {{field}}. Use {{ownerContract}}.shape.{{field}}.` | Yes: replace the value with the reuse, and add the import |
| A parameter or destructured property named `<owner><Key>`, or ending in it, is typed `Owner['key']` | Every function, in every folder       | `{{name}} holds {{owner}}'s {{field}}. Type it {{Owner}}['{{field}}'].`       | Yes: replace the type, and add the type import            |

`require-object-contract-brands` reads the same index and leaves alone every key this rule claims. Its
autofix never brands one: branding `questId` as `'SomeQuestId'` is exactly what this rule refuses.

How the rule decides a name:

1. **Build the index.** Read every `*-contract.ts` in the file's own package and in the workspace
   packages it depends on. Record each object contract's owner (`questContract` gives `Quest`), and
   each key that declares its own brand (`id`, `title`, …). A key that reuses another owner's field
   records nothing, so `someContract.questId` does not create a `someQuestId` name.
2. **Turn each owner and key into a name.** `Quest` and `id` give `questId`. `WorkItem` and `id` give
   `workItemId`.
3. **Match names on camelCase word boundaries.** `questId` matches exactly. `parentQuestId` splits into *parent*,
   *quest*, *id*, and ends in *quest*, *id*, so it matches. `requestId` splits into *request*,
   *id*, so it does not match `QuestId`, although its raw text ends in "questId". When two
   owners match, the longest owner name wins (open decision 9).
4. **Check the declared type.** A match must be typed `Quest['id']`. Anything else is reported, and the
   autofix writes the indexed type and its import.

Only owners the file could import count: its own package and its workspace dependencies. An owner in a
package the file cannot reach does not claim its names.

No lint rule in this repo builds a repo-wide index today. `graph-reachability` reads one statics module
it imports, not files. The index is a new capability, and it is the main cost of B4. B7, C1, C8, A2, A3
and A5 need the same kind of index, so they can share one. The file scanning behind the `discover` tool is
code that could be reused for it.

#### B5: no exported alias of a field's type

```
// before
export type QuestId = Quest['id'];
export type CliSignalAction = CliSignal['action'];     // cli-signal-contract.ts:17

// after — write the indexed type where it is used
({ questId }: { questId: Quest['id'] })
```

Ins and outs: an alias creates no new check, so it cannot drift. It is refused because it brings back
the vocabulary of names that B2 removes, and models would recreate `QuestId` in every package.

How a machine checks it: syntax only. An exported `type X = Y['k']` is refused.

#### B6: values outside object contracts are plain `string` and `number`

Parameters, returns and locals are plain when no object owns the value (B1). `ban-primitives` is
removed, since it has nothing left to refuse, and `require-zod-on-primitives` is replaced by
`require-object-contract-brands` (B1).

```
// before — loose text needs a brand, so a brand is invented
export const summaryLineTransformer = ({ quest }: { quest: Quest }): ContentText =>
  contentTextContract.parse(`${quest.title} — ${quest.status}`);

// after — loose text is a plain string
export const summaryLineTransformer = ({ quest }: { quest: Quest }): string =>
  `${quest.title} — ${quest.status}`;
```

```
// flagged
const text = z.string().brand<'ContentText'>().parse(line);       // brands a loose value no object owns (B1, B2)
({ questId }: { questId: string })                                // a name B4 claims

// left alone
export const truncateTransformer = ({ text, max }: { text: string; max: number }): string => …;
truncateTransformer({ text: quest.title, max: 80 });              // a branded value into a plain parameter
```

Ins and outs:

- **Explicit return types stay required.** Only the demand for a brand goes.
- **A brand is still minted only by a parse.** `raw as Quest['id']` is still refused.
- **A branded value may go into a plain parameter.** That is what lets text helpers like
  `truncateTransformer` work for every field. The gap it leaves is open decision 6.
- **B4 still applies to parameters.** A parameter named `questId` must be `Quest['id']`, not `string`.
- **The largest tests shrink by the stub calls that only brand one literal.** In the 28 largest test
  files, most of the brand-related bulk is a stub call such as `SessionIdStub({ value: 's-1' })`:

  | Test files | Lines that only wrap a literal in a stub | How many go |
    |---|---|---|
  | 13 largest in web, server and mcp | 857 | About half: the standalone brands (`ProcessId`, `SessionId`, `ErrorMessage`, `ContentText`, `CssPixels`, UI labels). Wraps of owned ids such as `QuestId` stay. |
  | 15 largest in orchestrator, ward, siegelense and shared | About 773 | About 729, on brands with no owner (`SessionId`, `ProcessId`, `AgentId`, `ContentText`, `WardSummary`, `AbsoluteFilePath` and others) |

  An expected value shrinks the same way: `expect(result).toBe(WardSummaryStub({ value: 'run: …' }))`
  becomes `expect(result).toBe('run: …')` (`result-to-summary-transformer.test.ts:23`). Stubs of owned
  objects, such as `QuestBlightLedgerEntryStub`, stay. Enum brands go too, because B1 puts no brand on
  an enum: `ChatLineSourceStub` (53 uses in `chat-line-process-transformer.test.ts`) disappears.
- **Repeated literals are not a brand problem.** Tests repeat values such as `'add-auth'` 169 times in
  one file. That is a missing named constant, and these rules only shorten each repeat. Tests stay
  exempt from the magic-number rule, and no rule lints magic strings.
- **Re-parsing a value that already has the brand disappears with the brand.** The type checker finds
  83 to 87 such calls in shared, orchestrator and web. 47 are `filePathContract.parse(...)` on a value
  an adapter already returned as a `FilePath`, such as
  `filePathContract.parse(pathDirnameAdapter({ path: searchPath }))` in
  `locations-eslint-config-path-find-broker.ts:34`.

Why: this removes the pressure that produced `ContentText`. Two things create that pressure today:
`ban-primitives`, and the transformers doc, which says "All transformers MUST validate output using
contracts" and teaches `return contentTextContract.parse(config.purpose);`
(`transformers-constraints.md:34-46, 137-152`). Without them, no reason is left to invent a brand.

How much it changes, from a read of every transformer:

| Package                                                                        | Transformers that brand a loose value only to avoid a plain return                       |
|--------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| shared                                                                         | 73 of 87 typed transformers; `contentTextContract.parse(...)` appears 227 times          |
| siegelense and web                                                             | 94 functions, 39 of them returning `ContentText`                                         |
| orchestrator                                                                   | 69 parse calls into `ErrorMessage`, `ContentText` or `PromptText`; 34 return types       |
| ward, hooks, mcp and server                                                    | About 190 parse calls, led by `errorMessageContract` (40) and `globPatternContract` (34) |
| cli, config, hydration, hydration-recipes, session-forensics, testing, tooling | 17 of 91 transformers                                                                    |

The same holds outside transformers, from samples of real parse calls:

| Where    | Sampled parses that brand a loose value                                                                                                                                                                       |
|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Brokers  | 44 of 129                                                                                                                                                                                                     |
| Adapters | 24 of 41, such as `fileContentsContract.parse(buffer)` on `readFile`'s result                                                                                                                                 |
| Widgets  | 27 of 35, all prop values: test ids, button labels, pixel sizes, counts. About a dozen single-purpose contracts exist only for this, such as `testIdContract`, `buttonLabelContract` and `cssPixelsContract`. |

#### B7: an owner must be a real object

A model blocked by B2 and B3 could invent an object only to get a name, such as
`contentContract = z.object({ text: z.string().brand<'ContentText'>() }).brand<'Content'>()`.

```
// flagged — contentContract is never parsed or built as a whole; only its field is used
const text = contentContract.shape.text.parse(raw);

// left alone — questContract is parsed as a whole when quest.json is read
const quest = questContract.parse(JSON.parse(raw));
```

How a machine checks it: needs a repo-wide index. An owner contract must be `.parse`d as a whole, or
used as a whole type, somewhere in production code.

#### B8: an id may not be re-branded into another field

A value that carries an owner's `id` brand may not be parsed into a field with a different brand. Store
it in a field that reuses the id schema.

```
// before — mintedBy has its own brand, so the id is re-branded to fit
mintedBy: z.string().uuid().brand<'WorkItemMintedBy'>().optional(),
…
const next: WorkItem = { ...item, mintedBy: workItemContract.shape.mintedBy.parse(parent.id) };

// after — mintedBy reuses the id schema, so the id fits as it is
mintedBy: workItemId.optional(),
…
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

Ins and outs:

- **Only ids.** An id is a reference to another object, so storing it under a new brand hides what it
  points at. A timestamp or a count copied into another field is just a value, and B1 already asks for
  the parse.
- **What counts as an id:** a brand declared on an owner's `id` key.
- **B8 only sees ids that have an owner.** Three re-brands in the code today show the edge:

  | Re-brand | Where | Does B8 catch it? |
    |---|---|---|
  | `QuestWorkItemId` becomes `ProcessId` | `command-chat-output-emit-transformer.ts:48`: `processIdContract.parse(String(workItemId))` | Yes: the source is a work item's `id`. The fix depends on whether `ProcessId` gets an owner (open decision 7). |
  | `ToolUseId` becomes `ToolName`, to use as a Map key | `merge-tool-entries-transformer.ts:37`: `toolNameContract.parse(toolUseId)` | No: `ToolUseId` is declared on `chatEntry.toolUseId`, not on an `id` key |
  | `AgentIdCorrelation` becomes `AgentId` | `tool-use-id-from-parent-lines-transformer.ts:45`: `agentIdContract.parse(toolUseResult.agentId)` | No: `AgentIdCorrelation` is declared on a stream line's `agentId` |

  Once each of those ids has an owner (open decision 7), B4 makes `toolUseId` and `agentId` reuse
  the owner's id, and B8 then sees them.
- **Most re-brands between brands that are not ids disappear under B2.** The target is usually a
  standalone brand, which B2 removes, so the value passes as a plain string with no parse:

  | Re-brand today | Where | Under the rules |
    |---|---|---|
  | `displayLabelContract.parse(operation.text)`, from `OperationText` | `execution-panel-widget.tsx:341`, and twice more in the same file | `DisplayLabel` goes; `operation.text` passes to a plain prop |
  | `claudePermissionContract.parse(permission)`, from `McpPermission` | `settings-permissions-add-broker.ts:76` | Both go; the settings contract's field brands the value when the settings are parsed |
  | `filePathContract.parse(String(sessionFilePath))`, from `AbsoluteFilePath` | `quest-monitor-watcher-start-broker.ts:142` | Both go; the path is a plain string |
  | `repoRootCwdContract.parse(quest.worktreePath)` | `quest-cwd-resolve-broker.ts:81` | `RepoRootCwd` goes (open decision 5) |

- **An object's own id copied into another of its own fields is a value, not a reference.**
  `quest-write-route-broker.ts:54` sets `folder: questContract.shape.folder.parse(fields.folder ?? id)`,
  so a new quest's folder name defaults to its id, by design. B8 as written flags this. The check
  allows it when the id and the target field sit in the same object being built:

  ```typescript
  // left alone — the quest's own id, into the same quest's folder
  questContract.parse({ id, folder: fields.folder ?? id, … })
  // flagged — another work item's id, into this work item's field
  const next: WorkItem = { ...item, mintedBy: workItemContract.shape.mintedBy.parse(parent.id) };
  ```

Why: B1 makes the compiler refuse an id in a differently-branded field. B8 closes the one way around
that refusal, so the only fix left is the right one: reuse the id schema.

How a machine checks it: needs the type checker. It checks the static type of the argument to a
field schema's `.parse`. The same-object exception needs a syntax check as well: the id and the target
field are properties of the same object literal being parsed, as in
`questContract.parse({ id, folder: fields.folder ?? id })`.

#### B9: an object type that can leave a function is a contract

`ban-adhoc-types` refuses an `interface` and an `as { … }` cast today, but not a `type` alias or a
return type built from an object literal. B9 closes that gap. An object shape that can leave a
function is data another function receives, so it is a contract, and B1 brands it.

"Can leave a function" means: the return type of a function declared at module level, a type alias at
module level (exported or not), a variable's type at module level, or a type argument at module level.

```
// before — orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.ts:81
type CarveResult =
  | { ok: true; branchName: QuestBranchName }
  | { ok: false; error: ErrorMessage };
export const stepHandlerRiftcarverBroker = async (…): Promise<CarveResult> => { … };

// after — contracts/carve-result/carve-result-contract.ts
export const carveResultContract = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), branchName: questContract.shape.branchName }).brand<'CarveResult'>(),
  z.object({ ok: z.literal(false), error: z.string().brand<'CarveResultError'>() }).brand<'CarveResult'>(),
]);
export type CarveResult = z.infer<typeof carveResultContract>;
// broker
export const stepHandlerRiftcarverBroker = async (…): Promise<CarveResult> =>
  carveResultContract.parse({ ok: true, branchName });
```

```
// before — cli/src/transformers/kebab-case-variants/kebab-case-variants-transformer.ts:19
export const kebabCaseVariantsTransformer = ({ name }: { name: string }):
  { camel: Identifier; pascal: Identifier; testId: Identifier } => …;

// after — contracts/kebab-case-variants/kebab-case-variants-contract.ts
export const kebabCaseVariantsContract = z
  .object({
    camel: z.string().brand<'KebabCaseVariantsCamel'>(),
    pascal: z.string().brand<'KebabCaseVariantsPascal'>(),
    testId: z.string().brand<'KebabCaseVariantsTestId'>(),
  })
  .brand<'KebabCaseVariants'>();
// transformer
export const kebabCaseVariantsTransformer = ({ name }: { name: string }): KebabCaseVariants =>
  kebabCaseVariantsContract.parse({ camel: …, pascal: …, testId: … });
```

```
// flagged — outside contracts/ and widgets/, in implementation and test files
type CarveResult = { ok: true } | { ok: false };                              // a module-level alias
export type WorktreeProvisionResult = { ok: true } | { ok: false; … };        // exported from a broker
(): { camel: string; pascal: string } => …                                    // a module-level function's return type
const cache: { entries: Entry[] } = { entries: [] };                          // a module-level variable's type
adapters/fs/rm-if-exists/…-adapter.ts:   (): Promise<{ removed: boolean }> => …   // adapters/ is covered now; one fact is better as Promise<boolean>
transformers/x/x-transformer.test.ts:   type LooseHandle = Record<string, unknown> & { operations: … };
interface Foo { … }                                                            // flagged today
value as { type: string }                                                      // flagged today

// left alone
({ questId, limit }: { questId: Quest['id']; limit: number }) => …            // a parameter's type: the repo's convention
(): CarveResult => …                                                           // a contract type
(): { stop: () => void; flush: () => Promise<void> } => …                     // every member is a function: a method set
const totals: { passed: number; failed: number } = { passed: 0, failed: 0 };  // inside a function body
items.reduce<{ seen: string[] }>(…, { seen: [] })                             // inside a function body
type Handle = ReturnType<typeof childProcessSpawnAdapter>;                     // no object literal in it
brokers/x/x-broker.proxy.ts:   (): { setupReturns: (…) => void; child: ChildProxy } => …   // proxies are exempt
widgets/card/card-widget.tsx:   interface CardProps { … }                      // widgets/ stays exempt
```

What it flags today, measured on 2026-09-24 (`tmp/adhoc-scope2.cjs`):

| Where                | Data shapes that become contracts                                                                         | Method sets, left alone |
|----------------------|-----------------------------------------------------------------------------------------------------------|-------------------------|
| Implementation files | 244: brokers 107, adapters 38, responders 30, transformers 25, bindings 18, startup 11, state 11, flows 4 | 35                      |
| Tests                | 3                                                                                                         | 2                       |
| Proxies (exempt)     | 224                                                                                                       | About 971               |

Ins and outs:

- **A shape that stays inside one function is left alone.** A reduce accumulator or a local total never
  leaves the function, so it creates no vocabulary and crosses no boundary. Requiring a contract, a
  stub and a test for it is the churn that makes models invent throwaway names.
- **An object type whose every member is a function is a method set,** such as a handle a timer adapter
  returns. Zod cannot check a function, so a method set stays inline.
- **A shape mixing data and functions is a contract for its data.** The data members are parsed, and
  the functions are attached outside the parse, as `contracts-constraints.md:132-133` already teaches
  and `browser-session-contract.ts` already does. Hook return values in `bindings/` are the common
  case.
- **Proxies are exempt.** A proxy's return object is its own API of scenario methods, and
  `enforce-proxy-patterns` governs it.
- **`adapters/` loses its exemption.** It was exempt so adapters could redeclare library shapes, and C2
  removed that need: library types are imported. What an adapter hands back crosses into a broker, so it
  is a contract.
- **`widgets/` stays exempt.** Its 94 interfaces are component props, which are parameter types by
  another name.
- **A branch of a union takes the owner's name.** Every object branch of `carveResultContract` is
  `.brand<'CarveResult'>()`, and fields add their keys, such as `'CarveResultError'`. A key in several
  branches uses the same schema in each, so one brand text never means two checks (B3).
- **Many of the 244 already have a contract.** Where a return type spells out a shape an existing
  contract already describes, the fix is to name that contract, not to write a new one.

Why: an object handed from one function to another is data, and every other rule in this doc treats
data as a contract with brands. Leaving `type` aliases and return types unchecked kept a side door open
for exactly the one-off types `ban-adhoc-types` exists to stop.

How a machine checks it: syntax. `ban-adhoc-types` also refuses an object type literal, or a union or
intersection containing one, in a module-level function's return type, a module-level type alias, a
module-level variable's type or a module-level type argument, unless every member of the literal is a
function. It skips `.proxy.ts` files. `adapters` gets `disallowAdhocTypes: true` in
`folder-config-statics.ts`.

### Contracts and library types

#### C1: a contract must be parsed somewhere in production code

Tests and stubs do not count.

```
// before — a copy of a library type that nothing ever parses
// tsestree-contract.ts (597 lines)
export const tsestreeContract = z.object({ type: z.enum(...), callee: recursiveBase.optional(), ... });
export type Tsestree = z.infer<typeof tsestreeContract>;
// rule broker
'CallExpression': (node: Tsestree) => { if (node.callee?.type === 'Identifier') … }

// after — the library's own type (C2)
import type { TSESTree } from '@typescript-eslint/utils';
'CallExpression': (node: TSESTree.CallExpression) => { if (node.callee.type === 'Identifier') … }
```

```
// flagged — never .parse'd in production
tsestreeContract, eslintContextContract, typescriptSourceFileContract, childProcessContract, fileStatsContract

// left alone — parsed where outside data enters
const report = jestJsonReportContract.parse(JSON.parse(stdout));
const line = streamJsonLineContract.parse(JSON.parse(rawLine));        // Claude CLI output
const pkg = packageJsonContract.parse(JSON.parse(await fsReadFileAdapter({ filePath })));   // readFile is claimed (A2)
```

Ins and outs:

- **A deleted copy's stub moves to `stubs/` (C6)** and builds the library's real value (C5).
- **No one decides what counts as a copy.** A copy is never parsed, so it fails. A contract that
  describes real outside data is parsed, so it passes.
- **The Claude CLI contracts stay.** They parse output from another process. That is describing our
  data, not copying someone's types. Their leaves follow B1 and B3.
- **A parse is not a boundary check just because it runs.** `responderResultContract` (171 production
  calls) is `z.object({ status: …, data: z.unknown() })`, so it checks nothing about `data`.
  `adapterResultContract` (118 calls) is `z.object({ success: z.literal(true) })`. Both wrap our own
  values, never outside data. C1 passes them. A7 replaces `adapterResultContract`, and open decision 8
  covers `responderResultContract`.
- **The parse of outside data may live in a broker or a transformer.** It usually sits one line after a
  read adapter returns the text: 43 of the 52 `xContract.parse(JSON.parse(...))` calls are in brokers,
  such as `usage-ledger-read-broker.ts:23`. Ward's jest, eslint and playwright report parsing, and
  orchestrator's stream-line parsing, sit in `transformers/`, and orchestrator's `CLAUDE.md` says
  parsing belongs there. C1 only asks that the parse happens somewhere in production.
- **Copies that are not contracts go too.** `tsestree-node-type-statics.ts` copies `AST_NODE_TYPES`
  into statics, so C1 does not see it. C2 makes it unnecessary: import `AST_NODE_TYPES` from
  `@typescript-eslint/utils`. That package is not yet a dependency of `eslint-plugin`, which lists only
  `@typescript-eslint/parser`, as a dev dependency.
- **A format pattern in `statics/` is not a contract,** so C1 does not apply to it (B2).

How a machine checks it: needs a repo-wide index of `.parse(` and `.safeParse(` calls outside test,
proxy and stub files, read from the syntax tree, not from text. 1,095 of the 1,103 `.parse(` lines in
`contracts/` folders are JSDoc `@example` comments. A text search would count those as parses and pass
every copy that carries an example. A copy written as a plain TypeScript type has no schema to parse,
so C1 also requires that every type a contract file exports is `z.infer` of a schema in that file.

#### C2: a library's types are imported from the library, wherever they are used, like its functions

`contracts/` holds our types. A library's types come straight from the library, in any folder, the
same way its functions do. Under A2 and A3 an unclaimed function is imported where it is used, and a
type can never be claimed, so types follow the same rule. Nothing gives a library type a second name.

```
// before — eslint-plugin/src/contracts/tsestree/tsestree-contract.ts: 597 lines copying TSESTree
export const tsestreeContract = z.object({ type: z.enum(...), callee: recursiveBase.optional(), ... });
export type Tsestree = z.infer<typeof tsestreeContract>;
'CallExpression': (node: Tsestree) => { if (node.callee?.type === 'Identifier') … }

// after — the copy is deleted; the rule imports the library's type
import type { TSESTree } from '@typescript-eslint/utils';
'CallExpression': (node: TSESTree.CallExpression) => {
  if (node.callee.type === 'Identifier') { … }       // no ?.: the real type says callee is always there
}
```

```
// flagged
contracts/x/x-contract.ts:   export type Node = { type: string; callee?: Node };        // a hand-written copy, not inferred from a schema (C1)
contracts/x/x-contract.ts:   export type EslintContext = TSESLint.RuleContext<string, []>;   // a second name for a library type
contracts/x/x-contract.ts:   export type { TSESTree } from '@typescript-eslint/utils';  // a re-export (forbid-type-reexport)

// left alone
brokers/rule/x.ts:        import type { TSESTree } from '@typescript-eslint/utils';
brokers/fs/x/x-broker.ts: import type { Stats } from 'node:fs';
stubs/child-process/child-process.stub.ts:   export const ChildProcessStub = (): ChildProcess => new ChildProcess();
```

Ins and outs:

- **Imports are consistent.** Anything from a package, function or type, is imported where it is used.
  The one exception is a claimed function (A2), which only adapters may import. A type is never
  claimed, because nothing can be handled around a type.
- **What models are told changes by one word.** "Every type lives in `contracts/`" becomes "every type *we
  define* lives in `contracts/`; a library's types come from the library, like its functions".
- **No alias gives a library type a second name.** `export type EslintContext = TSESLint.RuleContext<…>`
  is refused. It is a name models would learn and repeat, and the library's own name already works.
- **Discovery still shows the library types that tests build.** Each has a stub folder under `stubs/`
  (C6), such as `stubs/tsestree/`, and inventory lists it.
- **Duplicates stay impossible without discovery.** C1 refuses a copy that nothing parses, and C5
  refuses a hand-built value cast to a library type. So a library type does not need to appear in
  `contracts/` to stay deduplicated.
- **A library stub returns the library's own type,** such as `CallExpressionStub(): TSESTree.CallExpression`
  or `ChildProcessStub(): ChildProcess` (C5).
- **Type imports never count toward the adapter rules (A1 to A5).** A type import cannot call
  anything, so it opens no path around the adapters. A2 claims value imports only.
- **Library data types may flow out of adapters.** An adapter may return `Stats`, as `fsStatAdapter`
  already does (`fs-stat-adapter.ts:12`). Rule A6 covers the one exception: library objects that have
  methods.
- **A library value enters our objects only through a parse.** `node.name` is a plain `string`. It
  becomes a brand only when a contract parses it into an owned field.

Why: types were copied because a contract could not import them, and models were told that every type
lives in a contract. Importing a type the same way as its function removes the copy and the mismatch
between the two. The library stays the source of truth, and an upgrade flows through with no hand
edits.

How a machine checks it: syntax. `import type` from a package is allowed in every folder. In
`contracts/`, an exported type alias whose right-hand side is only a library's type is refused.

#### C3: a type predicate may narrow to a library type, never to one of our contract types

A guard written as `(value): value is X` tells the compiler "trust me". For a library union that is
normal narrowing. For one of our contract types it mints the type with no parse, which is a cast.

```
// before — hooks/src/guards/is-dungeonmaster-hooks-config/is-dungeonmaster-hooks-config-guard.ts:15
(value: unknown): value is DungeonmasterHooksConfig =>
  typeof value === 'object' && value !== null && 'preEditLint' in value;
// cli/src/guards/has-dev-dependencies/has-dev-dependencies-guard.ts:14
(params): params is { obj: { devDependencies: DependencyMap } } => …

// after — parse through the contract
const config = dungeonmasterHooksConfigContract.safeParse(value);
if (config.success) { … config.data … }
```

```
// flagged — narrows to a type declared in contracts/, or to one carrying a brand
(value: unknown): value is DungeonmasterHooksConfig => …
(value: unknown): value is Quest['id'] => …

// left alone — narrows a library's own union
(node: TSESTree.Node): node is TSESTree.CallExpression => node.type === AST_NODE_TYPES.CallExpression;
// left alone — returns a plain boolean
({ error }: { error: unknown }): boolean => …
```

Ins and outs:

- **Most guards already return a plain `boolean`.** All 52 in shared, all 26 in siegelense and web, and
  all 23 that use the TSESTree copy in eslint-plugin do. The two above are the cases found.
- **Casts mint brands the same way.** `source as ModulePath` (`ast-get-imports-transformer.ts:28`),
  `imp.replace(...) as ImportPath` (`folder-dependency-tree-transformer.ts:72`) and
  `result.replace(pattern, '') as ErrorMessage` (three times in `strip-timeout-noise-transformer.ts`)
  are already refused by the rule that a brand is minted only by a parse. B6 removes most of them,
  because those values are loose and lose their brand.

How a machine checks it: needs the type checker. It checks whether the predicate's target type is
declared under `contracts/` or carries a brand.

#### C4: parsed JSON goes straight into a contract's parse

The result of `JSON.parse(...)` or `response.json()` must be the direct argument of a contract's
`.parse` or `.safeParse`. It may not be stored, cast, returned or read first.

```
// before — shared/src/adapters/fetch/get/fetch-get-adapter.ts:24
return JSON.parse(text) as TResponse;
// before — hooks/src/flows/hook-pre-edit/hook-pre-edit-flow.ts:20
const parsed: unknown = JSON.parse(inputData);
// before — web/src/transformers/format-tool-input/format-tool-input-transformer.ts:43-48
try { return JSON.parse(toolInput) as unknown; } catch { return undefined; }

// after
return contract.parse(JSON.parse(text));                       // the caller hands the adapter its contract
const hookInput = preEditHookInputContract.parse(JSON.parse(inputData));
try { return toolInputContract.parse(JSON.parse(toolInput)); } catch { return undefined; }
```

```
// flagged
JSON.parse(text) as Settings                           // a cast
const raw: unknown = JSON.parse(text);                 // stored before any check
JSON.parse(text).version                               // read before any check
return await response.json();                          // returned unchecked

// left alone
settingsContract.parse(JSON.parse(text))
statusContract.safeParse(await response.json())
```

Ins and outs:

- **Today, 87 of 139 `JSON.parse` calls in production code do not go straight into a contract.** 47
  store the result in a variable first, 39 cast it (mostly `as unknown`), and 12 read a property off it
  before any check. None of the 26 `response.json()` calls goes straight into a contract.
- **Storing the result as `unknown` and parsing it later is refused too.** The rule is about where the
  value goes next, so a machine can check it without dataflow. The window between the two lines is
  where unchecked reads creep in.
- **Malformed text throws before the contract runs.** `safeParse` does not catch a `JSON.parse` error.
  `JSON.parse` does no I/O, so a `try` around both, with a fallback, may sit in a transformer (A1).
- **A generic adapter takes the contract from its caller.** A fetch adapter cannot know every response
  shape, so the caller passes the contract in, and the adapter calls `contract.parse(...)`. Recognising
  a parameter as a contract needs the type checker.

Why: outside data gets exactly one check, where it enters. Every step between the parse and the check
is a place to use the data unchecked.

How a machine checks it: syntax. Walk up from the `JSON.parse` or `.json()` call through `await` and
parentheses, and require a `.parse` or `.safeParse` call whose argument it is.

#### C5: a test value of a library type is built by its stub, from the library where it can be, and typed as the library's type

A stub for one of our contracts parses through the contract. A library type has no contract once C1
deletes the copies, so its stub builds the value itself, and its return type is the library's own
type. The caller passes only what the test is about, as with every other stub. Production code keeps
the library's own types.

```
// before — hand-built nodes through the copy; TsestreeStub is called 1,856 times in 60 test and proxy files
const node = TsestreeStub({
  type: TsestreeNodeType.CallExpression,
  callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'foo' }),
});   // compiles with no `arguments`, a CallExpression the real parser never produces

// after — one stub per node type; each parses its own default code with the real parser
const node = CallExpressionStub();                         // parses 'foo()' and returns its CallExpression
const withArgs = CallExpressionStub({ code: 'bar(1, 2)' });
// both are TSESTree.CallExpression: `arguments`, `range` and `parent` are all real
```

```
// before — a partial ESLint context through the copy; EslintContextStub is called 307 times in 21 files
const context = EslintContextStub({ getFilename: () => 'x.ts', report: jest.fn() });

// after — the stub returns a complete TSESLint.RuleContext; the compiler checks every member is there
const context = RuleContextStub({ filename: 'x.ts' });
```

```
// flagged — a library type built by hand and cast, in a test, proxy or stub file
const node = { type: 'CallExpression' } as TSESTree.CallExpression;
const sourceFile = { fileName: 'x.ts' } as unknown as ts.SourceFile;
const context = { report: jest.fn() } as Partial<TSESLint.RuleContext<string, []>>;

// left alone — the stub builds it and returns the library's type
export const CallExpressionStub = ({ code = 'foo()' } = {}): TSESTree.CallExpression => …;   // the real parser
export const SourceFileStub = ({ code = '' } = {}): ts.SourceFile => ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true);
export const ChildProcessStub = (): ChildProcess => new ChildProcess();
export const RuleContextStub = (…): TSESLint.RuleContext<string, readonly unknown[]> => ({ … });   // complete, no cast
```

How each stub builds its value:

| Stub on a copied type today | Test and proxy files | Calls | What the new stub does                                                                                                                                          |
|-----------------------------|----------------------|-------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `TsestreeStub`              | 60                   | 1,856 | One stub per node type (`CallExpressionStub`, `IdentifierStub`, …) in the same file, each parsing default code with `@typescript-eslint/parser`                 |
| `EslintContextStub`         | 21                   | 307   | `RuleContextStub` returns a complete `TSESLint.RuleContext`                                                                                                     |
| `TypescriptSourceFileStub`  | 7                    | 38    | `SourceFileStub` calls `ts.createSourceFile` and returns a `ts.SourceFile`. 6 of the 7 caller files already build a real source file this way and then wrap it. |
| `ChildProcessStub`          | 3                    | 7     | Calls `new ChildProcess()` and attaches `PassThrough` streams                                                                                                   |
| `FileStatsStub`             | 3                    | 6     | `StatsStub` returns a complete `Stats` object: about 14 data fields, 4 date getters and 7 `is…()` methods                                                       |
| `TimerHandleStub`           | 3                    | 9     | Makes a real timer and clears it; `.unref()` gives one whose `hasRef()` is `false`. `is-timer-holding-loop-guard.test.ts:43` already does this once.            |
| `McpServerClientStub`       | 3                    | 8     | Nothing: its contract has no production importer, so both go                                                                                                    |

Ins and outs:

- **The copies do harm today, where they meet real code.** Production adapters already return the
  real Node types: `fsStatAdapter` returns `Promise<Stats>` (`fs-stat-adapter.ts:12`). So the proxies
  cast the thin stub into the real slot, and the code under test receives an object with no `.kill()`,
  no `.on()` and no `.isSymbolicLink()`:

  | Where | What it does |
    |---|---|
  | `hooks/src/adapters/child-process/spawn/child-process-spawn-adapter.proxy.ts:13` | `returns(childProcess as NodeChildProcess)` |
  | `hooks/src/adapters/fs/stat/fs-stat-adapter.proxy.ts:15` | `resolves(stats as unknown as Stats)` |
  | `testing/src/adapters/typescript/ast-to-mock-calls/typescript-ast-to-mock-calls-adapter.ts:25` | Production code casts the copy back: `sourceFile as unknown as ts.SourceFile` |
  | `testing/src/contracts/timer-handle/timer-handle-contract.test.ts:35` | Parsing a real timer through the copy returns `{}`: the parse strips `hasRef` |

- **Hand-built AST trees are deep, and some are impossible.** The deepest single `TsestreeStub` call
  nests 14 levels (`validate-adapter-mock-setup-layer-broker.test.ts`). Tests build a `CallExpression`
  with no `arguments` and `MemberExpression` nodes with no `computed` or `optional`, which the copy does
  not even model. From parsed code, those trees shrink to one line:

  ```typescript
  // before — ast-callee-root-name-transformer.test.ts:87-104: five hand-built nodes
  const node = TsestreeStub({ type: TsestreeNodeType.CallExpression,
    callee: TsestreeStub({ type: TsestreeNodeType.CallExpression,
      callee: TsestreeStub({ type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'describe' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'each' }) }) }) });
  // after
  const node = CallExpressionStub({ code: "describe.each(table)('name', fn);" });
  ```

- **The ESLint context stub is almost always `{ report }`.** Of its 307 calls, nearly all override
  only `report`. Scope and source code overrides are essentially unused.
- **A test that corrupts a node on purpose keeps doing so after building a real one.**
  `validate-proxy-constructor-side-effects-layer-broker.test.ts:88-89` sets
  `bodyRef.body = 'not-an-array' as never` to test defensive code against a shape no parser produces.
  That cast is to `never`, not to a library type, so C5's check leaves it alone.
- **JSX node types need the parser's `jsx` option.** `is-jsx-structural-child-guard.test.ts` builds
  `JSXElement` and `JSXFragment` nodes, so the shared parse function passes that option for them.
- **The library builds the value wherever it can.** Checked on Node 22.17: `new ChildProcess()` gives a
  real instance without spawning anything, and `setTimeout` gives a real timer handle. The `fs.Stats`
  constructor works but is deprecated (warning `DEP0180`), so that stub builds the object instead.
- **Where the library cannot, the stub builds the complete object.** An ESLint rule context exists only
  while ESLint lints, and a `Stats` object comes from real I/O. The stub writes every member, typed as
  the library type, with no `Partial` and no cast, so the compiler checks that nothing is missing.
- **One stub per node type, but only for the types tests use.** Tests build 68 distinct node types
  today. The 12 most common cover 81% of uses (1,602 of 1,974): `Identifier`,
  `ArrowFunctionExpression`, `CallExpression`, `MemberExpression`, `ObjectExpression`, `Program`,
  `BlockStatement`, `ReturnStatement`, `Literal`, `ExpressionStatement`, `Property` and
  `VariableDeclaration`. All of them share one exported parse-and-find function.
- **A real AST node needs its `parent` links set.** `@typescript-eslint/parser` does not set them.
  ESLint adds them while it walks the tree. The shared function sets them by walking the tree once
  (`simpleTraverse(ast, { enter() {} }, true)` from `@typescript-eslint/typescript-estree`). Checked on
  2026-09-24: parsing `foo(a)` gave a real `CallExpression` with its `arguments`, and after the walk
  its `parent` was set.
- **The cost is small.** Loading the parser takes about 250 ms once per test file. After that, a parse
  and the walk take about 0.18 ms (1,000 warm calls in 176 ms). Across the 60 test files that use
  AST stubs, that adds roughly 15 seconds once, not per call.
- **Whole-rule behaviour is still tested through ESLint's `RuleTester`,** as
  `eslint-rule-tester-adapter` does today, in 72 test files with real code strings. C5 covers the guard
  and transformer tests below that. Only one file uses both, for a case `RuleTester` cannot reach.
  `brokers/rule/CLAUDE.md:109` documents the split.
- **Our own objects are not library types.** A handle an adapter returns under A6, such as siegelense's
  browser session, is our shape, and its stub builds it directly. `browser-session-contract.ts:2-4`
  says it describes the page's operations "without this package ever importing Playwright". Its stub
  is the most used of these (28 files, about 119 calls), and it stays as it is.
- **Library stubs live in the `stubs/` folder type (C6),** such as `stubs/tsestree/tsestree.stub.ts`.
  They need no contract beside them, and the folder type lets them import the library that builds
  their value.

Why: a hand-built library value has the shape the author imagined, the same problem as invented
failures (T5). Code tested against it passes on inputs the real library never
produces. Building the value in the stub keeps that work in one place, and production code never
changes its types to suit a test.

How a machine checks it: syntax plus type imports. In test, proxy and stub files, refuse an object
literal cast to a type imported from a package, with `as`, `as unknown as`, or through `Partial<…>`. In
`stubs/`, a stub for a library type must declare that library type as its return type.

#### C6: stubs are a folder type of their own

Every stub moves out of `contracts/` into a new `stubs/` folder type: stubs for our contracts and stubs
for library types alike. A stub for a library type then needs no contract beside it, and no production
code can reach a stub.

```text
before
packages/shared/src/contracts/quest/quest-contract.ts
packages/shared/src/contracts/quest/quest.stub.ts
packages/shared/contracts.ts        exports questContract AND QuestStub — 232 stubs in the production entry point
packages/eslint-plugin/src/contracts/tsestree/tsestree-contract.ts   the 597-line copy, kept so its stub has a contract
packages/eslint-plugin/src/contracts/tsestree/tsestree.stub.ts

after
packages/shared/src/contracts/quest/quest-contract.ts
packages/shared/src/stubs/quest/quest.stub.ts            parses through questContract, as today
packages/shared/stubs.ts            a test-only entry point: @dungeonmaster/shared/stubs
packages/eslint-plugin/src/stubs/tsestree/tsestree.stub.ts   CallExpressionStub and the rest, from the real parser
                                                              (no contract: the copy is deleted)
```

The folder type's entry in `folder-config-statics.ts`:

```
stubs: {
  fileSuffix: ['.stub.ts'],
  exportSuffix: 'Stub',
  exportCase: 'PascalCase',
  folderDepth: 1,
  folderPattern: 'stubs/[domain]/[domain].stub.ts',
  // contracts/ to parse our types; node_modules so a library stub can build a real value (C5)
  allowedImports: ['contracts/', 'statics/', 'stubs/', '@dungeonmaster/shared/@types', 'node_modules'],
  requireProxy: false,
  requireStub: false,
  meta: {
    purpose: 'Build test values: our types through their contract parse, library types from the library itself',
    whenToUse: 'Test data for one of our contracts or for a library type',
  },
},
```

```
// flagged — production code reaching a stub
brokers/quest/x/x-broker.ts:   import { QuestStub } from '@dungeonmaster/shared/stubs';
contracts.ts:                  export { QuestStub } from './src/stubs/quest/quest.stub';   // a stub in a production barrel

// left alone
brokers/quest/x/x-broker.test.ts:    import { QuestStub } from '@dungeonmaster/shared/stubs';
adapters/fs/stat/fs-stat-adapter.proxy.ts:   import { StatsStub } from '../../../stubs/stats/stats.stub';
```

Ins and outs:

- **Stubs ship in production today.** `packages/shared/tsconfig.build.json` excludes `**/*.stub.ts`, but
  `contracts.ts` exports 232 stubs beside its 233 contracts. The compiler follows those imports, so all
  232 stubs are in `packages/shared/dist`, and `dist/contracts.js` loads them. Every production import
  of `@dungeonmaster/shared/contracts` loads every stub. Checked on 2026-09-24. Under C5 a library stub
  imports its library's parser or constructor, so this would load those into production too.
- **A separate entry point keeps them out.** Each package gets a `stubs.ts` barrel and a `./stubs`
  export. Only test, proxy, harness and stub files may import from `stubs/` or from a `/stubs` entry
  point. With nothing in production importing them, the build's `**/*.stub.ts` exclusion finally holds.
- **A contract still has a stub, found by domain name.** `requireStub` on `contracts/` now means
  `contracts/quest/quest-contract.ts` has a matching `stubs/quest/quest.stub.ts`. The pairing crosses
  folders, and no longer relies on the two files sitting side by side.
- **A library stub is named for the library type.** `stubs/tsestree/`, `stubs/child-process/`,
  `stubs/stats/`. A stub used by more than one package lives in the package they all depend on, or in
  `@dungeonmaster/testing`, and is reached through its `/stubs` entry point.
- **Discovery shows them.** `stubs/` is a folder type, so inventory and the project map list it. The
  library types the tests build are visible by their stub folders.
- **Consumer repos get the folder type too.** It joins the architecture that `get-architecture` and
  the folder types snippet teach, so a consumer's stubs follow the same layout.
- **The move is mechanical.** 1,083 stub files move from `contracts/<domain>/` to `stubs/<domain>/`,
  and every import of them is rewritten. No stub changes what it builds, except the library stubs C5
  rebuilds.
- **Stubs are test support, not production code,** so the adapter rules (A1 to A7) do not apply to
  them. A library stub may call `new ChildProcess()` or the parser directly.

Why: today a stub's home is "next to its contract", which leaves a library stub with no home and puts
every stub inside the production entry point. A folder type of its own answers both.

How a machine checks it: syntax. `enforce-project-structure` places `.stub.ts` files only under
`stubs/`. `enforce-import-dependencies` refuses an import of `stubs/` or a `/stubs` entry point from any
file that is not a test, proxy, harness or stub file. `enforce-implementation-colocation` pairs each
contract with its stub by domain name.

#### C7: contracts, stubs, transformers, statics and bindings may split into layer files

Layer files are the architecture's way to split a file past 300 lines: `{name}-layer-{suffix}`, flat
beside the parent, imported only by the parent. Today only `flows/`, `adapters/`, `brokers/`,
`responders/` and `widgets/` allow them. Five more folder types need them:

| Folder type     | Files over 300 lines today | Largest                                    | Why it grows under this doc                                |
|-----------------|----------------------------|--------------------------------------------|------------------------------------------------------------|
| `statics/`      | 20                         | `eslint-rule-statics.ts`, 1,036 lines      | Shared regex patterns move here (B2)                       |
| `transformers/` | 5                          | `next-action-transformer.ts`, 619 lines    | Parsing of outside text stays here (C1)                    |
| `contracts/`    | 2                          | `step-contract.ts`, 396 lines              | Every object, nested object and field carries a brand (B1) |
| `stubs/`        | 2 today, in `contracts/`   | `assistant-stream-line.stub.ts`, 369 lines | One AST stub per node type that tests use: 68 today (C5)   |
| `bindings/`     | 1                          | `use-quest-chat-binding.ts`, 961 lines     | —                                                          |

`guards/`, `errors/`, `middleware/` and `state/` stay without layers: none has a file over 300 lines,
and the largest is 288.

```text
// after — a contract split into layers
contracts/quest/quest-contract.ts                   the owner: imports its layers
contracts/quest/owner-layer-contract.ts             the nested object the owner holds under `owner`
contracts/quest/owner-layer-contract.test.ts

// after — a stub file split into layers
stubs/tsestree/tsestree.stub.ts                     the shared parse-and-find function; re-exports every node stub
stubs/tsestree/expression-layer.stub.ts             CallExpressionStub, MemberExpressionStub, …
stubs/tsestree/statement-layer.stub.ts              ReturnStatementStub, VariableDeclarationStub, …
```

```
// contracts/quest/owner-layer-contract.ts — its brand text comes from how the parent uses it
export const ownerLayerContract = z
  .object({ name: z.string().brand<'QuestOwnerName'>() })
  .brand<'QuestOwner'>();

// contracts/quest/quest-contract.ts
import { ownerLayerContract } from './owner-layer-contract';
export const questContract = z
  .object({
    id: z.string().min(1).brand<'QuestId'>(),
    owner: ownerLayerContract,               // the key `owner` decides the layer's text: 'QuestOwner'
  })
  .brand<'Quest'>();
```

```
// flagged
contracts/quest/owner-layer-contract.ts:   .brand<'OwnerLayer'>()          // text must follow the parent's key: 'QuestOwner'
brokers/x/x-broker.ts:   import { ownerLayerContract } from '…/contracts/quest/owner-layer-contract';   // only the parent imports a layer
guards/is-x/is-x-layer-guard.ts                                             // guards/ does not allow layers

// left alone
brokers/x/x-broker.ts:   ({ owner }: { owner: Quest['owner'] })            // the nested type, reached through its owner
contracts/quest/quest-contract.ts:   owner: ownerLayerContract,
```

Ins and outs:

- **A layer contract's brand text follows the parent's key, not the layer's file name.** It is the
  parent's owner name plus the key the parent uses it under, the same text an inline nested object
  would have (B3). Its fields add their keys after that. The lint rule traces the layer to its one use
  in the parent, as it does for a local id const.
- **Code outside the folder reaches a layer's type through its owner,** as `Quest['owner']`. A layer is
  never exported from a barrel.
- **A layer contract is parsed when its parent is,** so it passes C1 and B7 through the parent.
- **A layer contract gets a test, not a stub.** Tests build the nested object through the parent's
  stub: `QuestStub({ owner: { name: 'n' } }).owner`.
- **A stub layer is re-exported by its parent stub file,** so tests import only the parent, as the
  layer convention requires. Stubs keep having no tests of their own.
- **A statics layer follows the statics test rule:** it needs a test only when it holds a regex, not
  the "every layer carries its own test" default.
- **A transformer layer stays pure,** like its parent, and has its own test. A binding layer is a hook
  like its parent.
- **Adapters keep their existing layer rule:** the outside call stays in the parent adapter.

Why: brands on every object and field make contracts longer, and one stub per AST node type makes one
long stub file. Without layers, a long file has nowhere to split, and a model starts a second domain
folder to get room, which scatters one owner across folders.

How a machine checks it: syntax. `allowsLayerFiles` becomes `true` for `contracts`, `stubs`,
`transformers`, `statics` and `bindings` in `folder-config-statics.ts`, and `enforce-project-structure`
reads it. `enforce-implementation-colocation` applies each folder type's own test and proxy
requirements to its layers. `require-object-contract-brands` derives a layer contract's text from its
use in the parent.

#### C8: a contract name is unique across the repo's workspace packages

A5 keeps one home for each outside function. C8 does the same for contracts. B3 derives every brand
text from the contract's name, so two packages that each define `packageJsonContract` both mint
`'PackageJsonName'`, possibly with different checks behind it. That is the `FolderType` bug: one brand
text, two checks, interchangeable to the compiler.

```text
// before — measured on 2026-09-24 (tmp/dup-contracts.cjs, list in tmp/dup-contracts.txt)
37 contract names are defined in more than one package, for example:
  filePathContract       config, eslint-plugin, hooks, server, shared, testing
  packageJsonContract    cli, shared, testing, ward
  isoTimestampContract   orchestrator, server, session-forensics, web
  folderConfigContract   config, shared
  toolResponseContract   hooks, mcp

// after — one package owns each name; the others import it
packages/shared/src/contracts/package-json/package-json-contract.ts    the one packageJsonContract
packages/cli, ward, testing                                             import it from @dungeonmaster/shared/contracts
```

```
// flagged — shared already defines packageJsonContract
packages/ward/src/contracts/package-json/package-json-contract.ts:
  export const packageJsonContract = z.object({ … }).brand<'PackageJson'>();

// left alone — a different name, even with the same shape: its brand texts differ
packages/siegelense/src/contracts/kill-args/kill-args-contract.ts:
  export const killArgsContract = z.object({ instanceId: … }).brand<'KillArgs'>();
packages/siegelense/src/contracts/snapshots-args/snapshots-args-contract.ts:
  export const snapshotsArgsContract = z.object({ instanceId: … }).brand<'SnapshotsArgs'>();
```

Ins and outs:

- **The package that keeps a name is the lowest one every user depends on.** Usually that is `shared`.
  A package lower in the graph cannot import from one above it, so the contract moves down, not up.
- **Path contracts show the cost.** There are 16 path contracts in 10 packages, most checking nothing,
  and `FilePath` alone is defined in 6 packages with 3 different meanings. Zod treats all six as one
  type, so an unchecked copy passes wherever the checked one is expected.
- **Many of the 37 go away on their own.** `filePathContract`, `isoTimestampContract`,
  `fileContentsContract`, `fileNameContract`, `exitCodeContract` and `globPatternContract` are
  standalone scalar brands, which B2 removes. The object contracts are the ones C8 merges.
- **The same shape under a different name is allowed.** 10 object contracts have a schema identical to
  another one once brands are ignored, 8 of them under a different name. Some are copies, such as
  orchestrator's and web's `dispatchPlayResponseContract`, which C8 catches by name, and
  `dmQuestOutboxLineContract` beside `questOutboxLineContract`. Others are two meanings that happen to
  share a shape, such as `killArgsContract` and `snapshotsArgsContract`. A machine cannot tell those
  apart, and their brand texts differ, so the compiler already keeps them from mixing.
- **The stub moves with its contract.** `stubs/<domain>/` follows the one package that keeps the name (C6).
- **"The repo" is the same as for A5:** the workspace packages under `packages/*`, never
  `node_modules`.
- **This makes B3's uniqueness hold across packages.** Within a package, owner plus key is unique by
  construction. C8 makes owner names unique across packages, so a brand text is unique repo-wide.

Why: a second contract with the same name is either a copy that will drift, or a different check
hiding behind the same brand text. Both are the duplication A5 stops for adapters.

How a machine checks it: needs an index, across the repo's own workspace packages, of every exported
contract name. This is the same kind of index B4 and A5 use, and they can share it. The lint rule
`enforce-unique-contract-names` names the package that already defines the name.

### Adapters

An adapter still has the two jobs it was meant for: hold logic that would otherwise be repeated at
every caller, and turn outside data into our shapes, so that swapping a library touches only adapters.
The rules below enforce those jobs without anyone judging an adapter's worth.

The second job belongs to an adapter only when one function both fetches the data and parses it, as
`gitLogNameOnlyAdapter` does. When one adapter has already fetched the text, turning that text into
our shapes is a transformer's job. `chat-line-process-transformer.ts` parses lines that
`fsWatchTailAdapter` read, and it stays a transformer.

#### A1: handling around an outside call lives in an adapter

An outside function here is any function from outside the repo, not only a Node I/O call (see "Words
used below").

```
// before — the same handling written differently at each caller
// broker-a.ts
try { raw = await readFile(p, 'utf8'); } catch { raw = undefined; }
// broker-b.ts
const raw = await readFile(p, 'utf8').catch(() => null);
// broker-c.ts
catch (error) { if ((error as { code: unknown }).code === 'ENOENT') return []; throw error; }

// after — one adapter holds it
// adapters/fs/read-file-if-exists/fs-read-file-if-exists-adapter.ts
export const fsReadFileIfExistsAdapter = async ({ filePath }: { filePath: string }) => {
  try { return await readFile(filePath, 'utf8'); }
  catch (error) { if (isNotFoundError(error)) return undefined; throw error; }
};
// broker-a.ts, broker-b.ts
const raw = await fsReadFileIfExistsAdapter({ filePath: p });
```

This table shows A1 on its own. Moving the handling on the right into an adapter claims the function.
From then on, A2 also moves the plain calls on the left into adapters.

| Left alone by A1 outside an adapter: a failure reaches the caller | Flagged outside an adapter: the code decides what a failure means |
|-------------------------------------------------------------------|-------------------------------------------------------------------|
| `await readFile(p)`                                               | `try { await readFile(p) } catch { return defaults }`             |
| `await readFile(p)`                                               | `readFile(p).catch(() => null)`                                   |
| `readFile(p).then(parse)`                                         | `readFile(p).then(parse, () => null)`                             |
| `await Promise.all([readFile(a), readFile(b)])`                   | `await Promise.allSettled([readFile(a), readFile(b)])`            |
| `await fetch(url)`                                                | `await Promise.race([fetch(url), timeout(5000)])`                 |
| `await fetch(u)`                                                  | `for (…) { try { return await fetch(u) } catch {} }` (a retry)    |
| `throw error`                                                     | `catch (error) { if (error.code === 'ENOENT') … }`                |
| `useState(0)`, `context.report(...)`                              | (a host library: nobody handles failures around these)            |

Ins and outs:

- **A `try` whose block calls no outside function is left alone.** A responder turning its own broker's
  error into a 500 is not handling an outside call.
- **Workspace packages are not outside.** Handling around `StartOrchestrator.getQuest(...)` is the
  caller's business. The provider ships the proxy (T6).
- **`filePath: string` is plain on purpose.** No object owns a path handed to a file read (B6).
- **Handling around an adapter's call is common today.** 142 broker, responder and flow files wrap a
  `try`/`catch` around a call to an adapter in their own package. The same two-line
  `catch { return undefined }` or `catch { return [] }` appears a dozen times in
  `packages/shared/src/brokers/architecture/`. Each one moves into the adapter it wraps.
- **A silent `catch` is refused everywhere,** adapters included. An empty `catch` block, or one holding
  only a comment, is not handling. `ban-silent-catch` already enforces this.
- **Pure globals are not outside.** `try { return toolInputContract.parse(JSON.parse(text)) } catch
  { return undefined }` in a transformer is left alone by A1. A fallback for malformed text is not
  handling an outside call. C4 still requires the contract parse inside the `try`
  (`format-tool-input-transformer.ts:43-48` and `jest-json-parse-transformer.ts:26` do not have it
  today).
- **Handling around an adapter's own call counts too.** `step-until-broker.ts:110` catches a failure
  from `session.waitForMatch(...)`, a method on the object the Playwright session adapter returned, and
  classifies it with `isPlaywrightTimeoutErrorGuard`. The adapter should decide what a timeout means
  and return that. The same shape appears 65 times around `fsReadFileAdapter` (see "Handling, proxies and brands that do
  work"). A call counts
  as an adapter call when its function is imported from `adapters/`, or is a method of an object an
  adapter returned. The second case needs the type checker.
- **Classifying an error that arrived as data is not handling.** `riftcarver-failure-classify-transformer.ts:40`
  calls `isPermissionDeniedErrorGuard` on an `error` parameter that someone else caught. It is left
  alone.
- **A function passed in as a parameter hides the outside call.** `safe-xml-parse-transformer.ts:14-26`
  catches failures of a `parseXml` callback, and its caller passes in `fastXmlParserParseAdapter`.
  Nothing in the file imports the library, so an import-based check cannot see it. Catching this needs
  the type checker or dataflow (open decision 11).

How a machine checks it: syntax plus the file's imports, and the type checker for a method on an
object an adapter returned. A promise handled later through a variable needs dataflow (open decision 11).

#### A2: once an adapter handles a function, only adapters may import it

A function is **claimed** once any adapter in the repo handles its failures. From then on, that
function may be value-imported only in `adapters/`, anywhere in the repo. Other adapters may import it.

```
// before — once fsReadFileIfExistsAdapter exists, a broker can still call readFile raw and skip the handling
import { readFile } from 'fs/promises';
const raw = await readFile(p, 'utf8');                    // no one notices the missing ENOENT case

// after — flagged, because readFile is claimed
import { readFile } from 'fs/promises';
//      ^ readFile is claimed by adapters/fs/read-file-if-exists. Import it only in adapters/.
//        Use fsReadFileIfExistsAdapter, or fsReadFileAdapter for a read that must fail loudly.
```

```
// flagged — readFile is claimed
brokers/x.ts:       import { readFile } from 'fs/promises';

// left alone
adapters/fs/read-file/fs-read-file-adapter.ts:   import { readFile } from 'fs/promises';
brokers/x.ts:       import { rename } from 'fs/promises';      // rename is not claimed
widgets/x.tsx:      import { useState } from 'react';          // nobody handles useState
brokers/rule/x.ts:  import type { TSESTree } from '@typescript-eslint/utils';   // types never count (C2)
```

Ins and outs:

- **Why "handled", not "imported".** The first version of this rule said a function is claimed once any
  adapter imports it. That version breaks host libraries. These packages are value-imported by both
  adapters and ordinary code today:

  | Package | Imported by adapters in | Also imported by |
    |---|---|---|
  | `react` | web (the xyflow adapters) | widgets, bindings |
  | `hono` | server | flows |
  | `@mantine/core` | web | widgets |

  Claiming on import would stop every widget from importing React. Claiming on handling does not,
  because nobody handles failures around `useState`.
- **Per function, not per module.** Claiming `readFile` does not claim `rename`. A module-level claim
  would pull every `fs` call into adapters, which is today's 349-adapter world.
- **A claimed function still needs a plain use now and then.** A read that must fail loudly cannot use
  `fsReadFileIfExistsAdapter`. A3 allows a pass-through for exactly this case.

Why: once someone decided a function's failures need handling, nobody can call it raw elsewhere and
quietly skip that handling.

How a machine checks it: needs an index, across the repo's own workspace packages, of which outside
functions any adapter handles. Packages in `node_modules` are not read, so in a consumer repo an
adapter shipped by dungeonmaster claims nothing (A5, decision 4).

#### A3: a pass-through adapter is allowed only for a claimed function

Otherwise, call the function directly.

A pass-through is refused while code can still call the function directly. It is allowed once A2 has
taken direct calls away. With `readFile`:

1. Nobody handles `readFile`'s failures. Brokers import `readFile` and call it. An `fsReadFileAdapter`
   that only forwards adds nothing, and A3 refuses it.
2. Someone writes `fsReadFileIfExistsAdapter`, which catches "file not found". An adapter now handles
   `readFile`'s failures, so `readFile` is claimed (A2).
3. From then on, only adapters may import `readFile`, so nothing can call it raw and skip the handling.
4. A broker wants a read that fails loudly when the file is missing. `fsReadFileIfExistsAdapter` hides
   that failure, and the broker can no longer import `readFile`.
5. So it needs an adapter that only calls `readFile`: `fsReadFileAdapter`. A3 allows it, because step 3
   left no other way to reach `readFile`.

An adapter that makes more than one call, builds its own arguments, handles failures, or parses what
comes back into one of our object contracts is not a pass-through, so A3 never applies to it. Parsing
the result into a standalone scalar brand does not count: B6 removes that brand, and what is left is a
pass-through.

```
// before — pass-throughs for functions no one handles, repeated per package
// path-join-adapter.ts, in 5 packages (shared's copy: packages/shared/src/adapters/path/join/path-join-adapter.ts:14)
export const pathJoinAdapter = ({ paths }) => filePathContract.parse(join(...paths));
// packages/web/src/adapters/rxjs/filter/rxjs-filter-adapter.ts   (proxy file is empty)
export const rxjsFilterAdapter = ({ source, predicate }) => source.pipe(filter(predicate));

// after — call it directly; the result is a plain string (B6)
import { join } from 'path';
const configPath = join(root, '.dungeonmaster.json');
```

```
// flagged — rename is not claimed, so this adapter adds nothing
export const fsRenameAdapter = async ({ from, to }) => { await rename(from, to); return { success: true }; };

// left alone — readFile is claimed (A2), so a plain read needs an adapter, and this is it
export const fsReadFileAdapter = async ({ filePath }) => readFile(filePath, 'utf8');

// left alone — not a pass-through: more than one call, arguments built, output framed
export const childProcessSpawnStreamJsonAdapter = ({ prompt, cwd, … }) => { … };  // Claude CLI protocol

// left alone — not a pass-through: parses outside data into our object
export const gitLogNameOnlyAdapter = async ({ range }) =>
  gitLogContract.parse(parseGitLog(await runGit([...])));
```

Ins and outs:

- **How much
  goes.** 85 adapters are pure pass-throughs and 70 only forward to a workspace package (A4); those 155 go, with their 155 colocated test files, about 6,078 lines. 62 more make one call and
  parse the result, mostly into a standalone brand such as `fileContentsContract.parse(buffer)`. Once B6
  removes that brand they are pass-throughs too, unless they parse outside data into an object contract.
- **Pass-throughs now exist only next to handling.** They are bounded by the number of claimed
  functions, not by the number of packages times functions.
- **Protocol, payload and setup adapters are never pass-throughs,** so every adapter on the must-keep
  list passes untouched. A rule that refused every adapter without handling would refuse
  `child-process-spawn-stream-json`; A3 does not.
- **Testing does not need the
  wrapper.** Proxies already mock the real function (`registerMock({ fn: readFile })`), so a broker's proxy mocks `readFile` directly.
- **Migration.** An unclaimed npm function is now called directly, so swapping that library touches
  every caller. The compiler finds every one. Open decision 2 covers keeping pass-throughs as a swap
  point for npm packages.

How a machine checks it: syntax for "is this a pass-through", plus the A2 index for "is it claimed".

#### A4: an adapter must call something outside the repo

A call into a workspace package is a plain call.

```
// before — 70 adapters that only forward to another workspace package, each with its own proxy
// packages/server/src/adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.ts
export const orchestratorStartQuestAdapter = ({ questId }) => StartOrchestrator.startQuest({ questId });
// packages/mcp/src/adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.ts  (the same again)

// after — call it, and use the provider's proxy in tests
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
await StartOrchestrator.startQuest({ questId });
// test
const orchestrator = startOrchestratorProxy();      // from @dungeonmaster/orchestrator/testing
orchestrator.questNotFound({ questId });
```

Ins and outs: in a consumer repo, "workspace package" means that repo's own `packages/*`. No list is
needed.

How a machine checks it: syntax plus imports. An adapter whose only outside-looking import is a
workspace package is refused.

#### A5: all adapters for one outside function live in one package

```
// before — writeFile wrapped in 10 packages; 4 glob adapters in 3 packages, drifting apart
// server and tooling:
ignore: ['**/node_modulesdistbuild.git/**'],     // matches nothing; the braces are gone
// server only:
if (Array.isArray(result)) … else /* glob v7 fallback */   // glob 10.5.0 is installed; never runs
// mcp:
return files.map((file) => pathSegmentContract.parse(file));   // absolute paths labelled as one segment

// after — one package holds the adapters for glob; every other package imports them
// globFindAdapter sets the ignore list and absolute paths itself, so it is not a pass-through (A3)
import { globFindAdapter } from '@dungeonmaster/shared/adapters';   // this repo: shared is one of its workspace packages
```

```
// Illustration: shared holds the readFile adapters. (Today readFile is wrapped in 9 packages, and shared is not one.)

// flagged — a second package wrapping readFile
packages/ward/src/adapters/fs/read-file/fs-read-file-adapter.ts:   import { readFile } from 'fs/promises';

// left alone — several adapters, one package
packages/shared/src/adapters/fs/read-file/fs-read-file-adapter.ts:        import { readFile } from 'fs/promises';
packages/shared/src/adapters/fs/read-file-if-exists/...-adapter.ts:       import { readFile } from 'fs/promises';
```

Ins and outs:

- **Several adapters may import the same function,** as long as they sit in the same package.
- **Ward's reason for its own copies** ("ward depends on `@dungeonmaster/shared` and zod alone") does
  not block this, because shared is the package that would hold them.
- **"The repo" means the workspace packages under `packages/*`, never `node_modules`.** In this repo,
  `@dungeonmaster/shared` is a workspace package, so its adapters count. In a consumer repo,
  `@dungeonmaster/shared` sits in `node_modules`, so its adapters do not count. The consumer's one home
  is one of its own packages.
- **So dungeonmaster ships no adapters for a consumer's production code** (decision 4). If it did,
  A5 could not see a consumer's second adapter for the same function, and A2 could not see that the
  shipped adapter claims it. Dungeonmaster still ships proxies and stubs, which only tests load.

How a machine checks it: needs an index, across the repo's own workspace packages, of which package's
adapters import each outside function.

#### A6: library objects with methods do not leave an adapter

Library data types may leave an adapter (C2). A library object with methods may not. Examples are a
Playwright `Page`, a `ChildProcess` and a `Socket`, which this doc calls handles.

```
// the gap — Page leaves the adapter, and the broker makes outside calls with no import at all
// adapter
export const playwrightOpenAdapter = async ({ url }): Promise<Page> => { … return page; };
// broker: A1 and A2 see nothing, because nothing is imported
try { await page.goto(url); } catch { … }

// after — the adapter keeps the handle and returns our object
// adapter
export const playwrightSessionAdapter = async ({ url }) => {
  const page = …;
  return { goto: async ({ url }) => { … }, readText: async ({ selector }) => { … } };
};
```

Ins and outs:

- **Siegelense already works this way.** `browser-session-contract.ts:3-9` keeps `Page` and `Browser`
  inside `adapters/playwright/session/` on purpose.
- **Host library objects are not covered.** ESLint's `context` and React props reach our code as
  parameters. No adapter returned them, so A6 never applies.
- **The alternative** is to let handles leave, and have A1 use the type checker to catch handling around
  a method call whose type comes from a library. See open decision 3.

How a machine checks it: needs the type checker. It checks whether an adapter's exported return type,
or any field of it, is declared in a library and has callable members.

#### A7: a function returns what its calls told it, and `void` only when they told it nothing

This keeps the reason for today's ban on `void` returns: a caller must learn what happened. It changes
how that is checked. `void` is refused when the function threw away something a call told it, not
everywhere. The same test applies in every function-exporting folder, not only adapters.

```
// before — 116 of 118 adapterResultContract parses are this literal
export const fsRmIfExistsAdapter = async ({ filePath }: { filePath: string }): Promise<AdapterResult> => {
  try { await rm(filePath); } catch (error) { if (!isNotFoundError(error)) throw error; }
  return adapterResultContract.parse({ success: true });   // was the file there? the caller cannot tell
};

// after — return what the handling learned. One fact, so a plain boolean: no contract, no brand, no parse
export const fsRmIfExistsAdapter = async ({ filePath }: { filePath: string }): Promise<boolean> => {
  try { await rm(filePath); return true; }
  catch (error) { if (isNotFoundError(error)) return false; throw error; }
};
```

```
// flagged — mkdir reported the first directory it created, and the function threw that away
export const fsEnsureDirAdapter = async ({ dirPath }: { dirPath: string }): Promise<void> => {
  await mkdir(dirPath, { recursive: true });
};
// flagged — fsRmIfExistsAdapter said whether the file was there, and the broker threw that away
export const questCleanupBroker = async ({ filePath }: { filePath: string }): Promise<void> => {
  await fsRmIfExistsAdapter({ filePath });
};
// flagged — a return that can hold only one value says nothing, so it counts as void
): Promise<{ success: true }> => …

// left alone — mkdir's own answer, passed on. It sets `recursive` itself, so it is not a pass-through (A3).
export const fsEnsureDirAdapter = async ({ dirPath }: { dirPath: string }): Promise<string | undefined> =>
  mkdir(dirPath, { recursive: true });
// left alone — writeFile and rename both return Promise<void>, so there is nothing to report
// (two calls, so it is not a pass-through, and A3 does not apply)
export const fsWriteAtomicAdapter = async ({ filePath, contents }: { filePath: string; contents: string }): Promise<void> => {
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, contents, 'utf8');
  await rename(tempPath, filePath);
};
```

Ins and outs:

- **`{ success: true }` says nothing.** It can only ever be `true`, because a failure throws instead.
  A caller that gets it back knows only that nothing threw, which a resolved `Promise<void>` already
  says. It is the `ContentText` pattern for returns: the rule demanded a value, nothing checked that
  the value said anything, and models returned a constant.
- **Nothing is invented.** A function whose calls told it nothing returns `void`. It does not make up
  a value to satisfy the rule.
- **Which calls count:** calls to an outside function, an adapter or a broker whose result the
  function discards. Built-in methods such as `array.push` or `map.set` do not count.
- **Tests change with it.** 87 adapter tests assert the literal `{ success: true }` today. Each asserts
  what the adapter now returns, such as `resolves.toBeUndefined()` for a `mkdir` that created nothing.
- **A7 sets a floor, not a ceiling.** A broker may return more than its calls told it, such as the
  updated quest.

Why: the old rule had the right goal and no way to check it, so models met it with a constant. A7
checks the goal itself: nothing a call reported is hidden.

How a machine checks it: needs the type checker. For a function returning `void`, find each discarded
call to an outside function, an adapter or a broker, and require its return type to be `void`. A
return type counts as `void` when no part of it can vary, such as `true` or `{ success: true }`.

### Tests and mocking

Tests mock with `registerMock({ fn })` in a `.proxy.ts` file. That is Jest's module mocking underneath:
the proxy-mock hoister reads each proxy's `registerMock` calls, resolves each `fn` against that proxy's
own imports, and writes a `jest.mock(module)` for the test file. It does not care what folder the proxy
lives in (`typescript-ast-to-mock-calls-adapter.ts:135`, `proxy-mock-collector-middleware.ts:35-74`).
The rules below say what a test mocks, where, and with what.

Words used in this section:

- **Test support file**: a `.test`, `.integration.test`, `.e2e`, `.proxy`, `.stub` or `.harness` file,
  or any file under a package's `test/` directory. The I/O trap already classifies callers this way
  (`TEST_INFRASTRUCTURE_FRAME` in `packages/testing/src/jest.setup-io-trap.js:31-32`).
- **Recorded failure**: an error captured once from the real library inside a testbed, with the fields
  it really carries, such as Node's `code`, `errno`, `syscall` and `path`.

#### T1: a proxy mocks an outside function where it is called

The proxy of the file that calls the function mocks it. If an adapter calls `readFile`, the adapter's
proxy mocks `readFile`. If a broker calls `rename` directly, because A3 removed the pass-through
adapter, the broker's proxy mocks `rename`.

```
// before — the broker called a pass-through adapter, so the broker's proxy composed the adapter's proxy
// brokers/quest/archive/quest-archive-broker.proxy.ts
const rename = fsRenameAdapterProxy();
rename.succeeds({ from, to });

// after — A3 removed the adapter; the broker calls rename, so the broker's proxy mocks rename
import { rename } from 'fs/promises';
const handle = registerMock({ fn: rename });
handle.calledWith([from, to]).resolves(undefined);
```

```
// left alone
adapters/fs/read-file-if-exists/…-adapter.proxy.ts:   registerMock({ fn: readFile })   // the adapter calls it
brokers/quest/archive/…-broker.proxy.ts:              registerMock({ fn: rename })     // the broker calls it
```

Ins and outs:

- **The hoister already supports this.** 29 broker proxies and 5 responder proxies mock a raw outside
  function today, for example `git-detect-base-branch-broker.proxy.ts:62` mocks `spawn` directly.
- **Functions a proxy does not name stay trapped.** The hoister writes each module mock as
  `globalThis.__ioTrap?.(m) ?? jest.requireActual(m)` plus the named mocks
  (`typescript-mock-calls-to-statements-adapter.ts:91-94`). So moving a `registerMock` from a deleted
  adapter's proxy into a broker's proxy cannot leave the module's other functions doing real I/O.
- **`enforce-proxy-child-creation` needs no change.** It only tracks relative imports
  (`parse-implementation-imports-transformer.ts:73`), so it never asked for mocks of `fs` or `path`.
  When A3 deletes an adapter, a leftover `xAdapterProxy()` call in a broker proxy is reported as a
  child the implementation no longer imports, which forces the cleanup.
- **A library that cannot load under Jest at all,** because it needs a canvas, a GPU or ESM, is replaced
  through Jest's `moduleNameMapper`, as web already does for `elkjs`. A proxy then mocks its functions
  as usual.
- **A host library is not mocked.** ESLint runs through `RuleTester`, React through testing-library, and
  AST nodes come from the real parser (C5).

#### T2: a unit test stages every call the I/O trap catches, and lets everything else run

The I/O trap (see "The unit-test I/O trap") fails a unit test that reaches `fs`, `fs/promises` or
`child_process` without a staged answer (`jest.setup-io-trap.js:25`). Those calls, and any npm function
that does I/O underneath, such as `glob`, are mocked. Everything else runs for real.

```
// flagged by the trap at run time — nothing staged the read
const config = await configLoadBroker({ path });   // [io-trap] unstaged fs/promises.readFile("/…/config.json")

// left alone — pure functions run for real, in the implementation and in the proxy
brokers/x/x-broker.ts:          const configPath = join(root, 'config.json');
brokers/x/x-broker.proxy.ts:    const expected = join(root, 'config.json');   // computed, not mocked
```

Ins and outs:

- **The rule is structural.** Mock what the trap traps, and what does I/O underneath; run the rest.
- **A test may mock a function to pin its value,** such as `randomUUID` or `Date.now`. That is allowed,
  not required.
- **Classes are never
  trapped.** The trap wraps only lowercase function exports (`jest.setup-io-trap.js:85`), so `new ChildProcess()` in a stub is real and does no I/O.

#### T3: an adapter's proxy offers named scenarios with recorded failures, and a broker's proxy uses them

An adapter's proxy stages the outside function with recorded failures and names each scenario. A
broker's proxy composes that adapter proxy and calls its scenarios, so the adapter's handling runs for
real in the broker's test. Node's I/O gets one shared proxy per module in `@dungeonmaster/testing`,
whose failures are captured once from real Node. A workspace package ships the proxy for its own API
from its `/testing` entry point, and its own tests check each scenario against its real code.

```
// before — each test invents the failure; the raw call is staged under a composed but unused adapter proxy
// siegelense/src/brokers/instance/kill/instance-kill-broker.proxy.ts:87,191-193
fsReadFileAdapterProxy();
readHandle.calledWith([heartbeatPath])
  .rejects(Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }));

// after — a named scenario, recorded from real Node
const fs = fsReadFileIfExistsAdapterProxy();
fs.fileMissing({ filePath: heartbeatPath });

// after — a workspace package's own proxy, with its real failure shape
const orchestrator = startOrchestratorProxy();      // from @dungeonmaster/orchestrator/testing
orchestrator.questNotFound({ questId });             // { success: false, error }, as the real getQuest returns
```

Ins and outs:

- **Scenario names are not shared today.** 347 adapter proxies define 359 distinct method names, so
  each test learns a new vocabulary. Shared proxies with named scenarios give one.
- **The hoister follows imports of every `@dungeonmaster/*/testing` entry point** and of the shared
  proxies, so their `registerMock` calls are hoisted like any `.proxy.ts` file's.
- **Failure cases move with the handling.** When A1 moves handling from a broker into an adapter, the
  broker's tests of each failure move to the adapter's tests, and the broker's tests call the adapter
  proxy's scenarios.
- **A proxy that builds a fake library handle does it in one place.** 12 broker and responder proxies
  build their own fake `ChildProcess`, `Socket` or `FSWatcher` to mock a raw `spawn`
  (`tmp/adaptermove-proxies-fake-handles.txt`). Under A6 the handle stays inside the adapter, so only
  the adapter's proxy builds it, from a stub (C5).

#### T4: no match-everything default in a proxy constructor

For a function whose declared signature takes arguments.

```
// flagged — every unexpected read now "succeeds" with ''
export const fsReadFileProxy = () => {
  const mock = registerMock({ fn: readFileSync });
  mock.calledWith([]).returns('');
  return { … };
};

// left alone
registerMock({ fn: randomUUID }).calledWith([]).returns(uuid);                  // no arguments: [] is the only address
mock.calledWith([filePath]).returns(content);                                    // addressed
return { existsOnlyFor: ({ filePaths }) => mock.calledWith([isPath]).implement(…) };  // opt-in scenario
```

Why: a constructor default answers calls no test described, so an unexpected call becomes an invented
success, and the I/O trap cannot see it, because the call counts as staged. 90 adapter proxies stage a
`calledWith([])` answer; 22 of those are honest, because the function takes no arguments. At least 44
put a canned answer in the constructor for a function that takes arguments.

How a machine checks it: `ban-proxy-catch-all-defaults`. Syntax, and the type checker for the mocked
function's signature.

#### T5: no invented failures in a proxy or test

```
// flagged — as the value given to a mock's rejects / throws / a throwing implement
proxy.throws({ filePath, error: new Error('ENOENT') });
handle.calledWith([p]).throws(Object.assign(new Error('x'), { code: 'ENOENT' }));   // still hand-made

// left alone
fs.fileMissing({ path });                                   // recorded failure
orchestrator.questNotFound({ questId });                    // provider-owned scenario
expect(() => run()).toThrow(/^Quest not found$/u);          // asserting what the code under test throws
```

Why: a hand-made failure has the shape the author imagined. Code tested against it learns to catch
everything; code tested against a recorded failure is tested against what Node sends. 179 of the
adapter proxies take a generic `error`, so each test invents its failure. "File not found" is built
without Node's `code` 193 times, and with it 70 times. Of the 92 implementations tested with a code-less
error, 64 catch errors themselves, and 58 of those catch everything, the only shape that passes such a
test.

How a machine checks it: `ban-invented-failures`. Syntax.

#### T6: no mocking another workspace package's exports

```
// flagged, in server or mcp
registerMock({ fn: StartOrchestrator.getQuest });
registerModuleMock({ module: '@dungeonmaster/orchestrator', factory: () => ({ … }) });

// left alone
const orchestrator = startOrchestratorProxy();   // from @dungeonmaster/orchestrator/testing
registerMock({ fn: readFile });                  // a Node function
```

Why: a consumer's copy of another package's behaviour drifts from it. The real `getQuest` reports a
missing quest as `{ success: false }` (`quest-get-broker.ts:77-80`), but consumer tests stage a thrown
error 40 times and `success: false` 4 times, so `quest-pause-responder.ts:40`, the "Quest not found"
branch the real system takes, has no test.

How a machine checks it: `ban-workspace-export-mocks`. The import specifier starts with
`@dungeonmaster/`, is not a `/testing` subpath, and is not the file's own package.

#### T7: test support files are outside the adapter rules

A1 to A7 govern production code. A test support file may import a claimed function, handle failures
and do real I/O. The I/O trap governs what a unit test may reach, and T1 to T6 govern how it mocks.

```
// left alone — in test support files
brokers/x/x-broker.proxy.ts:        registerMock({ fn: spawn })                       // imports a claimed function
brokers/x/x-broker.proxy.ts:        const bytes = PNG.sync.write(png)                 // calls a library to build a fixture
mcp/test/harnesses/mcp-server/mcp-server.harness.ts:   for (…) { try { … } catch { … } }   // a harness retrying a boot probe
stubs/child-process/child-process.stub.ts:   new ChildProcess()                     // a stub building a real value (C5)

// flagged — production code is still covered
brokers/x/x-broker.ts:              import { readFile } from 'fs/promises'           // readFile is claimed (A2)
```

Ins and outs:

- **The exemption keys on the file, not on how the import is used.** "Imported to mock it" and
  "imported to call it" can be told apart by syntax, but test code does both legitimately: a proxy
  mocks `spawn` and also calls `join` or `PNG.sync.write` to build an expected value.
- **Most test code never meets A1 anyway.** In a test, the call inside a `catch` or `.catch` is almost
  always the code under test, a relative import, not an outside function. Only 2 of 4,070 test files
  handle a raw outside call. A2 is where tests needed this rule: as written it would refuse the 34
  broker and responder proxies that mock a raw function today, and 6 test files that import `fs` or
  `child_process` functions.
- **Harnesses are named here because no folder type covers them.** `mcp-server.harness.ts` imports
  `spawn` directly and wraps it in a retry loop and a timeout race (lines 134-189). That is test
  infrastructure, like a stub.
- **Test infrastructure inside a production folder type is still production code.** The testing
  package's `install-testbed-create-broker.ts:190-229` catches `childProcessExecSyncAdapter`'s throw and
  reads its `stdout`, `stderr` and `status`. That is handling around an adapter's call, so under A1 the
  exec adapter returns the exit code and output instead of throwing (A7), and the broker reads them.

How a machine checks it: every adapter rule skips test support files, classified by the same pattern
the I/O trap uses.

#### What dungeonmaster ships for tests, and how models find it

Dungeonmaster ships proxies and stubs, never adapters (decision 4). In a consumer repo they live in
`node_modules/@dungeonmaster/*`, which the search tools a model uses do not index. They reach a model
the way `registerMock` already does:

| Channel                | When the model sees it                                          | What it carries                                                       |
|------------------------|-----------------------------------------------------------------|-----------------------------------------------------------------------|
| The lint error (T5)    | when it writes a hand-made failure                              | the exact proxy scenario to use instead                               |
| `get-testing-patterns` | at session start                                                | a catalog of every shipped proxy and stub: name, purpose, import path |
| A session snippet      | every session start, in every repo `dungeonmaster init` touched | a pointer to the catalog                                              |

The catalog is generated from the `@dungeonmaster/testing` entry points and each file's PURPOSE header,
and the lint messages read the same list, so neither can drift from the code.

### Folders

#### D1: JSX appears only in `widgets/` and `flows/`

There are no per-folder npm allowlists. One structural rule replaces them.

```text
// before — widgets may not import @xyflow/react, so React components live in adapters
web/src/adapters/xyflow/react-flow/xyflow-react-flow-adapter.ts   a React component, filed as an adapter
web/src/adapters/testing-library/…                                4 test helpers with no production user
web/src/adapters/mantine/render/mantine-render-adapter.ts

// after
web/src/widgets/react-flow/react-flow-widget.tsx                  the xyflow component is a widget
@dungeonmaster/testing                                            the testing-library helpers
```

Why: folder allowlists push code into the wrong home. In web, 26 of 38 adapter proxies are empty,
because the "adapters" there are components and test helpers, not outside calls.

How a machine checks it: syntax. A `JSXElement` or `JSXFragment` in a file outside `widgets/` and
`flows/` is refused. The rules about which of our folders may import which stay as they are.

## The unit-test I/O trap (built, not committed)

A setup file in `@dungeonmaster/testing`, loaded by every package's Jest config, traps `fs`,
`fs/promises` and `child_process` in every unit test. A call nothing staged fails the test and names
itself, even when the code under test catches the error, because every trapped call is recorded and
checked after the test.

```
// before — an unstaged read hits the real disk; a catch-everything broker turns it into a pass
it('VALID: {…} => returns defaults', async () => {
  const result = await guildConfigReadBroker({ guildPath });   // reads the real disk, unnoticed
  expect(result).toStrictEqual(defaults);
});
```

```text
after — the same test fails:
Test did real I/O that nothing staged. Stage it through a proxy, or move the test to an integration test:
  [io-trap] unstaged fs/promises.readFile("/home/…/guild.json")
```

How the trap decides, in order. Each rule is structural; none is a list:

| A call passes through when                                                                                       | Why                                                    |
|------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| the test file is an `.integration.test` or `.e2e` file                                                           | those do real I/O by design                            |
| its path is inside `node_modules`                                                                                | a package loading its own files                        |
| it reads a fixture under a package's own `test/` directory                                                       | fixtures are test infrastructure                       |
| it is a read made by the TypeScript compiler itself                                                              | a type-level test compiles real source                 |
| the first repo file on the call stack is a `.test`, `.proxy`, `.stub` or `.harness` file, or lives under `test/` | test code recording a proxy's data from the real thing |

Everything else from implementation code is trapped. The trap is built from plain functions, not
`jest.fn`, so the per-test mock reset cannot disable it. It reads the call stack as structured call
sites, not as a string, which keeps a real TypeScript compile at 502 ms against 285 ms untrapped.

The proxy-mock hoister keeps every function a proxy did not name trapped, instead of real:

```
// before — mocking readFile left stat, writeFile, mkdir … doing real I/O
jest.mock('fs/promises', () => ({ ...jest.requireActual('fs/promises'), readFile: jest.fn() }));

// after — trapped in unit tests, real in integration tests
jest.mock('fs/promises', () => ({
  ...(globalThis.__ioTrap?.('fs/promises') ?? jest.requireActual('fs/promises')),
  readFile: jest.fn(),
}));
```

A package must do no I/O when imported. The orchestrator's six passive watchers start from
`StartOrchestrator.bootstrap()`, which each host process calls at boot:

```
// before — at module scope in start-orchestrator.ts: importing the barrel started six pollers and watchers
ExecutionQueueFlow.bootstrap();  RateLimitsFlow.bootstrap();  // …four more

// after
export const StartOrchestrator = { bootstrap: () => { /* the same six */ }, … };
// server: OrchestrationBootFlow → StartOrchestrator.bootstrap(), then the server-only normalizeDispatchBoot()
// mcp:    StartMcpServer → OrchestrationBootFlow → StartOrchestrator.bootstrap()
```

### Status

As of 2026-09-24 these changes are **staged in git and not committed**. A full `npm run ward` passed
with them (run `1790294805205-6478`: lint, typecheck, unit 3,757 files, integration 182, e2e 133).

| File                                                                                                                                                                                                                                                                  | Change                                                                                                                                                                                                                                         |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `packages/testing/src/jest.setup-io-trap.js`                                                                                                                                                                                                                          | **New.** The trap: plain-function wrappers over the three modules, the pass-through rules above, a recorder that fails the test in `afterEach`, and `globalThis.__ioTrap(name)` for the hoister. Off for `.integration.test` and `.e2e` files. |
| `packages/testing/src/jest.setup.js`                                                                                                                                                                                                                                  | One added line, first: `require('./jest.setup-io-trap');`. Every package's Jest config loads this file.                                                                                                                                        |
| `packages/testing/src/adapters/typescript/mock-calls-to-statements/typescript-mock-calls-to-statements-adapter.ts` and its test                                                                                                                                       | The hoister's generated mock spreads `globalThis.__ioTrap?.(m) ?? jest.requireActual(m)` instead of `jest.requireActual(m)`; two expected strings updated.                                                                                     |
| `packages/orchestrator/src/startup/start-orchestrator.ts`                                                                                                                                                                                                             | Module-scope bootstrap calls removed; new `StartOrchestrator.bootstrap()` runs all six.                                                                                                                                                        |
| `packages/orchestrator/src/startup/start-orchestrator.integration.test.ts`                                                                                                                                                                                            | New test: `bootstrap()` twice returns `{ success: true }` both times.                                                                                                                                                                          |
| `packages/orchestrator/src/index.proxy.ts`, `index.test.ts`                                                                                                                                                                                                           | The proxy is now empty; the import-order warning is removed.                                                                                                                                                                                   |
| `packages/server/src/adapters/orchestrator/bootstrap/*`, `packages/server/src/responders/orchestration/bootstrap/*`                                                                                                                                                   | **New.** The adapter wraps `StartOrchestrator.bootstrap()`; the responder calls it.                                                                                                                                                            |
| `packages/server/src/flows/orchestration-boot/orchestration-boot-flow.ts` and its integration test                                                                                                                                                                    | Calls the bootstrap responder, then the server-only normalization. The test uses `serverAppHarness().setupTestHome()`.                                                                                                                         |
| `packages/server/src/startup/start-server.ts`                                                                                                                                                                                                                         | Comment only.                                                                                                                                                                                                                                  |
| `packages/mcp/src/adapters/orchestrator/bootstrap/*`, `packages/mcp/src/responders/orchestration/bootstrap/*`, `packages/mcp/src/flows/orchestration-boot/*`                                                                                                          | **New.** The same as server's; starts the watchers in the MCP child, with no normalization.                                                                                                                                                    |
| `packages/mcp/src/startup/start-mcp-server.ts`                                                                                                                                                                                                                        | Calls `OrchestrationBootFlow.bootstrap()` before `McpServerFlow`.                                                                                                                                                                              |
| `orchestrator/CLAUDE.md`, `timer-set-interval-adapter.ts`, `graph-reachability-check-broker.ts`, `process-stale-watch-flow.ts`, five bootstrap responders, `local-eslint/…/rule-graph-reachability-broker.ts`, `server/…/reconcile-watchers-layer-responder.proxy.ts` | Comments that described import-time bootstraps, reworded to the present behaviour.                                                                                                                                                             |
| `packages/testing/src/adapters/fs/exists-sync/*`, `middleware/import-path-resolver/*`, `adapters/typescript/source-file-getter/*`, `middleware/proxy-mock-collector/*`                                                                                                | Testing-package tests that did real I/O, now staged through their proxies. `jsx-extension-test-stub.jsx` is deleted.                                                                                                                           |

Outside git: `packages/orchestrator/dist/` was rebuilt so server and mcp typecheck the new `bootstrap()`.

To undo all of it: `git restore --staged --worktree` the modified files, delete the new files and
directories listed above, restore `jsx-extension-test-stub.jsx` with `git restore`, then rebuild
orchestrator so its `dist` matches the source again.

What the trap found when it first ran, 149 unit tests in 7 packages, and what cleared them:

| Found                             | Cause                                                                                                        | Resolution                                                   |
|-----------------------------------|--------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| mcp 23, server 77, orchestrator 1 | importing orchestrator started six watchers that did real I/O                                                | `StartOrchestrator.bootstrap()`, called by each host at boot |
| orchestrator 2                    | test code recording data from the real workspace                                                             | the test-infrastructure caller rule                          |
| cli 2, web 1, hydration 30        | TypeScript stat-ing `node_modules`; Playwright reading `/etc/os-release`; type-level compiles of real source | the `node_modules`, fixture and compiler rules               |
| testing 13                        | the testing package's own tests reading real files                                                           | staged through their proxies                                 |

Gotchas the next session will meet:

- server and mcp typecheck the main `@dungeonmaster/orchestrator` barrel from its compiled
  `dist/src/index.d.ts`, so a new `StartOrchestrator` method needs
  `npm run build --workspace=@dungeonmaster/orchestrator` before their typecheck sees it.
- A server integration test cannot import the main `@dungeonmaster/testing` barrel: MSW is ESM and
  server's Jest does not transform it. Use `serverAppHarness().setupTestHome()` for a temp home.
- A test that changes `DUNGEONMASTER_HOME` must restore it, never delete it: the watchers keep ticking,
  and a deleted variable sends them to the developer's real `~/.dungeonmaster`.
- The adapters `get-folder-detail` doc teaches `new Error('ENOENT: …')` with no `code`, the likely
  origin of the code-less failures. It changes with T5.

## Today's rules and docs that change

| Where                                                       | Today                                                                                                                                                                                                                                                       | After                                                                                                                                                                                                                                                                                                        |
|-------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `require-zod-on-primitives`                                 | Every `z.string()` / `z.number()` needs `.brand()`, and the model picks the text                                                                                                                                                                            | Replaced by `require-object-contract-brands` (B1): every object, nested object and leaf in a contract is branded, the text is derived (B3), and loose values take no brand (B1, B6)                                                                                                                          |
| `zod` dependency                                            | 3.25, used through the v3 API                                                                                                                                                                                                                               | v4, so a branded object keeps `.shape` (B1)                                                                                                                                                                                                                                                                  |
| `ban-primitives`                                            | Plain `string` / `number` refused in return types                                                                                                                                                                                                           | Removed: it has nothing left to refuse (B6). See "Lint rules and teaching text".                                                                                                                                                                                                                             |
| `contracts-constraints.md:22`                               | "All contracts MUST use `.brand<'TypeName'>()` on primitives"                                                                                                                                                                                               | Every leaf of an object contract is branded, inline, with the owner-plus-key text (B1, B2, B3)                                                                                                                                                                                                               |
| `adapters-constraints.md:92-94`                             | "ALL inputs MUST use contracts (no raw string, number)" and "ALL outputs MUST use contracts (no returning npm package types)"                                                                                                                               | Loose inputs are plain (B6). Library data types may leave; handles may not (A6).                                                                                                                                                                                                                             |
| `transformers-constraints.md:34-46`                         | "All transformers MUST validate output using contracts", with `return dateStringContract.parse(formatted);` as the right way and returning `formatted` as "WRONG ... not branded". Lines 137-152 teach `return contentTextContract.parse(config.purpose);`. | A transformer that returns one of our objects builds it through the object's contract parse (B1). A loose string or number is returned plain (B6). Both examples become the "before".                                                                                                                        |
| `responders-constraints.md:150`                             | "ALL inputs from external sources MUST use `unknown` type and validate through contracts"                                                                                                                                                                   | Unchanged. C4 makes the JSON half of it checkable.                                                                                                                                                                                                                                                           |
| `enforce-folder-return-types`                               | Bans `void` and `Promise<void>` returns in function-exporting folders; its message points at `AdapterResult`                                                                                                                                                | Changed by A7. `void` is allowed exactly when every call the function discards returned `void`. A return that can hold only one value counts as `void`. `AdapterResult` goes.                                                                                                                                |
| `@typescript-eslint/no-magic-numbers`                       | On outside tests, stubs and e2e specs. Ignores `-1`, `0`, `1`, default values and enums; `detectObjects: false` skips numbers written as object property values. ESLint's own `no-magic-numbers` is off.                                                    | Unchanged. `detectObjects: false` lets a literal sit in the object handed to a root parse (B1). A loose number passed to a call still needs a name in `statics/`; B6 only drops the brand parse around it.                                                                                                   |
| No magic-strings rule                                       | String literals are not linted. Today many are wrapped in a brand parse, such as `pathSegmentContract.parse('package.json')`.                                                                                                                               | Unchanged. Under B6 those become plain literals, and no rule moves them to statics.                                                                                                                                                                                                                          |
| `enforce-magic-arrays`                                      | Refuses an inline array whose elements are all string or number literals, outside statics, tests, stubs and proxies                                                                                                                                         | Unchanged. Wrapping each element in a brand parse hides an array from it today; one case exists (`tsconfig-discover-patterns-transformer.ts:17`, `[globPatternContract.parse('node_modules'), globPatternContract.parse('dist')]`). B6 removes the wrapping, so the rule catches it and moves it to statics. |
| `enforce-regex-usage`                                       | Regex literals only in `contracts/`, `guards/` and `transformers/`                                                                                                                                                                                          | `statics/` allows regex too (`allowRegex: true` in `folder-config-statics.ts`), so a shared pattern can live there (B2)                                                                                                                                                                                      |
| `folder-config-statics.ts` `allowsLayerFiles`               | `true` only for `flows`, `adapters`, `brokers`, `responders` and `widgets`                                                                                                                                                                                  | Also `true` for `contracts`, `stubs`, `transformers`, `statics` and `bindings` (C7). `get-architecture` lists the allowed folders from this flag, so its text follows.                                                                                                                                       |
| `folder-config-statics.ts`                                  | `contracts/` accepts `.stub.ts` files beside its contracts                                                                                                                                                                                                  | A new `stubs/` folder type holds every stub (C6). `contracts/` drops `.stub.ts` from its `fileSuffix`; `requireStub` pairs a contract with `stubs/<domain>/` by name.                                                                                                                                        |
| Package barrels (`contracts.ts`) and `package.json` exports | `contracts.ts` exports stubs beside contracts: 232 in shared                                                                                                                                                                                                | Stubs go to a `stubs.ts` barrel and a `./stubs` export that only test, proxy, harness and stub files may import (C6)                                                                                                                                                                                         |
| `session-snippet-statics.ts` folder types table             | No `stubs/` row                                                                                                                                                                                                                                             | Gains a `stubs/` row, so every session and every consumer repo learns the folder type (C6)                                                                                                                                                                                                                   |
| `enforce-implementation-colocation`                         | Every implementation file needs a colocated test, statics included. All 324 statics files have one, and 178 of those tests are a single `toStrictEqual` that restates the whole object.                                                                     | A statics file needs a test only when it holds a regex                                                                                                                                                                                                                                                       |
| `folder-config-statics.ts` `allowedImports`                 | Only `adapters/` may import `node_modules`; `contracts/` gets only zod                                                                                                                                                                                      | `import type` from a package is allowed in every folder (C2). Value imports follow A2. `stubs/` may import packages to build real values (C6).                                                                                                                                                               |
| `forbid-type-reexport`                                      | Refuses re-exporting an imported type through an export specifier, outside `index.ts`                                                                                                                                                                       | Unchanged. It sits beside C2's refusal of aliases that give a library type a second name.                                                                                                                                                                                                                    |
| `ban-adhoc-types`                                           | "Define types in contracts/ and import them"; refuses `interface` and `as { … }` only; `adapters/`, `contracts/` and `widgets/` exempt                                                                                                                      | Extended by B9 to `type` aliases and return types built from an object literal that can leave a function; `adapters/` is covered; the message says "our types" (C2)                                                                                                                                          |
| `architecture-overview-broker.ts:274`                       | Prose: "take it as `User['id']`"                                                                                                                                                                                                                            | Enforced by B4                                                                                                                                                                                                                                                                                               |
| `ban-flattened-contract-params`                             | Allows one indexed property per block                                                                                                                                                                                                                       | Unchanged. It still stops a block taking several fields off one owner.                                                                                                                                                                                                                                       |
| `eslint-plugin/src/brokers/rule/CLAUDE.md`                  | "Use the shared Tsestree contract"                                                                                                                                                                                                                          | Use `TSESTree` from `@typescript-eslint/utils`, and the node stubs in `stubs/tsestree/` (C2, C5, C6)                                                                                                                                                                                                         |

## Lint rules and teaching text: the work

Every existing lint rule was checked against this doc on 2026-09-24: 63 in `eslint-plugin`, 8 in
`local-eslint`, and the typescript-eslint settings. The teaching text that models read was checked
too. The audits are in `tmp/lint-audit-1.tsv`, `lint-audit-2.tsv`, `lint-audit-3.tsv`,
`lint-audit-new-rules.tsv` and `teaching-text-audit.tsv`.

### Existing rules that change

57 of the 71 rules keep their behaviour. These 14 change:

| Rule                                            | Today                                                                                                                                                                                                           | Change                                                                                                                                                                                                                                                                                                                                                                   | Doc rule   |
|-------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------|
| `ban-primitives`                                | Refuses a plain `string` or `number` return (this repo sets `allowPrimitiveReturns: false`). Its message says "If none fits, create a new contract".                                                            | **Remove.** Plain returns are allowed (B6), and plain inputs already were, so it has nothing left to refuse. B4 refuses the parameters that matter, such as `questId: string`. Its message is what mints `ContentText`.                                                                                                                                                  | B6, B4     |
| `require-zod-on-primitives`                     | Every `z.string()` and `z.number()` anywhere needs `.brand()`. Its test asserts that a loose `const schema = z.string()` is invalid (`rule-require-zod-on-primitives-broker.test.ts:47`).                       | **Replaced by `require-object-contract-brands`.** Keeps the brand-in-chain check and the enum skip. Drops the loose `z.string()` case. Adds the object brand, the derived text, the `contracts/` scope and the autofix.                                                                                                                                                  | B1, B2, B3 |
| `ban-adhoc-types`                               | Refuses `interface` and `as { … }` casts. Skips `contracts/`, `adapters/` and `widgets/`. Misses `type X = { … }` aliases and inline object return types. Message: "Define types in contracts/ and import them" | Extended by B9: also refuses an object type literal in a module-level function's return type, a module-level alias, variable type or type argument, unless every member is a function. Skips `.proxy.ts` files. `adapters/` gets `disallowAdhocTypes: true`. Message: "Define our types in contracts/ and import them. A library's types are imported from the library." | B9, C2     |
| `enforce-import-dependencies`                   | Treats `import type` like a value import. Its stub allowance keys on the `contracts` folder type (`rule-enforce-import-dependencies-broker.ts:161`, `validate-external-import-layer-broker.ts:93`).             | Let every `import type` from a package through. Key the stub allowance on `stubs`, for test, proxy, harness and stub files. Refuse `stubs/` and `/stubs` imports from everything else.                                                                                                                                                                                   | C2, C6     |
| `enforce-implementation-colocation`             | Pairs a contract with the stub in its own folder. Requires a test for every statics file.                                                                                                                       | Pair `contracts/<domain>/` with `stubs/<domain>/` by name. Require a statics test only when the file holds a regex, which means reading the file's content.                                                                                                                                                                                                              | C6, B2     |
| `enforce-project-structure`                     | Reads the folder config                                                                                                                                                                                         | No code change. The `stubs/` folder type is added to the config.                                                                                                                                                                                                                                                                                                         | C6         |
| `enforce-stub-patterns`                         | Every stub takes `{ ...props }: StubArgument<T> = {}` and calls `contract.parse()` (`rule-enforce-stub-patterns-broker.ts:93-98`)                                                                               | **Conflicts today.** Accept a second shape in `stubs/`: a stub that builds a library value and declares the library's type as its return type.                                                                                                                                                                                                                           | C5         |
| `enforce-contract-usage-in-tests`               | Suggests the stub path `./<name>.stub` beside the contract (line 158, and `contract-path-to-stub-path-transformer.ts:18`). Its message points at `@dungeonmaster/shared/contracts`.                             | Suggest `stubs/<domain>/<domain>.stub`, and point at the `/stubs` entry point.                                                                                                                                                                                                                                                                                           | C6         |
| `enforce-stub-usage`                            | Checks `.test.ts` files only (line 38)                                                                                                                                                                          | Also check `.proxy.ts` and `.stub.ts` files. Add C5's check: no object literal cast to a type imported from a package.                                                                                                                                                                                                                                                   | C5         |
| `enforce-folder-return-types`                   | Always refuses `void`; its message recommends `AdapterResult` (line 28)                                                                                                                                         | **Rewrite.** Allow `void` exactly when every discarded call returned `void`; a single-value return counts as `void`. Needs the type checker.                                                                                                                                                                                                                             | A7         |
| `enforce-regex-usage`                           | Reads `allowRegex` from the folder config                                                                                                                                                                       | No code change. `statics/` gets `allowRegex: true`.                                                                                                                                                                                                                                                                                                                      | B2         |
| `require-validation-on-untyped-property-access` | Catches `JSON.parse(...).field` read before a parse. Exempts every `-adapter.ts` file (line 46).                                                                                                                | Becomes C4: also `response.json()`, casts, storing the value, and returning it. Drop the adapter exemption: C4's own "before" example, `return JSON.parse(text) as TResponse`, sits in an adapter.                                                                                                                                                                       | C4         |
| `ban-bare-os-home-tmp` (local-eslint)           | Allows `homedir()` and `tmpdir()` only in `adapters/os/`                                                                                                                                                        | Absorbed by A2, which generalises it. A2 keeps its message naming the adapter to use, and its exemptions for harnesses and `playwright.config.ts`.                                                                                                                                                                                                                       | A2         |
| `no-bare-process-cwd`                           | Imports the `GlobPattern` and `PathSegment` brands                                                                                                                                                              | Those are standalone brands (B2), so the values become plain `string`.                                                                                                                                                                                                                                                                                                   | B2, B6     |

**Every rule in both packages also changes mechanically.** Each one imports the copied `Tsestree` and
`EslintContext` types, directly in `eslint-plugin` and through its exports in `local-eslint`. C2 deletes
those copies. Each rule then imports `TSESTree` and `TSESLint` from `@typescript-eslint/utils`, which
becomes a dependency of `eslint-plugin`. Each spot where the loose copy let code skip a check that the
real type requires needs fixing, such as reading `node.callee` before narrowing on `node.type`.

### New rules

| Doc rule   | Rule                                                                                                                                                                                   | Built by                                                                                                                                                                                                                                 | The check needs                                                                 |
|------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| B1, B2, B3 | `require-object-contract-brands`                                                                                                                                                       | Replacing `require-zod-on-primitives`                                                                                                                                                                                                    | Syntax                                                                          |
| B4         | `enforce-owner-field-reuse`: contract keys in `contracts/`, and parameters in every folder                                                                                             | New, sharing its index with `require-object-contract-brands`                                                                                                                                                                             | A repo-wide index of object contracts and their keys                            |
| B5, C2     | `ban-type-aliases`: an exported alias of a field (`Quest['id']`), or an alias that gives a library type a second name                                                                  | New                                                                                                                                                                                                                                      | Syntax                                                                          |
| B9         | An object type that can leave a function is a contract                                                                                                                                 | Extending `ban-adhoc-types`                                                                                                                                                                                                              | Syntax                                                                          |
| B7         | `require-real-owner`                                                                                                                                                                   | New, sharing C1's index                                                                                                                                                                                                                  | A repo-wide index                                                               |
| B8         | `ban-id-rebrand`                                                                                                                                                                       | New                                                                                                                                                                                                                                      | The type checker                                                                |
| C1         | `require-contract-parse`                                                                                                                                                               | New                                                                                                                                                                                                                                      | A repo-wide index read from the syntax tree                                     |
| C3         | `ban-contract-type-predicates`                                                                                                                                                         | New                                                                                                                                                                                                                                      | The type checker                                                                |
| C4         | Parsed JSON goes straight into a contract                                                                                                                                              | Extending `require-validation-on-untyped-property-access`                                                                                                                                                                                | Syntax                                                                          |
| C5         | Library stubs built by the library, with no cast                                                                                                                                       | Extending `enforce-stub-usage` and `enforce-stub-patterns`                                                                                                                                                                               | Syntax and type imports                                                         |
| C6         | `stubs/` folder type                                                                                                                                                                   | Extending `enforce-project-structure`, `enforce-import-dependencies` and `enforce-implementation-colocation`                                                                                                                             | Syntax                                                                          |
| C8         | `enforce-unique-contract-names`: a contract name is defined in one workspace package only                                                                                              | New, sharing the index B4 and A5 use                                                                                                                                                                                                     | A repo-wide index of exported contract names                                    |
| C7         | Layer files in five more folder types                                                                                                                                                  | Config in `folder-config-statics.ts`; `enforce-implementation-colocation` applies each folder type's own test and proxy rules to its layers; `require-object-contract-brands` derives a layer contract's text from its use in the parent | Syntax                                                                          |
| A1         | `require-handling-in-adapters`                                                                                                                                                         | New                                                                                                                                                                                                                                      | Syntax and imports; the type checker for methods on objects an adapter returned |
| A2         | `enforce-claimed-imports`                                                                                                                                                              | New, absorbing `ban-bare-os-home-tmp`                                                                                                                                                                                                    | A repo-wide index of handled functions                                          |
| A3         | `ban-unclaimed-pass-through-adapters`                                                                                                                                                  | New, sharing A2's index                                                                                                                                                                                                                  | Syntax and A2's index                                                           |
| A4         | `ban-workspace-forwarding-adapters`                                                                                                                                                    | New                                                                                                                                                                                                                                      | Syntax and imports                                                              |
| A5         | `enforce-single-adapter-home`                                                                                                                                                          | New                                                                                                                                                                                                                                      | A repo-wide index                                                               |
| A6         | `ban-library-handles-from-adapters`                                                                                                                                                    | New                                                                                                                                                                                                                                      | The type checker                                                                |
| A7         | Returns say what happened                                                                                                                                                              | Rewriting `enforce-folder-return-types`                                                                                                                                                                                                  | The type checker                                                                |
| T4         | `ban-proxy-catch-all-defaults`: no `calledWith([])` answer in a proxy constructor for a function that takes arguments                                                                  | New                                                                                                                                                                                                                                      | Syntax, and the type checker for the function's signature                       |
| T5         | `ban-invented-failures`: no hand-made `Error` given to a mock's `rejects`, `throws` or a throwing `implement` in a proxy or test                                                       | New                                                                                                                                                                                                                                      | Syntax                                                                          |
| D1         | `ban-jsx-outside-widgets-and-flows`: no JSX outside `widgets/` and `flows/`                                                                                                            | New                                                                                                                                                                                                                                      | Syntax                                                                          |
| T6         | `ban-workspace-export-mocks`: no `registerMock` of another workspace package's export, and no `registerModuleMock` of an `@dungeonmaster/*` package outside its `/testing` entry point | New                                                                                                                                                                                                                                      | Syntax and imports                                                              |

The rules that need a repo-wide index or the type checker may be too slow for the pre-edit hook, and
may run in ward only. Open decision 12 covers this.

### Teaching text that changes

Models learn these rules from text that the MCP tools and the session hooks serve, not only from lint.
23 sentences in 10 sources contradict this doc. Each must change with its rule, or the text keeps
teaching the old rule while the lint refuses it.

| Where                                                                                                                                    | Says today                                                                                                  | Change to                                                                                                                                                                             | Doc rule |
|------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| `mcp/src/transformers/folder-constraints/folder-constraints-transformer.ts:39`, served by `get-folder-detail` for about ten folder types | "All types must come from contracts/"                                                                       | "Our own types come from contracts/. A library's types are imported from the library."                                                                                                | C2       |
| Same line, a "must not" item                                                                                                             | "Use raw primitives (string, number) in signatures"                                                         | "A field of an object contract is branded. A parameter, return or local is plain, unless it is a field taken through `Owner['key']`."                                                 | B1, B6   |
| `mcp/src/brokers/architecture/folder-detail/architecture-folder-detail-broker.ts:152`                                                    | "Ad-hoc Types Forbidden: All types must come from contracts"                                                | "Ad-hoc types forbidden: our own types come from contracts/, and a library's types from the library."                                                                                 | C2       |
| `shared/src/statics/session-snippet/session-snippet-statics.ts:104`, in every session in every repo                                      | "Returns must be branded Zod contracts — inputs MAY take a raw `string`. The asymmetry is deliberate"       | "Every object contract and every string and number field in it is branded. A loose parameter, return or local is plain."                                                              | B1, B6   |
| Same file, line 103                                                                                                                      | "Tests import `.stub.ts`, never `-contract.ts`; Stubs import contract to parse with"                        | "Tests import stubs from `stubs/`, never contracts. A stub for our type parses through its contract. A stub for a library type builds the real value and returns the library's type." | C5, C6   |
| `shared/src/brokers/architecture/overview/architecture-overview-broker.ts:264`, served by `get-architecture`                             | "`ban-primitives` is asymmetric on purpose: an input MAY take a raw `string`, a return MUST be branded."    | "Brands live on object contracts: every object and every field there is branded, and nothing else is."                                                                                | B1, B6   |
| `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts:734`, served by `get-testing-patterns`            | "Raw primitives: return types must be branded"                                                              | Drop the return rule. Keep "to test an invalid input, use `as never`".                                                                                                                | B6       |
| Same file, line 732                                                                                                                      | "define types in contracts/ and import them"                                                                | "define our types in contracts/ and import them"                                                                                                                                      | C2       |
| Same file, line 581                                                                                                                      | "Complete stub patterns in contracts/ folder detail - Use `get-folder-detail({ folderType: "contracts" })`" | "Complete stub patterns are in the stubs/ folder detail: `get-folder-detail({ folderType: "stubs" })`"                                                                                | C6       |
| `mcp/src/statics/folder-constraints/contracts-constraints.md:22`                                                                         | "All contracts MUST use `.brand<'TypeName'>()` on primitives"                                               | "Every object contract, every object nested in it, and every string and number field carries `.brand<'…'>()`, with the text derived from the owner and the key."                      | B1, B3   |
| Same file, line 134                                                                                                                      | "Import colocated contract from same directory"                                                             | "A stub in `stubs/<domain>/` imports the contract of the same domain from `contracts/`."                                                                                              | C6       |
| `mcp/src/statics/folder-constraints/adapters-constraints.md:34`                                                                          | "MUST return a meaningful value … Side-effect adapters … return `AdapterResult`"                            | "Return what the calls reported. Return `void` only when every call you discard returned `void`."                                                                                     | A7       |
| Same file, line 92                                                                                                                       | "ALL inputs MUST use contracts (no raw string, number)"                                                     | "An input is plain unless it is a field of one of our objects."                                                                                                                       | B6       |
| Same file, line 93                                                                                                                       | "ALL outputs MUST use contracts (no returning npm package types)"                                           | "A library's data types may be returned. A library object with methods may not."                                                                                                      | C2, A6   |
| `mcp/src/statics/folder-constraints/transformers-constraints.md:36`                                                                      | "All transformers MUST validate output using contracts"                                                     | "A transformer that returns one of our objects builds it through the object's contract parse. Loose text and numbers are returned plain."                                             | B1, B6   |
| Same file, line 152                                                                                                                      | `return contentTextContract.parse(config.purpose);`                                                         | `return config.purpose;`                                                                                                                                                              | B6       |
| `shared/src/statics/folder-config/folder-config-statics.ts:22`, the statics entry                                                        | `allowRegex: false`                                                                                         | `allowRegex: true`                                                                                                                                                                    | B2       |
| Same file, line 55, the contracts `purpose`                                                                                              | "All data structures must be defined here with branded types."                                              | "Type definitions and validation schemas for the data we define. Every object and every field in it is branded."                                                                      | B1, C2   |
| Same file, line 177, the adapters `whenToUse`                                                                                            | "Wrap npm package"                                                                                          | "Hold the handling an outside function needs, or speak an outside system's protocol"                                                                                                  | A1, A3   |
| Same file, line 38, the contracts `allowedImports`                                                                                       | No npm package except zod, beside our own statics, errors, contracts and two workspace packages             | Unchanged for values. `import type` from a package is allowed in every folder through `enforce-import-dependencies`.                                                                  | C2       |
| `eslint-plugin/src/brokers/rule/CLAUDE.md:7`                                                                                             | "Use the shared `Tsestree` contract."                                                                       | "Import `TSESTree` from `@typescript-eslint/utils`. Never copy it."                                                                                                                   | C1, C2   |
| Same file, line 58                                                                                                                       | "All AST nodes in rule brokers must use `Tsestree` type."                                                   | "AST nodes in rule brokers use the library's `TSESTree` types."                                                                                                                       | C2       |
| Same file, line 127                                                                                                                      | `const node = TsestreeStub({type: TsestreeNodeType.Program});`                                              | `const node = ProgramStub({ code: '…' });`, from `stubs/tsestree/`                                                                                                                    | C5, C6   |

Two new pieces of teaching text are needed as well: a `stubs-constraints.md` for `get-folder-detail`
to serve for the `stubs/` folder type, and a `stubs/` row in the folder types session snippet.

## Open decisions

1. **Reusing a field across an import cycle.** `quest-contract.ts` imports `work-item-contract.ts`. If a
   work item needs `questId`, `questContract.shape.id` would be a cycle.
  - Option (a), my recommendation: an exception to B3 and B4. Where reuse would form a cycle, the referring field redeclares the owner's brand text inline,
    `questId: z.string().min(1).brand<'QuestId'>()`, not its own derived `'WorkItemQuestId'`. A check then requires that declaration to have the same schema as the owner's field. That needs a repo-wide index, but no imports.
  - Option (b): allow each owner one extra exported id schema file that only referrers import. That brings back standalone ids, which B2 removes.
2. **A swap point for npm packages.** Under A3, an npm function no one handles is called directly, so
   swapping the library touches every caller. The alternative is to allow one pass-through per npm
   function per repo, telling npm packages from Node built-ins by Node's own
   `require('module').builtinModules`. The one win on record is glob v7 to v10, where the return type
   changed. My recommendation is no: the compiler finds every caller.
3. **Handles leaving adapters.** Choose A6 (handles stay inside), or let them leave and give A1 the type
   checker. A6 is simpler to explain. The type-checker route keeps adapters smaller, but it may be too
   slow for the pre-edit hook (open decision 12).
4. **Settled: dungeonmaster ships no adapters for other repos.** Each repo keeps its adapters in one
   package of its own (A5). A dev tool does not become a runtime dependency of a consumer's production
   code, and A2 and A5 read only the repo's own workspace packages. Dungeonmaster ships proxies and
   stubs, which only tests load. It replaces an earlier plan to ship adapters from
   `@dungeonmaster/shared/adapters` for every repo.
5. **Loose values lose their brand.** Paths built by `join` and timeouts become plain until they enter
   an owned field. That is accepted in this design. Two losses are worth weighing:
  - **Paths are the biggest.** Production code parses into `absoluteFilePathContract` 429 times and
    `filePathContract` 302 times. About 45% of path mints come from a join or a template. In shared, paths are the largest loose value after `ContentText`.
  - **The cwd role labels go.** `RepoRootCwd`, `ProjectRootCwd`, `GuildPathCwd` and `DungeonmasterHomeCwd`
    are brands layered on an absolute path (`quest-cwd-resolve-broker.ts:81`: `cwd: repoRootCwdContract.parse(quest.worktreePath)`). They are standalone brands, so B2 removes them, and a `cwd` parameter becomes a plain `string`. They guard against running a process in the wrong directory, which is a real failure here. A `cwd` that is a field of an owner, such as a spawn request, keeps a brand.
6. **An id passed through a plain parameter.** B6 lets a branded value into a plain parameter. So an
   id can travel through a parameter whose name says only its role, such as
   `({ mintedBy }: { mintedBy: string })`, and be parsed back into an id later. The brand is dropped on
   the way, and B8 does not see it, because the value it parses is plain. My recommendation is to
   accept this. A parameter lives for one call, and the field it lands in is still checked on the parse.
   The alternative is a rule for ids only: an id brand may not go into a plain parameter.
7. **Ids with no owner.** `SessionId`, `ProcessId`, `AgentId`, `ToolUseId`, `InstanceId` and `RunId`
   are carried by many contracts, but none is any contract's own `id` (B2). Under the rules as written
   they go plain. Two costs:
  - **Real checks
    go.** `InstanceId` and `RunId` carry a regex, written because a person types them at a terminal (`siegelense/src/contracts/instance-id/instance-id-contract.ts:19`,
    `ward/src/contracts/run-id/run-id-contract.ts:13`). Both are parsed straight from a CLI argument into a function parameter (`start-siegelense-driver.ts:24`, `ward-list-responder.ts:25`). No owned field ever checks them again.
  - **Mix-up safety goes where it is needed most.** `chat-line-process-transformer.ts` handles
    `agentId`, `toolUseId`, `sessionId`, `parentAgentId` and `childToolUseId` in the same functions.

   Option (a), my recommendation: give each one an owner, using records that already exist or should.
   A siegelense instance has a fleet registry entry. A ward run has its saved result. A session has
   its record. A tool use has its stream block. Each owner declares `id` with the real check, from a
   statics pattern where needed. The argument object at the entry point is parsed as a contract too,
   and B4 makes its `instanceId` reuse `instanceContract.shape.id`, so the regex runs where the person's
   typing enters. B7 requires each owner to be parsed as a whole somewhere, which a registry entry or a
   saved result already is.

   `ProcessId` is harder. It deliberately joins work item ids and spawn ids built from a template
   (`command-chat-output-emit-transformer.ts:48`, and
   `` processIdContract.parse(`${processIdPrefix}-${crypto.randomUUID()}`) `` in
   `agent-launch-broker.ts:126`). It needs one owner, such as a process registry entry, whose `id`
   accepts both. Without one, it goes plain.

   Option (b): accept plain strings for these ids and lose the checks above.
8. **`responderResultContract` checks nothing about what it carries.** It is
   `{ status, data: z.unknown() }`, and all 171 parses wrap an object the same function just built. It
   passes C1 and B7, but it checks nothing about `data`. The other wrapper, `adapterResultContract`, is
   settled by A7.
  - Option (a), my recommendation: `responderResultContract` takes the responder's own contract for
    `data`, so the envelope checks what it carries.
  - Option (b): keep it, and name it in the doc as an envelope, not a check.

   A related question is whether `z.unknown()` should be allowed as a field at all. It is the one leaf
   B1 cannot brand, and it hides an unchecked value inside a checked object.
9. **How B4 matches a name when owner names overlap.** An owner called `Item` would claim
   `workItemId` as well as `itemId`, when `workItemId` belongs to `WorkItem`.
  - Option (a), my recommendation: the longest owner name that the parameter or key ends with wins.
    `workItemId` matches `WorkItem` before `Item`, and `itemId` matches `Item`. This needs no list.
  - Option (b): a minimum length for owner names. That is a number someone has to pick, and it still misfires on two real owners that share a suffix.

10. **Which catch-everything implementations are real bugs.** 58 implementations tested only against a
    code-less error catch every error. "Unreadable means start fresh" is right for a cache and wrong for
    a user's settings file, as the settings broker above shows. Each needs reading once T5 lands.
11. **Handling A1 cannot see by syntax.** A promise handled later through a variable
    (`const p = readFile(x); … p.catch(…)`) needs dataflow. A caller wrapping a function that returns an
    I/O promise needs type information across functions.
12. **Whether the index and type-checker rules are fast enough for the pre-edit hook.** B4, B7, B8, C1,
    C3, C8, A2, A3, A5, A6 and A7 need a repo-wide index or the type checker. They may run in ward only.
    Not measured.
13. **`http` and `net` are not trapped yet.** Trapping them may interfere with MSW's interceptors.
14. **Whether `discover`, `get-project-map` and `get-project-inventory` skip `node_modules` in a
    consumer repo.** That decides whether shipped proxies and stubs are visible to a consumer's models
    only through the catalog. Not checked.

## Status and order of work

1. **Done:** the trap experiment. A setup file can trap Node's built-in modules for every unit test.
2. **Done, not committed:** the unit-test I/O trap and `StartOrchestrator.bootstrap()` (see "The
   unit-test I/O trap").
3. **Upgrade zod to v4.** B1 needs a branded object to keep `.shape`.
4. **Stubs and library types:** the `stubs/` folder type and `/stubs` entry points (C6); library stubs
   built by the library (C5); delete the copied library types and retype every lint rule to `TSESTree`
   (C1, C2).
5. **Brands:** `require-object-contract-brands` with its autofix (B1, B2, B3); B4 with the shared index;
   B5, B7, B8, B9; remove `ban-primitives`; delete the standalone scalar brands.
6. **Contracts:** C3, C4, C7, C8.
7. **Tests:** T1 to T7; shared Node proxies with recorded failures in `@dungeonmaster/testing`; each
   workspace package's `/testing` proxy with its real failure shapes; the catalog.
8. **Adapters:** A1 to A7. Move the repeated read-file handling into `fsReadFileIfExistsAdapter` first,
   then delete pass-through and forwarding adapters in batches.
9. **Folders:** D1.
10. **Teaching text,** alongside each rule it describes (see "Lint rules and teaching text").

What it costs:

- A large migration: most adapters that only forward are deleted with their proxies and tests (A3, A4),
  and broker proxies compose shared proxies in place of per-package adapter proxies (T3).
- About 244 object shapes become contracts (B9), and about 1,000 lines of scalar stub wrapping leave the
  largest tests (B6).
- A function returning text or a number that no object owns returns a plain `string` or `number`. The
  name its brand carried is gone; so is a contract that checked nothing.

Each step lands before the rule it replaces is removed. Before a new lint rule is built, run it as a
scan over the whole repo, and hand-check a sample of what it flags and what it lets through, including
the adapters any rule must keep.

## Found along the way

| What                                                                                                                                                                                                                                                                                                                          | Where                                                                                                                         | State                            |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|----------------------------------|
| Glob `ignore` pattern `'**/node_modulesdistbuild.git/**'` matches nothing (checked with minimatch), so `node_modules` and `dist` are not skipped                                                                                                                                                                              | `packages/server/src/adapters/glob/find/glob-find-adapter.ts`, `packages/tooling/src/adapters/glob/find/glob-find-adapter.ts` | Bug, not fixed                   |
| Glob v7 fallback that never runs (glob 10.5.0 installed), still tested by its proxy                                                                                                                                                                                                                                           | `packages/server/src/adapters/glob/find/glob-find-adapter.ts`                                                                 | Dead code                        |
| Absolute paths labelled `PathSegment`                                                                                                                                                                                                                                                                                         | `packages/mcp/src/adapters/glob/find/glob-find-adapter.ts`                                                                    | Wrong brand                      |
| `FolderType` is `z.string()` in mcp and `z.enum` in shared under the same brand text                                                                                                                                                                                                                                          | `packages/mcp/src/contracts/folder-type/`, recorded in `packages/mcp/CLAUDE.md`                                               | Known bug                        |
| `retryCount` branded `'FailCount'`                                                                                                                                                                                                                                                                                            | `packages/shared/src/contracts/work-item/work-item-contract.ts:49`                                                            | Name mismatch                    |
| An unreadable or malformed `settings.json` is replaced by a file holding only `permissions`, losing the user's other settings and other installers' hooks                                                                                                                                                                     | `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.ts:62-67, 119`                             | Bug, not fixed; found by reading |
| mcp's `get-quest` adapter spreads `...(stage && { stage })` where orchestrator checks `stage !== undefined`; an empty string behaves differently                                                                                                                                                                              | mcp `get-quest` adapter                                                                                                       | Drift between forwarders (A4)    |
| The "Quest not found" branch has no test: consumer tests stage a thrown error, but the real `getQuest` returns `{ success: false }`                                                                                                                                                                                           | `quest-pause-responder.ts:40`, `quest-get-broker.ts:77-80`                                                                    | Test gap (T6)                    |
| `JestSuiteName` brands what is really a file path, and every field of the Jest report contract is optional                                                                                                                                                                                                                    | ward's Jest report contracts                                                                                                  | A brand that checks nothing      |
| Proxy is empty, so tests reach the real `StartOrchestrator.getSmoketestState`                                                                                                                                                                                                                                                 | `packages/server/src/adapters/orchestrator/get-smoketest-state/orchestrator-get-smoketest-state-adapter.proxy.ts`             | Test gap                         |
| Proxy invents errors with no `.code`                                                                                                                                                                                                                                                                                          | `packages/orchestrator/src/adapters/fs/walk-files/fs-walk-files-adapter.proxy.ts`                                             | T5                               |
| `mcpServerClientContract` and its stub have no production importer; its `process` field is `z.unknown()` standing in for a `ChildProcess`                                                                                                                                                                                     | `packages/mcp/src/contracts/mcp-server-client/`                                                                               | Dead code                        |
| `as never` on stub fields that `StubArgument` already unbrands: about 552 in 5 of the largest core test files (311 in `flow-graph-to-text-transformer.test.ts`), 527 in the largest web, server and mcp tests. `stub-argument.type.ts:4` says it "Allows tests to pass raw values". Not compiled to confirm each is unneeded. | e.g. `quest-modify-broker.test.ts:41-42`, `quest-flow.integration.test.ts:66-69`                                              | Likely dead casts                |
| `ExecutionStepStatusStub` wraps a contract that is a bare `z.enum(...)` with no brand; 111 calls in one file                                                                                                                                                                                                                  | `packages/web/src/contracts/execution-step-status/`                                                                           | Pointless stub                   |
| An `EslintInstance` type copied from ESLint, not yet checked                                                                                                                                                                                                                                                                  | `packages/hooks/src/contracts/` (listed in `tmp/libstub-other-candidates.txt`)                                                | Follow up under C1               |
