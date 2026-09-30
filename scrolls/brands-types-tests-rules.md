# Brands, library types and tests: the rules, before and after

Written 2026-09-24. The rules for brands, library types, returns, tests and mocking, the evidence behind them, the unit-test I/O trap that is already built, and the order of work.

**The gateway.** How code reaches an outside package is decided in `scrolls/adapters-to-one-place.md`
and built in the `gateway-pivot` worktree (`scrolls/gateway-build/README.md` there, and the gateway's standards and open work in `scrolls/gateway/followup-sustainability.md`). Four workspace packages under `packages/@gateway/` (`npm`, `node`, `browser`, `bin`) hold every outside package, and code outside them imports one only as `#gateway/<folder>/<subpath>`, such as `#gateway/node/fs` or
`#gateway/npm/zod`. Each gateway wrapper's proxy and stubs sit in the wrapper's own folder, and a test imports them from their own files. The
`adapters/` folder type goes. This doc does not repeat those rules; its own rules are written against them.

## The problem in one paragraph

Models keep producing brands that check nothing (`ContentText`) and hand copies of library types (a 597-line copy of ESTree). Models do this because our own rules demand it, not because they misunderstand. Every rule that asks a model to judge whether a type is worth having gets the answer
"yes, make one". Agreeing costs the model less than judging.

## The principle

**A rule may not ask anyone to decide. The answer must follow from the code's structure.**
Structure means where something is declared, what it imports, and what surrounds a call. A rule built
that way needs no list for anyone to maintain. It also works unchanged in a consumer repo, because it
reads that repo's own code.

**A rule works when a machine can tell a good answer from a hollow one.** Every failure measured below
is a rule whose only check was that the model complied. Models also relearn every convention each
session, because none of it is in their training. So a rule is taught at the moment of the mistake, by
a lint or compiler message that names the fix, not by doctrine read up front.

**No rule is a list a model can edit.** "These packages may skip the gateway" becomes a list, and models
add to lists to get past errors. Every rule here checks structure, runtime behaviour, or the repo's own
code.

## Rules that cause the mess today

| Today's rule                                                                                          | Where it lives                                                                                                                                                                                                                                                                         | What it forces                                                                                   | What models produce                                                                                                       |
|-------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Every `z.string()` / `z.number()` needs `.brand()`, and no function returns plain `string` / `number` | `require-zod-on-primitives`, `ban-primitives`, `packages/mcp/src/statics/folder-constraints/contracts-constraints.md:22`: "All contracts MUST use `.brand<'TypeName'>()` on primitives", and `transformers-constraints.md:36`: "All transformers MUST validate output using contracts" | A brand on every piece of text, including loose text no object owns, with a name the model picks | `ContentText`: 894 type uses counting tests (486 without), on 108 object fields under 75 different keys, checking nothing |
| A contract may import no npm package except zod                                                       | `packages/shared/src/statics/folder-config/folder-config-statics.ts:38-45`                                                                                                                                                                                                             | A contract cannot `import type` a library's own types                                            | Hand copies of ESTree, ESLint's rule context, `ts.SourceFile`, `ChildProcess`, `fs.Stats`                                 |

The rules that forced an adapter around every package call, and forbade adapters from returning a library's types, are replaced by the gateway (`scrolls/adapters-to-one-place.md`, "Why the current rules produce this").

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

### Proxies (every adapter proxy read and sorted)

| Proxy finding                                                         | Count                                                                                           |
|-----------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Empty proxy                                                           | 70                                                                                              |
| A default answer that matches every call                              | 48                                                                                              |
| No way to stage a failure                                             | 141                                                                                             |
| Invents a failure, such as `new Error('ENOENT: ...')` with no `.code` | 49 (an undercount: two sorters counted "rejects with whatever `Error` the test passes" as real) |

### Brands that do work

**Where a brand's contract checks something real, the brand works.** It catches bad data at the first
parse. Across the brands in shared:

| What a shared brand's contract checks          | Brands | Most used (files using it)                                   |
|------------------------------------------------|--------|--------------------------------------------------------------|
| Nothing                                        | 11     | `ContentText` (263), `ErrorMessage` (104), `Identifier` (92) |
| Only "not empty"                               | 23     | `QuestId` (241), `SessionId` (93), `ProcessId` (75)          |
| A real check (uuid, regex, refine, int, range) | 44     | `AbsoluteFilePath` (394), `GuildId` (93), `ExitCode` (31)    |

`GuildId` checks for a UUID, and `AbsoluteFilePath` in shared checks for a leading `/`: both fail on bad
data at the parse. That is the part of branding these rules keep, as a check on an owned field.

## The rules

Words used below:

- **Owner**: the object contract a field is declared on. `questContract` owns `id`.
- **Leaf**: a `z.string()` or `z.number()` schema inside an object contract, at any depth, including
  inside an array.
- **Brand text**: the text inside `.brand<'...'>()`. Zod treats two brands with the same text as one
  type.
- **Outside
  package**: anything the repo does not own: an npm package, a Node built-in, a platform global such as `fetch`, or a program on the machine such as git. Workspace packages (`@dungeonmaster/*`, or a consumer's own workspace packages) are not outside. Code outside the gateway reaches an outside package only through `#gateway/<folder>/<subpath>`.
- **Wrapper**: a gateway export that is our own code around the package, such as `readFileIfExists`
  in `#gateway/node/fs` or `glob` in `#gateway/npm/glob`. Each has a proxy beside it, in the wrapper's own folder, such as `read-file-if-exists.proxy.ts`.
- **Pass-through export**: a gateway export that is the package's own function, unchanged, through
  `export *` or a named re-export, such as `z` from `#gateway/npm/zod` or `join` from
  `#gateway/node/path`. A subpath's barrel does `export *` of the whole outside module beside our wrappers, so a pass-through can do I/O, such as `statSync` from `#gateway/node/fs`. A raw export that causes bugs is blocked by `bannedExports` in the `gateway` key of `.dungeonmaster.json`, whose message names the wrapper to use (gateway worktree, `scrolls/gateway/followup-sustainability.md`, "A `gateway`
  config").

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
    status: workItemStatusContract,                                        // a shared enum contract: no brand
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

| Schema                                                                                     | Brand?                                                                                                                                                                                                                                                                                       |
|--------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| An object contract                                                                         | Yes. The text is the owner's name: `z.object({ … }).brand<'WorkItem'>()`                                                                                                                                                                                                                     |
| An object nested in a field                                                                | Yes. The text is the owner plus the key: `owner: z.object({ … }).brand<'QuestOwner'>()`. Its leaves are branded too.                                                                                                                                                                         |
| Another contract, used whole as a field: an object, union or enum contract                 | No new brand. It keeps its own: `user: userContract` carries `'User'`, and `users: z.array(userContract)` carries `'User'` on each element. A union contract keeps its branches' brands. An enum contract has none. A layer contract is not this case: it takes the owner plus the key (C7). |
| Part of another object contract, written inline                                            | Yes, as a nested object: `user: userContract.pick({ … })` inside `dealContract` is `.brand<'DealUser'>()`. The fields it keeps are reuses, so they keep the source's brands.                                                                                                                 |
| An array of objects                                                                        | Each element object gets a brand with the array field's key: `items: z.array(z.object({ … }).brand<'QuestItems'>())`. The array itself gets none.                                                                                                                                            |
| A `z.string()` or `z.number()` leaf                                                        | Yes. The text is the owner plus the key (B3).                                                                                                                                                                                                                                                |
| An element of an array of strings or numbers                                               | Yes, with the array field's key: `tags: z.array(z.string().brand<'QuestTags'>())`                                                                                                                                                                                                            |
| A value of a `z.record` or `z.map`                                                         | Yes, with the field's key, as an array element is: `counts: z.record(…, z.number().brand<'QuestCounts'>())`. An object value is `.brand<'QuestCounts'>()` the same way.                                                                                                                      |
| A key of a `z.record` or `z.map`                                                           | A string or number key gets the field's key plus `Key`: `counts: z.record(z.string().brand<'QuestCountsKey'>(), …)`. A key that holds another owner's id reuses it (B4): `z.record(questContract.shape.id, …)`. An enum key takes no brand.                                                  |
| A position of a `z.tuple`                                                                  | A string or number position gets the field's key plus its index: `span: z.tuple([z.number().brand<'QuestSpan0'>(), z.number().brand<'QuestSpan1'>()])`. An object position is branded the same way.                                                                                          |
| A field that holds the contract itself, at any depth                                       | It keeps the owner's own brand, through a getter. See "A contract that holds itself" below.                                                                                                                                                                                                  |
| An enum or literal                                                                         | No. A literal type already cannot be confused with free text.                                                                                                                                                                                                                                |
| A boolean                                                                                  | No                                                                                                                                                                                                                                                                                           |
| A value that is any JSON by nature, such as a JSON-RPC `params` or a JSON Schema           | `z.json()`, with no brand, as for an enum. It checks the value is real JSON: no function, no `undefined`, no class instance.                                                                                                                                                                 |
| `z.unknown()` or `z.any()`                                                                 | Refused anywhere in `contracts/`. See below.                                                                                                                                                                                                                                                 |
| A reuse of another owner's field (B4), or of the owner's own local id const (B2)           | It keeps the source's brand                                                                                                                                                                                                                                                                  |
| A field holding an outside package's type                                                  | It reuses the gateway's schema, and keeps its `'#Gateway<Type>'` brand (C9)                                                                                                                                                                                                                  |
| A string or number that is not a field of an object contract: a parameter, return or local | No brand of its own. It stays plain, or carries a field's brand through `Owner['key']`. An object that a function returns is a contract (B9).                                                                                                                                                |

```
// flagged
questContract = z.object({ title: z.string().min(1).brand<'QuestTitle'>() })         // the object has no brand
questContract = z.object({ title: z.string().min(1) }).brand<'Quest'>()              // leaf with no brand
questContract = z.object({ tags: z.array(z.string()) }).brand<'Quest'>()             // array leaf with no brand
questContract = z.object({ counts: z.record(z.string(), z.number()) }).brand<'Quest'>()   // record key and value with no brand
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
questContract = z.object({ counts: z.record(z.string().brand<'QuestCountsKey'>(), z.number().brand<'QuestCounts'>()) }).brand<'Quest'>()
questContract = z.object({ owner: z.object({ name: z.string().brand<'QuestOwnerName'>() }).brand<'QuestOwner'>() }).brand<'Quest'>()
workItemContract = z.object({ status: z.enum([...]), resumeOnly: z.boolean() }).brand<'WorkItem'>()
dealContract = z.object({ userId: userContract.shape.id, user: userContract.optional() }).brand<'Deal'>()   // user keeps 'User'
({ questId }: { questId: Quest['id'] })                  // the field's own brand, taken off the object
({ timeoutMs }: { timeoutMs: number })                   // loose value: plain
const modulePath: string = source;                       // loose value: plain
```

Ins and outs:

- **An object contract may hold another object contract whole, and that contract keeps its own brand.**
  A join is the common case. The parent holds the child's id, and often the child itself, to show the payload's shape:

  ```typescript
  export const dealContract = z
    .object({
      id: z.string().uuid().brand<'DealId'>(),
      userId: userContract.shape.id,          // the join id: carries 'UserId' (B4)
      user: userContract.optional(),          // the child, whole, when expanded: carries 'User', not 'DealUser'
      lineItems: z.array(lineItemContract),   // each element carries 'LineItem'
    })
    .brand<'Deal'>();
  ```

  A `User` from anywhere fits `deal.user`, and `deal.user` fits anywhere a `User` goes. A `'DealUser'`
  brand would refuse both, and the only way around it would be a re-parse. The child contract counts as parsed when its parent is (C1).

- **A contract that always holds the child does not also hold its id.** If `user` above were required,
  `userId` would be a copy of `user.id`. Nothing checks that the two match, so a payload with
  `userId: 'u-1'` and `user: { id: 'u-2', … }` parses, and code reading each one acts on a different user. A brand cannot catch this: it says "a user id", not "this user's id". So the id key goes, and code reads `deal.user.id`. When the child is optional, as above, both stay: the id is the only reference when the child is not included. Nothing checks that they match in that case, and the doc accepts that. B4's fifth check enforces the required case.

  Two cases look like this and are not:

  | Field value | Why it is different | Brand |
    |---|---|---|
  | A layer contract, `owner: ownerLayerContract` | A layer is the parent's own nested object, moved to another file (C7) | The owner plus the key: `'QuestOwner'` |
  | Part of another contract written inline, `user: userContract.pick({ … })` | It is a new object. In zod v4, `.pick()`, `.omit()`, `.extend()` and `.partial()` drop the brand | The owner plus the key: `'DealUser'` |

- **An enum used by two or more contracts is its own contract.** `workItemRoleContract = z.enum([...])`
  lives in its own file, and every contract that holds a role imports it: `role: workItemRoleContract`. An enum used by one contract stays inline. No one decides which: when a second contract writes a
  `z.enum` with the same values, B4's fourth check flags it and names the enum contract to import. So the second use is what moves a list into its own file. When the two contracts sit in different packages, the enum contract goes where C8 puts a name that several packages use.

  An enum contract is the one standalone contract that is not an object. It carries no brand, so B2 does not reach it. It is allowed because an enum always checks something real, and a copied list drifts: 85 enum contracts exist today, and `workItemRoleContract` is a field in 16 contracts. A contract that missed a new role would reject it at the parse. Its name is unique across the repo (C8), and it counts as parsed through any parent that holds it (C1).
- **`z.unknown()` and `z.any()` are refused
  in `contracts/`.** A contract that holds an unchecked value looks like a check and is not one. There are 128 uses in 85 contract files today (scan on 2026-09-26), and each one becomes one of these:

  | What it holds today | Example | Becomes |
    |---|---|---|
  | Our own data, typed later or never | `responderResultContract`'s `data`, `quest-work-input-contract.ts`'s `z.record(z.unknown())` | That data's contract. Each responder's result contract holds its own `data` contract, one branch per status it returns. |
  | Any JSON value, by nature | `json-rpc-request-contract.ts`'s `params`, `tool-contract.ts`'s `inputSchema`, `file-metadata-contract.ts`'s `metadata` | `z.json()`. Checked on 2026-09-26 against zod's v4 build: it accepts nested objects, arrays, strings, numbers, booleans and `null`, and rejects a function, `undefined` and a `Map`. |
  | A library object | `mcp-server-client-contract.ts`'s `process`, `typescript-program-contract.ts` | The gateway's schema for that type (C9), or deleted with its copy (C1) |
  | Arguments recorded from a mock call | `staged-call-contract.ts`'s `args`, in `@dungeonmaster/testing` | Not settled. `registerMock`'s own record holds whatever values a test passed, functions and predicates included, beside an `impl` function. No schema can check an arbitrary JavaScript value, and B9 still treats the record as a contract. |

- **A copy of another contract, written inline, is refused.** Suppose `dealContract` declares
  `user: z.object({ id: …, name: … }).brand<'DealUser'>()`, and `userContract` already has those keys with those checks. That object is a second definition of a user, and its brands never match the real one. B4's third check refuses it and names the contract to reuse.
- **A record key is branded, so a plain string cannot index the
  record.** `quest.byQuest['q1']` does not compile when the key is `QuestId`. Index it with a branded value, such as `quest.byQuest[quest.id]`.
  `Object.keys` and `Object.entries` return plain `string` keys, so a loop over the keys parses each one back through the key schema. Checked on 2026-09-26 against zod's v4 build (`tmp/zod-recursive/probe13.ts`).
- **A contract that holds
  itself.** A tree node holds child nodes, and a filter op holds a list of ops that can include filter ops. Five contracts do this today, with `z.lazy`, a hand-written type and an
  `as unknown as` cast: `chat-entry-group-contract.ts`, `op-filter-contract.ts`,
  `playwright-json-report-contract.ts`, `quest-contract-property-contract.ts` and
  `widget-node-contract.ts`. The TSESTree copy is a sixth, and C1 deletes it.

  zod v4 keeps `z.lazy` and adds a getter form. Both defer the lookup until the parse runs, so the contract can name itself. But TypeScript cannot infer the type once `.brand()` is chained onto the object. Every form tried reports a circular type, unless the getter names an unbranded object, and then a child lacks the owner's brand (`tmp/zod-recursive/probe.ts` to `probe8.ts`). The form that works has three parts:

  ```typescript
  // contracts/tree-node/tree-node-contract.ts
  const treeNodeFields = z.object({                          // 1. the fields, local and unbranded
    name: z.string().brand<'TreeNodeName'>(),
  });
  type TreeNodeSelf = z.infer<typeof treeNodeFields>         // 2. the recursive type, local
    & { children: TreeNodeSelf[] }
    & z.$brand<'TreeNode'>;

  export const treeNodeContract = z
    .object({
      ...treeNodeFields.shape,
      get children(): z.ZodArray<z.core.$ZodType<TreeNodeSelf>> {   // 3. a getter typed with it
        return z.array(treeNodeContract);
      },
    })
    .brand<'TreeNode'>();
  export type TreeNode = z.infer<typeof treeNodeContract>;
  ```

  What it gives, checked on 2026-09-26 (`tmp/zod-recursive/probe11.ts`, `probe12.ts`, `cross2/`):

  | Check | Result |
    |---|---|
  | A child, and a grandchild, are `TreeNode` | Compiles. A walker typed `({ node }: { node: TreeNode })` recurses into `node.children` with no parse. |
  | A hand-built literal typed `TreeNode` | Refused by the compiler, as for any branded object |
  | `treeNodeContract.shape.children` | Present |
  | Bad data at any depth | Rejected by the parse |
  | A union holding a branch that holds the union, the `op-filter` shape | Compiles and parses. Each branch is branded the owner's name, as for any union (B3). |
  | The same, split across two files that import each other | Compiles and parses. The getter delays the lookup, so the import cycle is safe at runtime. |
  | The local type claims a field the schema lacks, names the wrong brand, or the getter returns another contract | Each is a compile error on the getter |

  The rules for this form:

  1. The field list and the local type are not exported. The exported type is `z.infer` of the contract, so C1's "every exported type is `z.infer`" still holds.
  2. The field list carries no object brand of its own. Its leaves take the owner's texts (`'TreeNodeName'`), because they are the owner's fields.
  3. The local type ends in `z.$brand<'…'>` with the owner's text. Without it, a child is not a
     `TreeNode`.
  4. The getter's return type wraps `z.core.$ZodType<Self>`, not `z.ZodType<Self>`. `z.ZodType`
     compares zod's older `_output` property, which `.brand()` leaves unbranded, so it refuses the contract (`probe5.ts`).
  5. The getter is the one allowed form. `z.lazy` and a cast to `z.ZodType` are not allowed in
     `contracts/`. `z.lazy` also works when it gets the same local type and `z.core.$ZodType`
     annotation (`probe14.ts`), but an expression cannot carry an annotation without a cast, so it needs an extra local schema const that the lint rule would have to accept. The getter carries its annotation inline. The same getter form also reuses a field across an import cycle (open decision 1), so models learn one pattern for both. Decided on 2026-09-26.

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
  requires it, because a cast would skip those refinements. The way to avoid the ceremony is the shape: when a function reports one fact, it returns a plain value (B6), not a one-field object. R1's
  `rmIfExists` returns `Promise<boolean>`, not `{ removed: boolean }`.
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
- **The upgrade is more than a version
  bump.** Checked on 2026-09-25 against the `zod/v4` build that ships inside zod 3.25.76 (`tmp/zod-v4-probe.cjs`, `tmp/zod-v4-uuid-scan.cjs`):

  | What changes in v4 | What it hits here |
    |---|---|
  | `z.function()` is no longer a schema. An object with a function field throws when it is declared: "expected a Zod schema". | 22 uses in 14 contract files. B9 already puts functions outside the parse, so these fields move there. |
  | `.uuid()` checks the version and variant digits. | 451 UUID-shaped literals in 68 files fail it, such as `'12345678-1234-1234-1234-123456789abc'`. v3 accepts them. Not every one reaches a `.uuid()` check, so 451 is an upper bound. Each becomes a real UUID, or its field uses v4's `z.guid()`, which keeps v3's looser check. |
  | Error maps, `.superRefine` and `ZodError.errors` changed. | Not measured. |
  | A branded contract that holds itself needs a local type and a `z.core.$ZodType` annotation. | The five contracts listed under "A contract that holds itself". Each moves from `z.lazy` to an annotated getter and drops its `as unknown as z.ZodType` cast. `op-filter-contract.ts` also drops its hand copy of the op union. |

- **An object built from another needs its own
  brand.** In zod v4, `.extend()` on a branded object returns an object without the brand. The compiler then refuses the result where the original type is expected (`tmp/zod-v4-extend-probe.ts`). 14 contract files use `.extend()` today, and a few use
  `.pick()`, `.omit()` or `.partial()`. The new object's text comes from its own const name. The fields it keeps are reuses, so they carry their source's brands.

Why: today some fields get a brand and some do not, and the model decides which. Branding every object
and every leaf removes that decision. B3 derives every text, so branding everything adds no name anyone
has to pick. Most inline brands today already contain their key's words (809 of 919), so this mostly
writes down what models already do.

How a machine checks it: two lint rules. `require-object-contract-brands` reads only the syntax of the file, so it runs in the pre-edit hook. `require-object-contract-brands-indexed` owns the two rows marked
"indexed" below. It reads other files, so it runs in ward only ("Where each rule runs").

| What the rule checks                                                                                                                                         | Where                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Message                                                                                                                                                                   |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Every object schema in a contract ends in `.brand<'…'>()`                                                                                                    | Every `z.object` call in `contracts/`, at any depth, including inside `z.array(...)`, `z.record(...)`, `z.map(...)` and `z.tuple(...)`. Also every object built from another with `.extend()`, `.pick()`, `.omit()` or `.partial()`, and zod v4's `z.strictObject()` and `z.looseObject()`. The one exception is the field list of a contract that holds itself (see the self-reference row)                                                                                                                                                                                                                                                                                                                        | `z.object in {{file}} has no brand. Add .brand<'{{expected}}'>().`                                                                                                        |
| Indexed. Every `z.string()` and `z.number()` leaf inside it has `.brand<'…'>()` somewhere in its chain, except a key `enforce-owner-field-reuse` claims (B4) | Each property value, through `.optional()`, `.nullable()`, `.default()`, `.min()` and other chained calls. Also inside `z.array(...)`; the key and value of `z.record(...)` and `z.map(...)`; and each position of `z.tuple(...)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `Field {{key}} has no brand. Add .brand<'{{expected}}'>().`                                                                                                               |
| A contract that holds itself uses the getter form                                                                                                            | A local, unexported `z.object` with no brand, whose only uses are `...x.shape` spread into one owner and `z.infer<typeof x>` in a local type. Its leaves take the owner's texts. A getter property in the owner is a reuse, and is left alone, when its return type wraps `z.core.$ZodType<…>` of a local type that ends in `z.$brand<'{{owner}}'>`. `z.lazy` anywhere in `contracts/` is refused                                                                                                                                                                                                                                                                                                                   | `A contract that holds itself uses an annotated getter, not z.lazy. See "A contract that holds itself".`                                                                  |
| No brand on an enum, literal or boolean                                                                                                                      | `z.enum`, `z.literal`, `z.boolean` chains                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `{{key}} is an enum, literal or boolean. Remove the brand.`                                                                                                               |
| No `z.unknown()` or `z.any()`                                                                                                                                | Anywhere in `contracts/`, at any depth, including inside `z.record(...)` and `z.array(...)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `{{key}} is z.unknown(), which checks nothing. Use the value's contract, or z.json() when it is any JSON value.`                                                          |
| The brand text equals the derived text (B3)                                                                                                                  | Every `.brand<'…'>()` on an object or a leaf, except in a `*-layer-contract.ts` file. A layer's texts come from the key its parent uses it under, which this file cannot see. The indexed rule checks them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `Brand text '{{actual}}' must be '{{expected}}'.`                                                                                                                         |
| A field that reuses another schema is left alone                                                                                                             | A property value that is one of these three: a `.shape.<key>` access, such as `questContract.shape.id`; the owner's local id const (B2); or another contract, object, union or enum, imported from a `*-contract.ts` file that is not a `*-layer-contract.ts` file, such as `user: userContract` or `role: workItemRoleContract`. A getter that returns one of these across an import cycle counts too (B4). It may be wrapped in `.optional()`, `.nullable()`, `.default()` or `z.array(...)`, as `workItemId.optional()`, `z.array(workItemId).default([])` and `z.array(lineItemContract)` are. The rule checks nothing inside a reused contract here; that contract's own file is checked where it is declared. | none                                                                                                                                                                      |
| Indexed. A layer contract is not a reuse                                                                                                                     | A property value that is an identifier imported from a `*-layer-contract.ts` file (C7). The file name decides, not the import path. The rule checks every brand text declared in the layer file, the object's and each leaf's, against the owner plus this key plus the leaf's key. It also checks that exactly one file imports the layer, and uses it under exactly one key. A second use would give the layer two derived texts.                                                                                                                                                                                                                                                                                 | `Layer {{layer}} is used under key {{key}}. Its brand must be '{{expected}}'.` and `Layer {{layer}} is imported by {{file}}. Only its parent, {{parent}}, may import it.` |
| Part of another contract is not a reuse                                                                                                                      | A property value that ends in `.pick(…)`, `.omit(…)`, `.extend(…)` or `.partial(…)` on another contract. It is a new object, so the first row applies, with the owner plus the key as its text                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `z.object in {{file}} has no brand. Add .brand<'{{expected}}'>().`                                                                                                        |
| A reuse adds no check of its own                                                                                                                             | A reuse followed by a refinement, such as `questContract.shape.id.min(5)` or `.regex(…)`. A refinement would put a second check behind the source's brand text, which is the `FolderType` bug                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `{{key}} reuses {{source}}. Add no check to it: one brand text means one check.`                                                                                          |
| No `.brand<'…'>()` anywhere else (B2)                                                                                                                        | Every `.brand(` call in any file that is not on a `z.object(...)` or inside one. The one exception is a local, unexported const that its owner uses as `id`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `A brand sits only on an object contract or one of its fields. Move it onto the field that owns the value, or drop it.`                                                   |
| A local id const's text is its owner's `id` text (B3)                                                                                                        | The const's declaration, traced to the owner field that uses it as `id`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `Brand text '{{actual}}' must be '{{expected}}', the id of {{owner}}.`                                                                                                    |

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
  check inline and adds its own brand. Contracts may already import `statics/`, so this adds no new folder type and no new type name. When the owners sit in different packages, the pattern lives where C8 puts a name that several packages use:

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
  and `activeSessionResultContract`, and none of them has a session `id`. Under B2 these ids would go plain. Open decision 4 covers what to do.
- **Mix-up safety is kept wherever it exists today.** `Quest['id']` resolves to the branded type. A
  function taking `{ questId: Quest['id']; guildId: Guild['id'] }` still refuses swapped arguments.

Why: a standalone brand is a name someone had to choose, and choosing is the step models get wrong.
Tying the brand to its owner removes the choice.

How a machine checks it: syntax only. `.brand(` must sit directly on a `z.object(...)` call, or in the
value of a property of one, at any depth, or in a local unexported const that the owner uses as its
`id`. This is the sixth row of `require-object-contract-brands` (B1). Brands declared in the gateway are outside these rules: the gateway's lint block omits them, and its `'#Gateway<Type>'` brands follow C9.

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
- **Another contract used whole keeps its own text.** `user: userContract` inside
  `dealContract` is `'User'`, not `'DealUser'` (B1). The owner-plus-key text applies only to an object the parent declares itself: inline, or in a layer file.
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
  `ItemId`, including `workItemId`. Open decision 6 covers it.
- **Inside its own contract, an owner's id comes from its local const.** A key such as `parentQuestId`
  inside `questContract` names the owner's own id. `questContract.shape.id` cannot be read while
  `questContract` is being declared, so the key uses the local id const that B2 allows. The autofix writes that const, not the `.shape` access. No contract has such a key today.
- **A reuse across an import cycle goes through an annotated getter.** `quest-contract.ts` imports
  `work-item-contract.ts` (line 33). If a work item needs `questId`, a plain
  `questId: questContract.shape.id` fails twice. The compiler reports a circular type, and loading the module throws `Cannot access 'questContract' before initialization`. The fix is the getter form that
  "A contract that holds itself" (B1) uses:

  ```typescript
  // work-item-contract.ts
  import { questContract } from '../quest/quest-contract';
  export const workItemContract = z
    .object({
      id: workItemId,
      get questId(): z.core.$ZodType<string & z.$brand<'QuestId'>> {
        return questContract.shape.id;
      },
    })
    .brand<'WorkItem'>();
  ```

  The getter delays the lookup until the parse runs, so the cycle is safe at runtime. The quest's own check runs, so one brand text still means one check. The annotation writes the brand text by hand, but the compiler checks it against the quest's real field: a wrong text such as `'WrongId'` fails to compile. `workItem.questId` is a `Quest['id']`. Checked on 2026-09-26 (`tmp/zod-recursive/cycle/`).

  The getter is for a cycle only. Where no cycle exists, the field is a plain
  `questContract.shape.id`. Two contracts across a cycle that each hold the other whole, not one field, use the full form from "A contract that holds itself", with a local type on each side. A plain getter annotated with the other side's exported type is still a circular type.
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

How a machine checks it: the lint rule `enforce-owner-field-reuse`, built on a repo-wide index of object contracts and their keys. The type checker is not needed. The index reads other files, so the rule runs in ward only ("Where each rule runs"). It has five checks, with different scopes. The fifth needs no index, so it is its own rule, `ban-join-id-beside-child`, and runs in the pre-edit hook:

| Check                                                                                               | Where                                                                                                                                                                                                                                                                             | Message                                                                                                                                                                                                                  | Autofix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|-----------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A key named `<owner><Key>`, or ending in it, is `ownerContract.shape.key`                           | Every `z.object(...)` in `contracts/`                                                                                                                                                                                                                                             | `{{key}} holds {{owner}}'s {{field}}. Use {{ownerContract}}.shape.{{field}}.`                                                                                                                                            | Yes: replace the value with the reuse, and add the import                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| A parameter or destructured property named `<owner><Key>`, or ending in it, is typed `Owner['key']` | Every function, in every folder                                                                                                                                                                                                                                                   | `{{name}} holds {{owner}}'s {{field}}. Type it {{Owner}}['{{field}}'].`                                                                                                                                                  | Yes: replace the type, and add the type import                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| A nested object written inline is not a copy of an existing object contract                         | Every nested `z.object(...)` in `contracts/`. It is a copy when it has the same keys as an object contract in the index, and each key has the same schema once brand texts are ignored                                                                                            | `{{key}} copies {{ownerContract}}. Use {{ownerContract}}, or {{ownerContract}}.pick({ … }) for part of it.`                                                                                                              | Yes: replace the object with the contract, and add the import                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| An inline `z.enum` is not a copy of another enum's values                                           | Every `z.enum(...)` in `contracts/`, inline in an object or its own contract. It is a copy when its set of values equals the set of an enum contract in the index, or of an inline `z.enum` in another contract                                                                   | `{{key}} copies the values of {{enumContract}}. Import it.` When the other copy is inline too: `{{key}} has the same values as {{otherKey}} in {{otherContract}}. Move them into {{derivedName}} and import it in both.` | Yes. When an enum contract exists, replace the values with it, and add the import. When the other copy is inline, create the enum contract and import it in both. Its package follows C8. When C8 finds no package every user depends on, there is no autofix, and the message says to move the enum into a package every user depends on, or into a new package. Its name is derived, not chosen: the owner plus the key of the copy already in the repo, as B3 derives a brand text. `role` in `workItemContract` gives `workItemRoleContract`. |
| An object that always holds a child does not also hold the child's id                               | Every `z.object(...)` in `contracts/`. It is flagged when one key holds another owner's contract whole and is not optional, nullable or defaulted, and another key in the same object is that owner's id: a key B4 matches to `<owner>Id`, or a reuse of `ownerContract.shape.id` | `{{idKey}} copies {{childKey}}.id, and nothing checks that they match. Remove {{idKey}} and read {{childKey}}.id.`                                                                                                       | No. Removing the key breaks every caller that reads it, so the model changes those callers by hand                                                                                                                                                                                                                                                                                                                                                                                                                                                |

The first check also accepts the reuse written as a getter whose body returns
`ownerContract.shape.key`, and whose return type is `z.core.$ZodType<… & z.$brand<'{{text}}'>>` with the owner field's text. Its autofix writes that getter, not the plain `.shape` access, when the file the owner contract lives in already imports this one, directly or through other contracts.

The third check needs the index to record each object contract's schema, not only its keys. It catches a whole copy only. A copy that drops a key or adds one gets through, since a subset of keys such as
`{ id, name }` is too common to flag.

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
   *id*, so it does not match `QuestId`, although its raw text ends in "questId". When two owners match, the longest owner name wins (open decision 6).
4. **Check the declared type.** A match must be typed `Quest['id']`. Anything else is reported, and the
   autofix writes the indexed type and its import.

Only owners the file could import count: its own package and its workspace dependencies. An owner in a
package the file cannot reach does not claim its names.

No lint rule in this repo builds a repo-wide index today. `graph-reachability` reads one statics module it imports, not files. The index is a new capability, and it is the main cost of B4. C8 needs the same kind of index, a record of declared contract names and keys, so they can share one. C1 builds a different one, of parse calls, and B7 reuses C1's. The file scanning behind the `discover` tool is
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
  `truncateTransformer` work for every field. The gap it leaves is open decision 3.
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

How a machine checks it: ward only, never the pre-edit hook, for the same reasons as C1. It needs a repo-wide index, the one C1 builds. An owner contract must count as parsed as a whole, in C1's sense, somewhere in production code. C1 also counts a parse of one field, such as `contentContract.shape.text.parse(raw)`. B7 does not, and that difference is B7's whole job.

A use of the owner as a type does not count. A branded object can only come from a parse (B1), so a type use adds nothing except a way out: a function typed on `Content` that nothing calls.

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
  | `QuestWorkItemId` becomes `ProcessId` | `command-chat-output-emit-transformer.ts:48`: `processIdContract.parse(String(workItemId))` | Yes: the source is a work item's `id`. The fix depends on whether `ProcessId` gets an owner (open decision 4). |
  | `ToolUseId` becomes `ToolName`, to use as a Map key | `merge-tool-entries-transformer.ts:37`: `toolNameContract.parse(toolUseId)` | No: `ToolUseId` is declared on `chatEntry.toolUseId`, not on an `id` key |
  | `AgentIdCorrelation` becomes `AgentId` | `tool-use-id-from-parent-lines-transformer.ts:45`: `agentIdContract.parse(toolUseResult.agentId)` | No: `AgentIdCorrelation` is declared on a stream line's `agentId` |

  Once each of those ids has an owner (open decision 4), B4 makes `toolUseId` and `agentId` reuse
  the owner's id, and B8 then sees them.
- **Most re-brands between brands that are not ids disappear under B2.** The target is usually a
  standalone brand, which B2 removes, so the value passes as a plain string with no parse:

  | Re-brand today | Where | Under the rules |
    |---|---|---|
  | `displayLabelContract.parse(operation.text)`, from `OperationText` | `execution-panel-widget.tsx:341`, and twice more in the same file | `DisplayLabel` goes; `operation.text` passes to a plain prop |
  | `claudePermissionContract.parse(permission)`, from `McpPermission` | `settings-permissions-add-broker.ts:76` | Both go; the settings contract's field brands the value when the settings are parsed |
  | `filePathContract.parse(String(sessionFilePath))`, from `AbsoluteFilePath` | `quest-monitor-watcher-start-broker.ts:142` | Both go; the path is a plain string |
  | `repoRootCwdContract.parse(quest.worktreePath)` | `quest-cwd-resolve-broker.ts:81` | `RepoRootCwd` goes (open decision 2) |

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

How a machine checks it: needs the type checker, so it runs in ward only. It checks the static type of the argument to a field schema's `.parse`. The same-object exception needs a syntax check as well: the id and the target
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
brokers/quest/cleanup/…-broker.ts:   (): Promise<{ removed: boolean }> => …   // one fact is better as Promise<boolean>
transformers/x/x-transformer.test.ts:   type LooseHandle = Record<string, unknown> & { operations: … };
interface Foo { … }                                                            // flagged today
value as { type: string }                                                      // flagged today

// left alone
({ questId, limit }: { questId: Quest['id']; limit: number }) => …            // a parameter's type: the repo's convention
(): CarveResult => …                                                           // a contract type
(): { stop: () => void; flush: () => Promise<void> } => …                     // every member is a function: a method set
const totals: { passed: number; failed: number } = { passed: 0, failed: 0 };  // inside a function body
items.reduce<{ seen: string[] }>(…, { seen: [] })                             // inside a function body
type Handle = ReturnType<typeof spawnDetached>;                               // no object literal in it
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
- **An object type whose every member is a function is a method set,** such as a handle a timer wrapper
  returns. Zod cannot check a function, so a method set stays inline.
- **A shape mixing data and functions is a contract for its data.** The data members are parsed, and
  the functions are attached outside the parse, as `contracts-constraints.md:132-133` already teaches
  and `browser-session-contract.ts` already does. Hook return values in `bindings/` are the common
  case.
- **Proxies are exempt.** A proxy's return object is its own API of scenario methods, and
  `enforce-proxy-patterns` governs it.
- **The gateway is exempt.** Its lint block omits `ban-adhoc-types`. A wrapper's own types, such as
  `FsError` or `WalkedFile`, describe an outside package's structures, not our data, and the gateway imports none of our contracts. They stay plain TypeScript types. A caller that puts one of those values into our data parses it into a contract there.
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
module-level variable's type or a module-level type argument, unless every member of the literal is a function. It skips `.proxy.ts` files. The gateway's lint block omits the rule.

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

// after — the library's own type, through the gateway (C2)
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
'CallExpression': (node: TSESTree.CallExpression) => { if (node.callee.type === 'Identifier') … }
```

```
// flagged — never .parse'd in production
tsestreeContract, eslintContextContract, typescriptSourceFileContract, childProcessContract, fileStatsContract

// left alone — parsed where outside data enters
const report = jestJsonReportContract.parse(JSON.parse(stdout));
const line = streamJsonLineContract.parse(JSON.parse(rawLine));        // Claude CLI output
const pkg = packageJsonContract.parse(JSON.parse(await readFile(filePath)));   // readFile from #gateway/node/fs__promises
```

Ins and outs:

- **A deleted copy's stub is deleted with
  it.** The gateway holds its own stub for each type it owns (C5), and callers switch to that one.
- **No one decides what counts as a copy.** A copy is never parsed, so it fails. A contract that
  describes real outside data is parsed, so it passes.
- **The Claude CLI contracts stay.** They parse output from another process. That is describing our
  data, not copying someone's types. Their leaves follow B1 and B3.
- **A parse is not a boundary check just because it runs.** `responderResultContract` (171 production
  calls) is `z.object({ status: …, data: z.unknown() })`, so it checks nothing about `data`.
  `adapterResultContract` (118 calls) is `z.object({ success: z.literal(true) })`. Both wrap our own values, never outside data. C1 passes them. R1 replaces `adapterResultContract`, and open decision 5
  covers `responderResultContract`.
- **The parse of outside data may live in a broker or a transformer.** It usually sits one line after a read returns the text: 43 of the 52 `xContract.parse(JSON.parse(...))` calls are in brokers,
  such as `usage-ledger-read-broker.ts:23`. Ward's jest, eslint and playwright report parsing, and
  orchestrator's stream-line parsing, sit in `transformers/`, and orchestrator's `CLAUDE.md` says
  parsing belongs there. C1 only asks that the parse happens somewhere in production.
- **Copies that are not contracts go too.** `tsestree-node-type-statics.ts` copies `AST_NODE_TYPES`
  into statics, so C1 does not see it. C2 makes it unnecessary: import `AST_NODE_TYPES` from
  `#gateway/npm/typescript-eslint__utils`. The gateway build added that pass-through (`packages/@gateway/npm/src/typescript-eslint__utils/typescript-eslint__utils.ts`).
- **A format pattern in `statics/` is not a contract,** so C1 does not apply to it (B2).
- **An unused contract is deleted, with its stub and
  test.** A contract nothing in production imports is never parsed, so C1 refuses it along with the copies. The cleanup comes first in the order of work: every contract it removes is one the brand rules no longer have to migrate. It runs after the gateway migration, which deletes the copied library types and their stubs itself. The search is the same index C1's rule builds: every contract with no `.parse(` or `.safeParse(` call in production code, directly, through a field, or through a layer. Contracts that are only imported for their type count as unused too, since a type use never checks anything (B7's reasoning).

How a machine checks it: ward only, never the pre-edit hook ("Where each rule runs" says why). It needs a repo-wide index of `.parse(` and `.safeParse(` calls outside test,
proxy and stub files, read from the syntax tree, not from text. 1,095 of the 1,103 `.parse(` lines in
`contracts/` folders are JSDoc `@example` comments. A text search would count those as parses and pass
every copy that carries an example. A copy written as a plain TypeScript type has no schema to parse,
so C1 also requires that every type a contract file exports is `z.infer` of a schema in that file.

A contract counts as parsed in either of two ways. A search for its own `.parse(` call finds only the first:

1. Production code parses it, or one of its fields: `questContract.parse(…)`,
   `questContract.shape.id.parse(…)`.
2. It is a field of a contract that counts as parsed. `workItemContract` sits inside `questContract`, and a layer sits inside its parent (C7).

#### C2: a library's types are imported through the gateway, wherever they are used, like its functions

`contracts/` holds our types: the data we define. A library's types come from the library, through its gateway subpath, in any folder, the same way its functions do. The gateway passes every package's types through, pass-through and wrapped modules alike. Nothing gives a library type a second name.

```
// before — eslint-plugin/src/contracts/tsestree/tsestree-contract.ts: 597 lines copying TSESTree
export const tsestreeContract = z.object({ type: z.enum(...), callee: recursiveBase.optional(), ... });
export type Tsestree = z.infer<typeof tsestreeContract>;
'CallExpression': (node: Tsestree) => { if (node.callee?.type === 'Identifier') … }

// after — the copy is deleted; the rule imports the library's type through the gateway
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
'CallExpression': (node: TSESTree.CallExpression) => {
  if (node.callee.type === 'Identifier') { … }       // no ?.: the real type says callee is always there
}
```

```
// flagged
contracts/x/x-contract.ts:   export type Node = { type: string; callee?: Node };        // a hand-written copy, not inferred from a schema (C1)
contracts/x/x-contract.ts:   export type EslintContext = TSESLint.RuleContext<string, []>;   // a second name for a library type
contracts/x/x-contract.ts:   export type { TSESTree } from '#gateway/npm/typescript-eslint__utils';  // a re-export (forbid-type-reexport)
brokers/rule/x.ts:           import type { TSESTree } from '@typescript-eslint/utils';   // a raw import (raw-import-ban)

// left alone
brokers/rule/x.ts:        import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
brokers/fs/x/x-broker.ts: import type { Stats } from '#gateway/node/fs';
packages/@gateway/node/src/child_process/child-process/child-process.stub.ts:   export const ChildProcessStub = (): ChildProcess => new ChildProcess();
```

Ins and outs:

- **Imports are
  consistent.** Anything from a package, function or type, is imported through the gateway, where it is used. The gateway doc settles this ("Type-only imports go through the gateway too").
- **What models are told changes by one word.** "Every type lives in `contracts/`" becomes "every type *we
  define* lives in `contracts/`; a library's types come from the library, through the gateway, like its functions".
- **No alias gives a library type a second name.** `export type EslintContext = TSESLint.RuleContext<…>`
  is refused. It is a name models would learn and repeat, and the library's own name already works.
- **Discovery still shows the library types that tests
  build.** Each has a stub in the gateway module that owns it (C5), and inventory lists the gateway's subpaths.
- **Duplicates stay impossible without discovery.** C1 refuses a copy that nothing parses, and C5
  refuses a hand-built value cast to a library type. So a library type does not need to appear in
  `contracts/` to stay deduplicated.
- **A library stub returns the library's own type,** such as `CallExpressionStub(): TSESTree.CallExpression`
  or `ChildProcessStub(): ChildProcess` (C5).
- **A wrapper returns plain values or the gateway's own types where it
  can.** A directory read returns names and kinds, not `Dirent`. The package's own types are still re-exported for code that needs them, such as Playwright's `Page` (gateway doc, "Defaults", item 3).
- **Inside the gateway, a cast to the package's own type is
  allowed.** The package declares the type, so the cast names a real type instead of copying one. The gateway's rules for this are in
  `scrolls/gateway/followup-sustainability.md` in the gateway worktree, item 22.
- **A library value enters our objects only through a parse.** `node.name` is a plain `string`. It
  becomes a brand only when a contract parses it into an owned field.

Why: types were copied because a contract could not import them, and models were told that every type
lives in a contract. Importing a type the same way as its function removes the copy and the mismatch
between the two. The library stays the source of truth, and an upgrade flows through with no hand
edits.

How a machine checks it: syntax. `raw-import-ban` refuses a raw import of an outside package, type or value, outside the gateway. `import type` from a `#gateway` subpath is allowed in every folder. In
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

How a machine checks it: syntax, so it runs in the pre-edit hook. The predicate's target type is refused when it is imported from a `contracts/` path, from a workspace package's `contracts` export, or when it is an indexed type such as `Quest['id']`. B5 bans every other alias of a field's type, so a branded type cannot reach a predicate under another name.

#### C4: parsed JSON goes straight into a contract's parse

Outside the gateway, the result of `JSON.parse(...)`, `response.json()`, or a gateway function that returns `unknown` must be the direct argument of a contract's `.parse` or `.safeParse`. It may not be stored, cast, returned or read first. Inside the gateway, `JSON.parse` follows the gateway's own rule: cast to the package's type, or to `unknown` for our data (gateway follow-ups, item 22).

```
// before — shared/src/adapters/fetch/get/fetch-get-adapter.ts:24
return JSON.parse(text) as TResponse;
// before — hooks/src/flows/hook-pre-edit/hook-pre-edit-flow.ts:20
const parsed: unknown = JSON.parse(inputData);
// before — web/src/transformers/format-tool-input/format-tool-input-transformer.ts:43-48
try { return JSON.parse(toolInput) as unknown; } catch { return undefined; }

// after
const quest = questContract.parse(await fetchJson({ url }));   // the gateway's fetchJson returns unknown
const hookInput = preEditHookInputContract.parse(JSON.parse(inputData));
try { return toolInputContract.parse(JSON.parse(toolInput)); } catch { return undefined; }
```

```
// flagged
JSON.parse(text) as Settings                           // a cast
(await fetchJson({ url })) as Quest                    // a gateway unknown, cast instead of parsed
const raw: unknown = JSON.parse(text);                 // stored before any check
JSON.parse(text).version                               // read before any check
return await response.json();                          // returned unchecked

// left alone
settingsContract.parse(JSON.parse(text))
statusContract.safeParse(await response.json())
questContract.parse(await fetchJson({ url }))           // fetchJson from #gateway/browser/fetch returns unknown
```

Ins and outs:

- **Today, 87 of 139 `JSON.parse` calls in production code do not go straight into a contract.** 47
  store the result in a variable first, 39 cast it (mostly `as unknown`), and 12 read a property off it
  before any check. None of the 26 `response.json()` calls goes straight into a contract.
- **Storing the result as `unknown` and parsing it later is refused too.** The rule is about where the
  value goes next, so a machine can check it without dataflow. The window between the two lines is
  where unchecked reads creep in.
- **Malformed text throws before the contract runs.** `safeParse` does not catch a `JSON.parse` error.
  `JSON.parse` does no I/O, so a `try` around both, with a fallback, may sit in a transformer.
- **A gateway function that returns `unknown` is outside
  data.** The gateway cannot import our contracts, and may not cast to a type its caller picks. So a gateway read of our own data, such as
  `fetchJson` against our server, hands back `unknown`, and the caller parses it here.

Why: outside data gets exactly one check, where it enters. Every step between the parse and the check
is a place to use the data unchecked.

How a machine checks it: two rules. `require-validation-on-untyped-property-access` checks
`JSON.parse` and `.json()` by syntax, in the pre-edit hook: walk up from the call through `await` and
parentheses, and require a `.parse` or `.safeParse` call whose argument it is.
`require-gateway-unknown-parse` needs the type checker, so it runs in ward only: a call to a function imported from `#gateway`, whose return type is `unknown` or `Promise<unknown>`, gets the same walk.

#### C5: a test value of an outside package's type comes from the gateway's stub, never from a copy or a cast

A stub for one of our contracts parses through the contract. A value of an outside package's type, such as an AST node, an ESLint rule context or a `ChildProcess`, comes from the gateway's stub for that type, imported from its own file beside the type: `import { CallExpressionStub } from
'#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub'`. `@dungeonmaster/testing` ships no stubs of outside types.

**This doc does not build those
stubs.** The gateway writes them, typed with the package's own types and built by the package where it can; how is in the gateway follow-ups, item 25. This rule covers our side: our stubs of copied types are deleted with their copies (C1), every caller switches to the gateway's stub, and no test builds an outside value by hand.

```
// before — hand-built nodes through the copy; TsestreeStub is called 1,856 times in 60 test and proxy files
const node = TsestreeStub({
  type: TsestreeNodeType.CallExpression,
  callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'foo' }),
});   // compiles with no `arguments`, a CallExpression the real parser never produces

// after — the gateway's stub, from real parsed code
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
const node = CallExpressionStub();                         // a TSESTree.CallExpression for 'foo()'
const withArgs = CallExpressionStub({ code: 'bar(1, 2)' });
```

```
// before — a partial ESLint context through the copy; EslintContextStub is called 307 times in 21 files
const context = EslintContextStub({ getFilename: () => 'x.ts', report: jest.fn() });

// after — the gateway's complete TSESLint.RuleContext
import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
const context = RuleContextStub({ filename: 'x.ts' });
```

```
// flagged — an outside type built by hand and cast, in a test, proxy or stub file
const node = { type: 'CallExpression' } as TSESTree.CallExpression;
const sourceFile = { fileName: 'x.ts' } as unknown as ts.SourceFile;
const context = { report: jest.fn() } as Partial<TSESLint.RuleContext<string, []>>;

// left alone — the gateway's stubs
const node = CallExpressionStub({ code: 'foo()' });
const sourceFile = SourceFileStub({ code: 'const a = 1;' });
const child = ChildProcessStub();
```

What our side changes, stub by stub:

| Our stub on a copied type today      | Test and proxy files | Calls | Our side                                                                                              | Callers switch to (the gateway's)                                                      |
|--------------------------------------|----------------------|-------|-------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| `TsestreeStub` (eslint-plugin)       | 60                   | 1,856 | Deleted with `tsestree-contract.ts`                                                                   | `CallExpressionStub`, `IdentifierStub` and the rest, one per node type                 |
| `EslintContextStub` (eslint-plugin)  | 21                   | 307   | Deleted with `eslint-context-contract.ts`                                                             | `RuleContextStub`                                                                      |
| `TypescriptSourceFileStub` (testing) | 7                    | 38    | Deleted with its contract. 6 of the 7 caller files already build a real source file and then wrap it. | `SourceFileStub`                                                                       |
| `ChildProcessStub` (hooks)           | 3                    | 7     | Deleted with its contract                                                                             | `ChildProcessStub` from `#gateway/node/child_process/child-process/child-process.stub` |
| `FileStatsStub` (hooks)              | 3                    | 6     | Deleted with its contract                                                                             | `StatsStub`                                                                            |
| `TimerHandleStub` (testing)          | 3                    | 9     | Deleted with its contract                                                                             | `TimeoutStub` from `#gateway/node/setTimeout/timeout/timeout.stub`                     |
| `McpServerClientStub` (mcp)          | 3                    | 8     | Deleted: its contract has no production importer (C1)                                                 | nothing                                                                                |

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

- **Hand-built AST trees shrink at the call
  site.** The deepest single `TsestreeStub` call nests 14 levels (`validate-adapter-mock-setup-layer-broker.test.ts`). Tests build a `CallExpression` with no
  `arguments` and `MemberExpression` nodes with no `computed` or `optional`, which the copy does not even model. From parsed code, those trees become one line:

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

- **Most `EslintContextStub` calls override
  only `report`.** Of its 307 calls, scope and source code overrides are essentially unused, so most call sites switch to `RuleContextStub()` with a `report`
  mock and nothing else.
- **A test that corrupts a node on purpose keeps doing so after building a real one.**
  `validate-proxy-constructor-side-effects-layer-broker.test.ts:88-89` sets
  `bodyRef.body = 'not-an-array' as never` to test defensive code against a shape no parser produces. That cast is to `never`, not to an outside type, so C5's check leaves it alone.
- **Whole-rule behaviour is still tested through ESLint's `RuleTester`,** as
  `eslint-rule-tester-adapter` does today, in 72 test files with real code strings. C5 covers the guard
  and transformer tests below that. Only one file uses both, for a case `RuleTester` cannot reach.
  `brokers/rule/CLAUDE.md:109` documents the split.
- **Our own objects are not outside
  types.** An object our code builds itself, such as siegelense's browser session, is our shape, a contract, and its stub beside that contract builds it directly (C6).
  `browser-session-contract.ts:2-4` says it describes the page's operations "without this package ever importing Playwright". Its stub is the most used of these (28 files, about 119 calls), and it stays as it is.
- **A contract field of an outside type takes the gateway stub too.** Its value is branded
  `'#Gateway<Type>'`, so only the gateway's stub fits it (C9).

Why: a hand-built outside value has the shape the author imagined, the same problem as invented failures (T5). Code tested against it passes on inputs the real library never produces. One stub per outside type, in the gateway, keeps that work in one place, and production code never changes its types to suit a test.

How a machine checks it: syntax plus type imports. In test, proxy and stub files, refuse an object literal cast to a type imported from a package, with `as`, `as unknown as`, or through `Partial<…>`.

#### C6: stubs and proxies stay beside their code, and no barrel exports them

A stub stays in its contract's folder, and a proxy stays beside the file it mocks, as today. What changes is how a test reaches them from another package: no barrel re-exports a stub or a proxy. A test imports each one from the file that declares it. There is no `_test_` folder and no `_test_`
import path, in workspace packages or in the gateway. A stub for an outside package's type lives in the gateway (C5), not here.

A test imports a stub or proxy by its package's import name plus the file's path under `src/`, without the extension. The gateway works the same way:

| File                                                                                       | Imported as                                                                |
|--------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| `packages/shared/src/contracts/quest/quest.stub.ts`                                        | `@dungeonmaster/shared/contracts/quest/quest.stub`                         |
| `packages/orchestrator/src/startup/start-orchestrator.proxy.ts`                            | `@dungeonmaster/orchestrator/startup/start-orchestrator.proxy`             |
| `packages/@gateway/node/src/fs__promises/read-file-if-exists/read-file-if-exists.proxy.ts` | `#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy` |
| `packages/@gateway/npm/src/glob/glob/glob.proxy.ts`                                        | `#gateway/npm/glob/glob/glob.proxy`                                        |

The two gateway proxies exist in the gateway worktree today. The `package.json` `exports` entries that make these paths importable land with the gateway's import fix. `start-orchestrator.proxy.ts` does not exist yet (T6).

```text
before
packages/shared/src/contracts/quest/quest-contract.ts
packages/shared/src/contracts/quest/quest.stub.ts
packages/shared/contracts.ts        exports questContract AND QuestStub — 232 stubs in the production entry point
packages/shared/testing.ts          proxies, at @dungeonmaster/shared/testing

after
packages/shared/src/contracts/quest/quest-contract.ts
packages/shared/src/contracts/quest/quest.stub.ts        unchanged: beside its contract, parsing through it
packages/shared/contracts.ts        exports contracts only
                                    no testing.ts, no test barrel of any kind
```

```
// flagged — production code reaching test support
brokers/quest/x/x-broker.ts:   import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
contracts.ts:                  export { QuestStub } from './src/contracts/quest/quest.stub';   // a stub in a production barrel
testing.ts:                    export { questGetBrokerProxy } from './src/brokers/quest/get/quest-get-broker.proxy';   // any barrel of test support

// left alone
brokers/quest/x/x-broker.test.ts:          import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
brokers/quest/pause/x-responder.proxy.ts:  import { startOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
brokers/fs/stat/fs-stat-broker.proxy.ts:   import { StatsStub } from '#gateway/node/fs/stats/stats.stub';   // a library stub, from the gateway (C5)
```

Ins and outs:

- **Stubs ship in production today.** `packages/shared/tsconfig.build.json` excludes `**/*.stub.ts`, but
  `contracts.ts` exports 232 stubs beside its 233 contracts. The compiler follows those imports, so all
  232 stubs are in `packages/shared/dist`, and `dist/contracts.js` loads them. Every production import of `@dungeonmaster/shared/contracts` loads every stub. Checked on 2026-09-24.
- **Taking stubs out of the barrels keeps them out of production
  processes.** `dist/contracts.js` no longer imports a stub, so no production process loads one.
- **A stub or proxy then reaches `dist` only if the build includes it.** Every build config excludes
  `**/*.stub.ts` and `**/*.proxy.ts`, and tsc emits an excluded file only when an included file imports it. Inside this repo that costs nothing, because tests read source. A package whose test support ships to consumers, `@dungeonmaster/testing` and the gateway packages, must include those files in its build. Today `testing`'s stubs reach `dist` only because its production barrel imports them (`dist/src/contracts/base-name/base-name.stub.js`, checked on 2026-09-25), which is the shape this rule removes.
- **The file name says what it is.** The hoister, `enforce-proxy-child-creation` and
  `ban-workspace-export-mocks` key on an import of a `.proxy` or `.stub` file, the same in every repo.
- **Pairing and discovery stay as they are.** A contract's stub sits beside it, so
  `enforce-implementation-colocation` pairs them as it does today, and discovery shows the stub as the contract's companion.
- **No folder type is
  added.** The first version of this rule moved every stub into a `stubs/` folder type, for two reasons: a library stub had no contract to sit beside, and stubs shipped in production. The gateway gave library stubs their home, and taking stubs out of the barrels fixes the shipping, so the move of 1,083 files bought nothing. Decided on 2026-09-26.

Why: a stub or a proxy is test support. Loading it into every production process that reads a contract costs load time, and invites production code to build values with it. Importing each one from its own file needs no barrel to keep current, in any package.

How a machine checks it: syntax. `enforce-import-dependencies` refuses an import of a `.stub` or
`.proxy` file from a file that is not a test, proxy, harness or stub file. No barrel may re-export a
`.stub` or `.proxy` file. The one exception is a parent stub file re-exporting its stub layers (C7).

#### C7: contracts, transformers, statics and bindings may split into layer files

Layer files are the architecture's way to split a file past 300 lines: `{name}-layer-{suffix}`, flat
beside the parent, imported only by the parent. Today only `flows/`, `adapters/`, `brokers/`,
`responders/` and `widgets/` allow them. Four more folder types need them. A stub file in `contracts/` splits the same way:

| Folder type     | Files over 300 lines today | Largest                                 | Why it grows under this doc                                |
|-----------------|----------------------------|-----------------------------------------|------------------------------------------------------------|
| `statics/`      | 20                         | `eslint-rule-statics.ts`, 1,036 lines   | Shared regex patterns move here (B2)                       |
| `transformers/` | 5                          | `next-action-transformer.ts`, 619 lines | Parsing of outside text stays here (C1)                    |
| `contracts/`    | 2                          | `step-contract.ts`, 396 lines           | Every object, nested object and field carries a brand (B1) |
| `bindings/`     | 1                          | `use-quest-chat-binding.ts`, 961 lines  | —                                                          |

`guards/`, `errors/`, `middleware/` and `state/` stay without layers: none has a file over 300 lines,
and the largest is 288.

```text
// after — a contract split into layers
contracts/quest/quest-contract.ts                   the owner: imports its layers
contracts/quest/owner-layer-contract.ts             the nested object the owner holds under `owner`
contracts/quest/owner-layer-contract.test.ts

// after — a stub file split into layers
contracts/assistant-stream-line/assistant-stream-line.stub.ts      the parent: re-exports its layers
contracts/assistant-stream-line/tool-use-layer.stub.ts             the stubs for one part of the line
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
- **A layer contract is not an
  owner.** It is a nested object that lives in its own file, so it is treated like one written inline. B4's index does not record `ownerLayerContract` as an owner called
  `OwnerLayer`, and C8 does not compare layer names across packages. A layer is never exported from a barrel, so two packages can each have an `ownerLayerContract` without either seeing the other.
- **A layer contract gets a test, not a stub.** Tests build the nested object through the parent's
  stub: `QuestStub({ owner: { name: 'n' } }).owner`.
- **A stub layer is re-exported by its parent stub file,** so tests import only the parent, as the layer convention requires. Stubs keep having no tests of their own. This is the one re-export of a stub that C6 allows: a `.stub.ts` file may re-export a `*-layer.stub.ts` beside it.
- **A layer that needs its owner's own id uses the getter across the
  cycle.** The parent imports the layer, so the layer cannot import the parent at load time. The owner's local id const (B2) is not exported, so the layer cannot reach it either. The layer reuses the id through an annotated getter, as B4's "A reuse across an import cycle" shows:
  `get dependsOn(): z.core.$ZodType<(string & z.$brand<'WorkItemId'>)[]> { return z.array(workItemContract.shape.id); }`. Checked on 2026-09-26: it compiles, a dependency is a `WorkItem['id']`, and a bad id is rejected at the parse (`tmp/zod-recursive/layer/`).
- **Nothing enforces "imported only by the parent"
  today.** The architecture states it for every layer type, but no lint rule checks it. For a contract layer it matters more, because the layer's brand texts come from its one use. `require-object-contract-brands-indexed` checks it for contract layers (B1's layer row).
- **A statics layer follows the statics test rule:** it needs a test only when it holds a regex, not
  the "every layer carries its own test" default.
- **A transformer layer stays pure,** like its parent, and has its own test. A binding layer is a hook
  like its parent.

Why: brands on every object and field make contracts longer, and their stubs with them. Without layers, a long file has nowhere to split, and a model starts a second domain
folder to get room, which scatters one owner across folders.

How a machine checks it: syntax. `allowsLayerFiles` becomes `true` for `contracts`,
`transformers`, `statics` and `bindings` in `folder-config-statics.ts`, and `enforce-project-structure`
reads it. `enforce-implementation-colocation` applies each folder type's own test and proxy requirements to its layers. `require-object-contract-brands-indexed` derives a layer contract's texts from its use in the parent, and checks that the parent is its only importer. It reads the parent file, so it runs in ward only. The pre-edit `require-object-contract-brands` skips brand texts in a layer file, so it never asks for a text derived from the layer's own const name.

#### C8: a contract name is unique across the repo's workspace packages

The gateway keeps one home for each outside package. C8 does the same for contracts. B3 derives every brand
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

- **The package that keeps a name comes from the dependency graph, never from a package
  name.** It is the lowest package that every user of the contract already depends on, directly or through another package. A package lower in the graph cannot import from one above it, so a contract moves down, not up. In this repo that is usually `shared`, but no rule names `shared`: a consumer repo may have no package like it.
- **The users may share no dependency at
  all.** Then no package can hold the one copy, and the rule still errors. Its message names the packages that define the name, says the contract is duplicated, and says to move it to a package every user depends on, or to create a package that holds it. It has no autofix. The gateway is in every repo, but it is not a home for our contracts: it holds outside packages, and imports none of our contracts.
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
- **The stub moves with its contract,** to the one package that keeps the name.
- **"The repo" means the workspace packages under `packages/*`,** never `node_modules`.
- **This makes B3's uniqueness hold across packages.** Within a package, owner plus key is unique by
  construction. C8 makes owner names unique across packages, so a brand text is unique repo-wide.

Why: a second contract with the same name is either a copy that will drift, or a different check hiding behind the same brand text. Both are the duplication the gateway stops for outside packages.

How a machine checks it: ward only, because it reads other packages' files. It needs an index, across the repo's own workspace packages, of every exported contract name. This is the same kind of index B4 uses, and they can share it. The lint rule
`enforce-unique-contract-names` names the package that already defines the name.

#### C9: a contract field that holds a gateway type reuses the gateway's schema, branded `#Gateway<Type>`

Some of our objects hold a value of an outside package's type: a work item holding a `ChildProcess`, a scan result holding the `WalkedFile`s that `#gateway/node/fs` returned. The field keeps the gateway's type. Its schema lives in the gateway, beside the type, and carries a brand that names where the value came from: `'#GatewayWalkedFile'`, `'#GatewayChildProcess'`. The contract reuses that schema, as B4 reuses another owner's field.

```ts
// before — a bare custom schema: the type says ChildProcess, the runtime checks nothing
proc: z.custom<ChildProcess>(),

// after — the gateway exports the schema (child_process/child-process/child-process-schema.ts, fs/walk-files-sync/walked-file-schema.ts)
export const childProcessSchema = z.instanceof(ChildProcess).brand<'#GatewayChildProcess'>();
export const walkedFileSchema = z.custom<WalkedFile>((v) => isWalkedFile(v)).brand<'#GatewayWalkedFile'>();

// our contract reuses it
import {childProcessSchema} from '#gateway/node/child_process';
import {walkedFileSchema} from '#gateway/node/fs';

export const scanContract = z
        .object({
          id: z.string().brand<'ScanId'>(),
          proc: childProcessSchema,              // ChildProcess & brand '#GatewayChildProcess'
          files: z.array(walkedFileSchema),      // WalkedFile & brand '#GatewayWalkedFile'
        })
        .brand<'Scan'>();
```

```
// flagged — in contracts/
proc: z.custom<ChildProcess>(),                         // checks nothing at runtime, in zod v3 and v4 alike
proc: z.instanceof(ChildProcess),                       // a second check for a type the gateway owns
walked: z.custom<WalkedFile>(isWalkedFile).brand<'#GatewayWalkedFile'>(),   // a copy of the gateway's schema

// left alone
proc: childProcessSchema,
files: z.array(walkedFileSchema).default([]),
```

Ins and outs, measured on 2026-09-26 against zod 3.25.76 and its `zod/v4` build (`tmp/zod-lib-field/`):

- **A bare `z.custom<T>()` is a cast, not a
  check.** It infers `T` and makes the field required in the type. At runtime it accepts a missing field and any junk, in v3 and in v4. v4 did not fix it.
  `z.instanceof(Class)` and `z.custom<T>(check)` both reject a missing field and junk.
- **A class and plain data take the same shape.** A class such as `ChildProcess` or Playwright's `Page`
  uses `z.instanceof`. Plain data such as `WalkedFile` uses `z.custom` with a check. Either way, the schema lives in the gateway.
- **The parse keeps the value
  itself.** `parsed.proc === proc` is `true`. Methods and getters survive, such as `stats.mtime` and `proc.kill()`, and `.extend()` keeps the field.
- **The brand is shared on purpose.** Every contract that holds a `WalkedFile` carries
  `'#GatewayWalkedFile'`, whatever key it sits under, so one brand text always means the gateway's one check. The text is `#Gateway` plus the type's name, derived, not chosen. No text B3 derives starts with `#`, so the two families never collide.
- **A plain value needs a parse to get
  in.** A `WalkedFile` straight from a gateway call does not fit the branded field. Spreading one into a `Scan` without a parse fails to compile. The caller parses it: `scanContract.parse({ …, files })`, or `walkedFileSchema.parse(file)` for one value.
- **Reading costs
  nothing.** `scan.files[0].path` works, and a branded `WalkedFile` passes into any function that takes a `WalkedFile`.
- **Test values come from the gateway's
  stubs.** A gateway stub for a type with a schema returns the branded value, built through that schema: `WalkedFileStub()`, `ChildProcessStub()` (C5).
  `StubArgument` leaves a `#Gateway`-branded field exactly as it is: no recursion into its members and no brand stripping. So a test writes `ScanStub({ proc: ChildProcessStub() })`, and a partial fake such as `{ pid: 5 }` fails to compile. Stripping the brand was tried and fails for classes: TypeScript's
  `Omit` rebuilds the type and breaks methods that return `this`, such as `addListener`.
- **A shape mixing our data and a gateway object is still one
  contract.** B9's "functions attached outside the parse" covers our own functions. A library object with methods goes in the parse, through its gateway schema.

Why: a bare `z.custom<T>()` looks like a check and is not one, the way `ContentText` looked like a brand. Putting the one real check in the gateway, next to the type, gives it one home. The shared brand text makes the compiler refuse any value that skipped it.

How a machine checks it: syntax. In `contracts/`, refuse `z.custom` and `z.instanceof`. A field whose value must be an outside package's type has only one way in: a schema imported from `#gateway`. The gateway's side, that every such schema has a check and derives its brand text, is in the gateway follow-ups, item 26. `StubArgument`'s change is a type-level test in `@dungeonmaster/shared`.

### Returns

#### R1: a function returns what its calls told it, and `void` only when they told it nothing

This keeps the reason for today's ban on `void` returns: a caller must learn what happened. It changes
how that is checked. `void` is refused when the function threw away something a call told it, not everywhere. The same test applies in every function-exporting folder, and in the gateway.

```
// before — 116 of 118 adapterResultContract parses are this literal
export const fsRmIfExistsAdapter = async ({ filePath }: { filePath: string }): Promise<AdapterResult> => {
  try { await rm(filePath); } catch (error) { if (!isNotFoundError(error)) throw error; }
  return adapterResultContract.parse({ success: true });   // was the file there? the caller cannot tell
};

// after — a gateway wrapper returns what the handling learned. One fact, so a plain boolean
// packages/@gateway/node/src/fs__promises/rm-if-exists/rm-if-exists.ts
export const rmIfExists = async ({ filePath }: { filePath: string }): Promise<boolean> => {
  try { await rm(filePath); return true; }
  catch (error) { if (isFsError(error) && error.code === 'ENOENT') return false; throw error; }
};
```

```
// flagged — mkdir reported the first directory it created, and the wrapper threw that away
export const ensureDir = async ({ dirPath }: { dirPath: string }): Promise<void> => {
  await mkdir(dirPath, { recursive: true });
};
// flagged — rmIfExists said whether the file was there, and the broker threw that away
export const questCleanupBroker = async ({ filePath }: { filePath: string }): Promise<void> => {
  await rmIfExists({ filePath });
};
// flagged — a return that can hold only one value says nothing, so it counts as void
): Promise<{ success: true }> => …

// left alone — mkdir's own answer, passed on
export const ensureDir = async ({ dirPath }: { dirPath: string }): Promise<string | undefined> =>
  mkdir(dirPath, { recursive: true });
// left alone — writeFile and rename both return Promise<void>, so there is nothing to report
export const writeFileAtomic = async ({ filePath, contents }: { filePath: string; contents: string }): Promise<void> => {
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
- **Which calls
  count:** calls to a gateway export or a broker whose result the function discards. Inside the gateway, calls to the outside package count too. Built-in methods such as `array.push`
  or `map.set` do not count.
- **Tests change with
  it.** 87 adapter tests assert the literal `{ success: true }` today. Each test that survives the gateway migration asserts what the function now returns, such as
  `resolves.toBeUndefined()` for a `mkdir` that created nothing.
- **R1 sets a floor, not a ceiling.** A broker may return more than its calls told it, such as the
  updated quest.

Why: the old rule had the right goal and no way to check it, so models met it with a constant. R1
checks the goal itself: nothing a call reported is hidden.

How a machine checks it: needs the type checker, so it runs in ward only. Today's
`enforce-folder-return-types` runs in the pre-edit hook, so a wrong `void` moves from being caught at the edit to being caught by ward. For a function returning `void`, find each discarded call to a gateway export, an outside function or a broker, and require its return type to be `void`. A
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
- **Recorded
  failure**: an error the real library produced, with the fields it really carries, such as Node's `code`, `errno`, `syscall` and `path`. Its stub lives in the gateway (C5), makes the failing call for real where it can, and holds a copy captured once where it cannot ("What dungeonmaster ships for tests, what the gateway holds, and how models find it").
- **Way
  out**: anything code in a test can use to reach the world outside the process, such as a file, a process, a socket or an HTTP request. T8 lists them.

"Wrapper" and "pass-through export" are defined under "The rules".

#### T1: a proxy mocks the gateway export its file calls

The proxy of the file that calls a gateway export mocks it. A wrapper's proxy sits beside it in the gateway, and the caller's proxy imports it from that file and composes it. Inside the gateway, a wrapper's own proxy mocks the outside package directly. This is the gateway doc's "Test files follow the same rule".

```
// before — the broker called a pass-through adapter, so the broker's proxy composed the adapter's proxy
// brokers/quest/archive/quest-archive-broker.proxy.ts
const rename = fsRenameAdapterProxy();
rename.succeeds({ from, to });

// after — the broker calls the gateway's rename, so its proxy composes the gateway's renameProxy
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
const rename = renameProxy();
rename.renames({ from, to });
```

```
// left alone
packages/@gateway/node/src/fs__promises/rename/rename.proxy.ts:   registerMock({ fn: rename })   // from 'fs/promises': the wrapper calls it
brokers/quest/archive/…-broker.proxy.ts:                  renameProxy()                  // the broker calls the wrapper
```

Ins and outs:

- **Functions a proxy does not name stay trapped.** The hoister writes each module mock as
  `globalThis.__ioTrap?.(m) ?? jest.requireActual(m)` plus the named mocks (`typescript-mock-calls-to-statements-adapter.ts:91-94`). A gateway wrapper a proxy does not name runs its real code, which calls the outside module, which the trap catches.
- **`enforce-proxy-child-creation` asks for a wrapper's proxy, and for nothing else from a package.**
  For a relative import it asks for the matching `.proxy`. For a `#gateway` import it asks for
  `<export>Proxy` only when a `.proxy` file sits beside that export, which only a wrapper has. A pass-through such as `z`, `join` or `statSync` asks for none; the trap catches a raw call that does I/O and nothing staged. The gateway build added this; its test is `rule-enforce-proxy-child-creation-broker.test.ts`.
- **A library that cannot load under Jest at all,** because it needs a canvas, a GPU or ESM, is replaced through Jest's `moduleNameMapper`, as web already does for `elkjs`. The mapper maps both the bare name and `#gateway/npm/<name>` (`packages/web/jest.config.cjs` in the gateway worktree).
- **A host library is not mocked.** ESLint runs through `RuleTester`, React through testing-library, and
  AST nodes come from the real parser (C5).

Why: the proxy of the file that makes a call is the one place that knows which call a test needs. A wrapper's proxy carries the scenarios for its handling, so a caller that composes it tests against the wrapper's real behaviour instead of re-staging the outside module.

How a machine checks it: syntax. `enforce-proxy-child-creation` requires a file's proxy to create
`<export>Proxy` for each wrapper the file imports, found as the `.proxy` file beside the wrapper. At run time the I/O trap fails a test whose call nothing staged (T2).

#### T2: the I/O trap and MSW decide what a unit test mocks

A call gets a mock when it would leave the process. The I/O trap and MSW catch those calls at run time, and T8 lists every way out they cover. Everything else runs for real. So whether a function is mocked follows from what it does, not from where it is imported.

```
// flagged by the trap at run time — nothing staged the read
const config = await configLoadBroker({ path });   // [io-trap] unstaged fs/promises.readFile("/…/config.json")

// left alone — pure functions run for real, in the implementation and in the proxy
brokers/x/x-broker.ts:          const configPath = join(root, 'config.json');   // join from #gateway/node/path
brokers/x/x-broker.proxy.ts:    const expected = join(root, 'config.json');     // computed, not mocked
widgets/x/x-widget.tsx:         const [open, setOpen] = useState(false);       // React never leaves the process
```

Ins and outs:

- **Only wrappers ship
  proxies.** A wrapper's proxy carries named scenarios built on recorded failures (T3). A pass-through that does no I/O, such as `join`, runs real. A pass-through that does I/O, such as `statSync`, is caught by the trap like any other call; the calling file's proxy stages it with
  `registerMock`, with no named scenarios. When a raw export keeps causing bugs, `bannedExports` blocks it and points at a wrapper. A rule keyed on imports alone would demand a React proxy.
- **Every proxy still offers methods for its own
  test.** A broker's proxy names the scenarios its broker's tests need, built from the wrapper proxies it composes.
- **`path` runs real, so the path passthrough proxies
  go.** `packages/testing/CLAUDE.md` describes path adapter proxies that answer `join`, `dirname` and `basename` through `requireActual`. `path` is a pass-through in the gateway, and does no I/O, so nothing replaces them.
- **A test may mock a pass-through to pin its
  value,** such as `randomUUID` from `#gateway/node/crypto`, with `registerMock` in the calling file's proxy. That is allowed, not required. Neither the trap nor MSW sees it, because it does no I/O. A pass-through that does I/O has to be staged the same way.
- **Classes are not trapped
  today.** The trap wraps only lowercase function exports (`jest.setup-io-trap.js:85`), so `new ChildProcess()` in a stub is real and does no I/O. T8 names the constructors and methods that do leave the process, and how to cover them.

How a machine checks it: at run time. The trap and MSW fail the test. `enforce-proxy-child-creation`
asks for a wrapper's proxy (T1), never for a pass-through's.

#### T3: named scenarios live on gateway wrapper proxies and on a workspace package's own proxies

A wrapper's proxy stages the outside function with recorded failures and names each scenario, such as
`fileMissing`. The name says what the wrapper's handling decides. So a proxy that other proxies compose for its scenarios exists only where handling exists: beside a gateway wrapper, or beside a workspace package's entry point. A broker's proxy composes the wrapper's proxy and calls its scenarios. A workspace package ships the proxy for its own API beside that API, and its own tests check each scenario against its real code (T6).

Recorded-failure stubs sit beside the module whose failure they record (C5).

```
// before — each test invents the failure; the raw call is staged under a composed but unused adapter proxy
// siegelense/src/brokers/instance/kill/instance-kill-broker.proxy.ts:87,191-193
fsReadFileAdapterProxy();
readHandle.calledWith([heartbeatPath])
  .rejects(Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }));

// after — a named scenario on the gateway wrapper's proxy, recorded from real Node
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
const fs = readFileIfExistsProxy();
fs.fileMissing({ filePath: heartbeatPath });

// after — a workspace package's own proxy, with its real failure shape
const orchestrator = startOrchestratorProxy();      // from @dungeonmaster/orchestrator/startup/start-orchestrator.proxy
orchestrator.questNotFound({ questId });             // { success: false, error }, as the real getQuest returns
```

Ins and outs:

- **Scenario names are not shared
  today.** 347 adapter proxies define 359 distinct method names, so each test learns a new vocabulary. Under these rules the scenarios live once, on each wrapper's proxy.
- **A wrapper proxy may address calls loosely and read them
  back.** Matching the end of a pattern, a predicate, or a subset of options, and reading back the calls really made (`getCallsFor`), are allowed. The trial found callers need them (`globProxy`, gateway follow-ups item 28). A default answer to every call is not allowed (T4).
- **The hoister follows every imported `.proxy` file, in workspace and gateway packages
  alike,** so its `registerMock` calls are hoisted. In a consumer repo the packages are read from its root `package.json` `workspaces`, not from a name prefix. The gateway build made the resolver read each package's own `exports` map (`workspacePackageImportResolveMiddleware`).
- **Failure cases move with the
  handling.** When handling moves from a broker into a gateway wrapper, the broker's tests of each failure move to the wrapper's tests, and the broker's tests call the wrapper proxy's scenarios.
- **A proxy that builds a fake library handle does it in one place.** 12 broker and responder proxies
  build their own fake `ChildProcess`, `Socket` or `FSWatcher` to mock a raw `spawn`
  (`tmp/adaptermove-proxies-fake-handles.txt`). Each one uses the gateway's stub instead, such as
  `ChildProcessStub` (C5), so no proxy invents its own shape of a `ChildProcess`.

Why: a scenario name says what a wrapper's handling decides. Written anywhere else, it restates that decision in a proxy that can drift from it, and each test learns a new vocabulary.

How a machine checks it: syntax. `enforce-proxy-child-creation` requires a caller's proxy to compose each wrapper's proxy (T1), and also refuses a `registerMock({ fn })` of a gateway wrapper in any proxy outside the gateway, so the wrapper's proxy is the only way to stage it. `raw-import-ban` stops a proxy importing the outside module raw to re-stage it underneath (T7).

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

Ins and outs:

- **Gateway proxies
  included.** A second call gets staged by name. Loose addressing and call read-back stay (T3). The gateway proxies that break this today are listed in the gateway follow-ups, item 23.
- **A match that can never be false is a catch-all
  too.** `calledWith([() => true])` answers every call, the same as `calledWith([])`.

How a machine checks it: two rules, in every `.proxy.ts` file, gateway ones included:

| Rule                           | Check                                                                                  | Needs                                                                                              | Pre-edit hook? |
|--------------------------------|----------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|----------------|
| `ban-proxy-empty-called-with`  | A `calledWith([])` on a handle from `registerMock({ fn })`, where `fn` takes arguments | Syntax for the empty array; the type checker for `fn`'s signature, which lets `randomUUID` through | No: ward only  |
| `ban-proxy-catch-all-defaults` | A `calledWith` argument that is a function literal returning `true` with no condition  | Syntax                                                                                             | Yes            |

A catch-all hidden behind a helper, such as `calledWith([anyArg()])` where `anyArg` returns
`() => true`, gets past it. The rule's message names the fix, staging each call by its arguments, so a helper that exists only to dodge the rule shows in review. Closing that gap would mean refusing every argument that is not a literal, a variable, or a predicate built from a staged value, which is left for later.

#### T5: no invented failures in a proxy or test

```
// flagged — as the value given to a mock's rejects / throws / a throwing implement
proxy.throws({ filePath, error: new Error('ENOENT') });
handle.calledWith([p]).throws(Object.assign(new Error('x'), { code: 'ENOENT' }));   // still hand-made

// left alone
fs.fileMissing({ path });                                   // a wrapper proxy's scenario, built on a recorded failure
handle.calledWith([p]).rejects(FileMissingErrorStub({ syscall: 'open', path: p }));   // a recorded failure, from #gateway/node/fs__promises/file-missing-error/file-missing-error.stub
orchestrator.questNotFound({ questId });                    // provider-owned scenario
expect(() => run()).toThrow(/^Quest not found$/u);          // asserting what the code under test throws
```

Why: a hand-made failure has the shape the author imagined. Code tested against it learns to catch
everything; code tested against a recorded failure is tested against what Node sends. 179 of the
adapter proxies take a generic `error`, so each test invents its failure. "File not found" is built
without Node's `code` 193 times, and with it 70 times. Of the 92 implementations tested with a code-less
error, 64 catch errors themselves, and 58 of those catch everything, the only shape that passes such a
test.

How a machine checks it: `ban-invented-failures`. Syntax. Its message names the recorded-failure stub to use.

#### T6: no mocking another workspace package's exports

```
// flagged, in server or mcp
registerMock({ fn: StartOrchestrator.getQuest });
registerModuleMock({ module: '@dungeonmaster/orchestrator', factory: () => ({ … }) });

// left alone
const orchestrator = startOrchestratorProxy();   // from @dungeonmaster/orchestrator/startup/start-orchestrator.proxy
const fs = readFileIfExistsProxy();              // a gateway wrapper's proxy, from #gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy
```

Why: a consumer's copy of another package's behaviour drifts from it. The real `getQuest` reports a
missing quest as `{ success: false }` (`quest-get-broker.ts:77-80`), but consumer tests stage a thrown
error 40 times and `success: false` 4 times, so `quest-pause-responder.ts:40`, the "Quest not found"
branch the real system takes, has no test.

How a machine checks it: `ban-workspace-export-mocks`. The import specifier names one of the repo's own workspace packages, is not a `.proxy` file, and is not the file's own package. The package names come from the root `package.json` `workspaces`, so the rule works unchanged in a consumer repo. `eslint.config.js` reads them once when it loads and passes them as a rule option, so the rule reads no file and runs in the pre-edit hook. In this repo they happen to share the `@dungeonmaster/` prefix; the rule does not rely on it.

#### T7: test support files import through the gateway too

Tests, proxies, stubs and harnesses import outside packages through the gateway, like production code. The gateway doc decides this ("Test files follow the same rule"); it is restated here because the test rules above lean on it. Test support files still do what production code does not: they call
`registerMock`, build fixtures and, in integration tests, do real I/O.

```
// flagged — in test support files
mcp/test/harnesses/mcp-server/mcp-server.harness.ts:   import { spawn } from 'child_process';
brokers/x/x-broker.proxy.ts:                           import { PNG } from 'pngjs';

// left alone
mcp/test/harnesses/mcp-server/mcp-server.harness.ts:   import { spawnLongLived } from '#gateway/node/child_process';
brokers/x/x-broker.proxy.ts:                           import { PNG } from '#gateway/npm/pngjs';   // builds a fixture
packages/@gateway/node/src/child_process/child-process/child-process.stub.ts:   new ChildProcess()   // inside the gateway (C5)
```

Ins and outs:

- **A harness's own retry loop is its
  business.** `mcp-server.harness.ts` wraps a spawn in a retry and a timeout race (lines 134-189). That stays test infrastructure; only its import changes.
- **Test infrastructure inside a production folder type is still production code.** The testing
  package's `install-testbed-create-broker.ts:190-229` catches `childProcessExecSyncAdapter`'s throw and reads its `stdout`, `stderr` and `status`. Through the gateway it calls `runSync`, which returns the exit code and output instead of throwing (R1).

How a machine checks it: `raw-import-ban` covers test support files the same as production files.

#### T8: every way out of the process is covered by the I/O trap or by MSW

Node and the browser fix the ways out, not the repo. So the list below is the platform's. It is the same in every repo, and a model cannot grow it to get past an error.

Two kinds of cover:

| Cover        | What it does                                                                                                               | Used for                                                               |
|--------------|----------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------|
| The I/O trap | Fails the test on any call nothing staged, even one the code caught                                                        | Ways out with no contract on the other side: files, processes, sockets |
| MSW          | Fails the test on any request or connection no handler took, and checks each staged response against the server's contract | HTTP and WebSocket, where the other side is a server with a contract   |

| Way out                          | Node or browser surface                                       | Cover                                   | State on 2026-09-25                                                                                                                                         |
|----------------------------------|---------------------------------------------------------------|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Files                            | `fs`, `fs/promises`                                           | Trap                                    | Built                                                                                                                                                       |
| Starting processes               | `child_process`                                               | Trap                                    | Built                                                                                                                                                       |
| Signalling another process       | `process.kill`                                                | Trap                                    | Not covered                                                                                                                                                 |
| Outgoing HTTP                    | `http`, `https`, and the globals `fetch` and `XMLHttpRequest` | MSW                                     | Loaded only in `web` and `testing`                                                                                                                          |
| HTTP/2                           | `http2`                                                       | Trap                                    | Not covered                                                                                                                                                 |
| Outgoing WebSocket               | the global `WebSocket`                                        | MSW's `ws` API                          | Not set up                                                                                                                                                  |
| Raw sockets, opening a port, DNS | `net`, `tls`, `dgram`, `dns`, `dns/promises`                  | Trap                                    | Not covered                                                                                                                                                 |
| Code in another thread           | `worker_threads`                                              | Trap, on the `Worker` constructor       | Not covered                                                                                                                                                 |
| Native code                      | a package's compiled `.node` addon                            | None: its calls happen below JavaScript | No workspace package imports one. The installed addons belong to build tools (`rollup`, the import resolver) and to `node-pty`, which nothing here imports. |

```
// flagged at run time
await fetch('https://api.example.com/x');        // [msw] no handler took GET https://api.example.com/x
new WebSocket('ws://localhost:4000/stream');      // [msw] no handler took the connection
process.kill(pid, 'SIGTERM');                     // [io-trap] unstaged process.kill(1234)

// left alone
const endpoint = questGetEndpoint.returns({ quest });          // a contract-checked handler (see below)
registerSpyOn({ object: process, method: 'kill' }).calledWith([pid, 'SIGTERM']).returns(true);   // staged in the calling file's proxy (T2)
```

Ins and outs:

- **The trap covers what goes through Jest's module registry. MSW covers the globals.** Node's global
  `fetch` and `WebSocket` reach the real `net` module from inside Node itself, where Jest's mocks never reach. So trapping `net` cannot catch them, and MSW is their only cover.
- **The trap wraps module functions, so constructors and methods get past
  it.** It wraps lowercase function exports only (`jest.setup-io-trap.js:85`). `new Worker(…)`, `new net.Socket().connect(…)`,
  `server.listen(…)` and `process.kill(…)` all leave the process without calling one. Covering them means wrapping `process.kill`, the `Worker` constructor, and the `connect` and `listen` methods on the socket and server prototypes.
- **Some functions in the network modules do no
  I/O,** such as `net.isIP`. The trap passes them by name, as it already passes fixture reads by name (`READ_ONLY_FUNCTIONS`, `jest.setup-io-trap.js:38`). That list names Node's API, so it changes only when Node's does.
- **MSW loads for every package, from the root Jest base config.** Today only
  `packages/web/jest.config.cjs:30` and `packages/testing/jest.config.js:11` load
  `start-endpoint-mock-setup.ts`. In every other package, a `fetch` in a unit test reaches the network. MSW ships as ESM, and server's Jest does not transform it (see the gotchas under "The unit-test I/O trap"; `packages/hydration-recipes/jest.config.js:10` notes the same). That transform comes first.
- **An unhandled request fails the test even when the code catches it.** `onUnhandledRequest: 'error'`
  (`endpoint-mock-setup-responder.ts:17`) only makes the request fail, and code that catches every error swallows that. The setup records each unhandled request and fails the test in `afterEach`, as the trap does. MSW accepts a function as its `onUnhandledRequest` option, and the recording goes there. The network recorder's `afterEach` does not do this today. It only writes the requests it saw to stderr and never fails the test (`network-record-lifecycle-responder.ts`, checked on 2026-09-25).
- **An unhandled WebSocket connection goes out for real today.** In the installed msw 2.12.10, when no
  `ws` handler is registered, MSW reports the connection as unhandled and then connects it to the real server anyway (`node_modules/msw/lib/core/ws/handleWebSocketEvent.mjs:24-37`). The `error` strategy only adds an error event on the client socket. When any `ws` handler is registered, MSW gives every connection to the handlers instead (lines 8-16). So the base setup registers a `ws` handler that fails any connection no test's handler took.
- **Handlers are checked against the server's
  contracts.** A staged response is parsed through the server's contract for that endpoint, so a test cannot stage a response the real server could never send. This is T6 applied to HTTP: the package that serves the API ships its handlers beside its endpoints, and client tests import them from those files. In any repo, the package that serves each endpoint does this. Dungeonmaster ships the mechanism: a function that builds a handler from an endpoint's contract.
- **Native code has no
  cover.** An addon does its I/O below JavaScript, where neither the trap nor MSW can see. A unit test that reaches one needs it mocked by hand, and nothing enforces that.

How a machine checks it: at run time, by the trap and MSW. Neither needs a lint rule.

#### What dungeonmaster ships for tests, what the gateway holds, and how models find it

`@dungeonmaster/testing` ships the cover and the mocking API. The test data for outside packages lives in the gateway: each wrapper's proxy and each module's stubs, beside the code they belong to (T3, C5). A consumer repo's gateway is its own, scaffolded by `dungeonmaster init`, and a module added to it copies dungeonmaster's wrapper, proxy and stubs rather than importing them. Where a consumer's agent copies that source from is not decided: an installed gateway package ships only `dist` (gateway follow-ups, item 35).

| Piece                     | Where it lives                                       | What it is                                                                                                                  | Examples                                                                                                                              |
|---------------------------|------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| The I/O trap              | `@dungeonmaster/testing`                             | Fails a unit test on any trapped call nothing staged (T8)                                                                   | `jest.setup-io-trap.js`, loaded by every package's Jest setup                                                                         |
| The MSW setup             | `@dungeonmaster/testing`                             | Fails a unit test on any HTTP request or WebSocket connection no handler took (T8)                                          | `start-endpoint-mock-setup.ts`, loaded from the root Jest base config                                                                 |
| Contract-checked handlers | `@dungeonmaster/testing`                             | A function that builds an MSW handler from an endpoint's contract and parses each staged response through it                | The package that serves each endpoint supplies its contract                                                                           |
| The mocking API           | `@dungeonmaster/testing`                             | `registerMock`, `registerSpyOn` and the proxy-mock hoister                                                                  | `@dungeonmaster/testing/register-mock`                                                                                                |
| The home sandbox          | `@dungeonmaster/testing`                             | Points `HOME` and git's config at a temp directory for every test and every process a test spawns ("The Jest home sandbox") | `jest.setup-global.js` and `jest.setup-global-teardown.js`, set as `globalSetup` and `globalTeardown` in the shipped Jest base config |
| Wrapper proxies           | beside each gateway wrapper                          | Named scenarios over each wrapper, built on recorded failures (T3)                                                          | `readFileIfExistsProxy`, `globProxy`, `currentBranchProxy`                                                                            |
| Recorded-failure stubs    | beside the gateway module whose failure each records | Real errors with the platform's real fields (C5, T5)                                                                        | `FileMissingErrorStub`, and stubs for `ECONNREFUSED`, `EADDRINUSE`, `ENOTFOUND` and `ESRCH`                                           |
| Library stubs             | beside the gateway type each builds                  | Values of the package's own types, built by the package where it can (C5)                                                   | `ChildProcessStub`, `StatsStub`, `CallExpressionStub`, `RuleContextStub`                                                              |

Inside this repo, each workspace package also ships a proxy for its own API, beside that API (T6). A consumer's packages do the same for their own APIs.

A recorded-failure stub makes the failing call for real where it can, such as reading a path that cannot exist. The trap lets `.stub` files do real I/O, so the error always matches the installed Node. A failure that cannot be triggered offline, such as a DNS miss, is a copy captured once.

The `@dungeonmaster/testing` pieces live in a consumer's `node_modules`, which the search tools a model uses do not index. The gateway's pieces live in the consumer's own `packages/@gateway/`, which they do index. Both reach a model through these channels:

| Channel                                   | When the model sees it                                          | What it carries                                                                                    |
|-------------------------------------------|-----------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| The trap's and MSW's failure message (T8) | when a unit test makes a call nothing staged                    | the call, and what to stage it with: the wrapper's proxy in the calling file's proxy, or a handler |
| The lint error (T5)                       | when it writes a hand-made failure                              | the recorded-failure stub to use instead                                                           |
| `enforce-proxy-child-creation` (T1)       | when a proxy leaves out a wrapper its file calls                | the wrapper proxy's name and the file it sits in                                                   |
| `get-testing-patterns`                    | at session start                                                | a catalog of the test infrastructure: name, purpose, import path                                   |
| A session snippet                         | every session start, in every repo `dungeonmaster init` touched | a pointer to the catalog                                                                           |

The catalog is generated from the `@dungeonmaster/testing` entry points and every `.proxy` and
`.stub` file, with each file's PURPOSE header, and the lint messages read the same list, so neither can drift from the code.

#### The Jest home sandbox: what a test sees when code calls `os` or `git`

No lint rule exists to isolate tests from the real home (see `ban-bare-os-home-tmp` under "Existing rules that change"). Jest points the home directory somewhere safe before any test runs, so code under test is isolated wherever it reads the home from. Production code still reads the dungeonmaster home through one broker, which checks `DUNGEONMASTER_HOME` before the user's home, and runs git through `#gateway/bin/git`. That is about what production code means by "home", not about tests.

Built on 2026-09-23, before this doc. Today it is written down only in `packages/testing/CLAUDE.md:90-107`
and `packages/server/CLAUDE.md:184-188`. A session reads those only when it works inside those two packages. Nothing served to every session says the sandbox exists, and `get-testing-patterns:623`
lists `os.homedir` among functions to mock.

**How it works.** Three files, all in `packages/testing/src/`:

| File                            | When it runs                                                     | What it does                                                                                                                                                                                                                                                 |
|---------------------------------|------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `jest.setup-global.js`          | Once per run, in Jest's parent process, before any worker starts | Sets `HOME` to `<tmp>/dungeonmaster-jest-sandbox-<pid>`. Writes a `.gitconfig` there with a test identity, `main` as the default branch, and signing off. Sets `XDG_CONFIG_HOME`, `XDG_CACHE_HOME` and `GIT_CONFIG_NOSYSTEM=1`. Removes `CLAUDE_CONFIG_DIR`. |
| `jest.setup-home.js`            | Once per worker                                                  | Sets `DUNGEONMASTER_HOME` to `<tmp>/dungeonmaster-jest-home-<worker pid>`, holding a `config.json` with no guilds                                                                                                                                            |
| `jest.setup-global-teardown.js` | Once per run, after every worker exits                           | Fails the run if a new directory appeared under the developer's real `~/.claude/projects`, and names it. Deletes the sandbox.                                                                                                                                |

`HOME` has to be set in the parent process. Jest gives each test file a copy of `process.env`, so an assignment inside a test never reaches `os.homedir()` or a spawned process.

**What a test sees:**

| Code under test does                                | In a unit test                                               | In an integration test                                                                        |
|-----------------------------------------------------|--------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| Calls `os.homedir()`                                | The sandbox path                                             | The sandbox path                                                                              |
| Reads or writes a file under that path              | The I/O trap fails the test unless the proxy staged the call | Real, inside the sandbox                                                                      |
| Reads `DUNGEONMASTER_HOME`                          | The worker's sandbox home                                    | The worker's sandbox home                                                                     |
| Runs `git` through `spawn` or `execFile`            | The I/O trap fails the test unless the proxy staged the call | Real git, with the sandbox identity and no user or system config                              |
| Spawns another process, such as the fake Claude CLI | The I/O trap fails the test unless staged                    | The child inherits the sandbox `HOME`, so its `~/.claude/projects` writes land in the sandbox |

**What a test author does:** nothing to turn it on. It covers every Jest run. The rules:

1. Do not mock `os.homedir()` for isolation. It already returns the sandbox. Mock it only to pin a value (T2).
2. A proxy that needs an expected path under the home calls the real `homedir()`, as it calls `join`.
3. The sandbox `HOME` is one directory for the whole run, shared by every worker. Never assume it is empty. Write under a directory the test owns, such as a testbed from `installTestbedCreateBroker`.
4. To give a spawned process a different home, pass it in that spawn's options:
   `env: { ...process.env, HOME: dir }`. Assigning `process.env.HOME` inside a test does nothing.
5. A test that changes `DUNGEONMASTER_HOME` restores it and never deletes it (see the gotchas under
   "The unit-test I/O trap").

Playwright e2e runs use their own mechanism: the Playwright config points `HOME` and
`DUNGEONMASTER_HOME` at `/tmp/dm-e2e-<pid>` (`packages/testing/CLAUDE.md:76-85`).

**Consumers do not get it
today.** `packages/testing/jest-config-base.js`, the base config a consumer spreads, sets no `globalSetup` or `globalTeardown`. So a consumer's tests run in the developer's real home. It gains both, pointing at `jest.setup-global.js` and `jest.setup-global-teardown.js`.
`jest.setup-home.js` stays this repo's own: `DUNGEONMASTER_HOME` is dungeonmaster's data directory, and a consumer's code never reads it.

### Folders

#### D1: JSX appears only in `widgets/` and `flows/`

There are no per-folder npm allowlists. Every folder imports any `#gateway` subpath (the gateway build added that to `enforce-import-dependencies`). What was left of the allowlists' job, keeping React components out of the wrong folders, becomes one structural rule.

```text
// before — widgets may not import @xyflow/react, so React components live in adapters
web/src/adapters/xyflow/react-flow/xyflow-react-flow-adapter.ts   a React component, filed as an adapter
web/src/adapters/testing-library/…                                4 test helpers with no production user
web/src/adapters/mantine/render/mantine-render-adapter.ts

// after
web/src/widgets/react-flow/react-flow-widget.tsx                  the xyflow component is a widget, importing #gateway/npm/xyflow__react
#gateway/npm/testing-library__react                               the testing-library helpers. Its `render` wraps MantineProvider today, which gateway follow-ups item 15 flags as one app's choice inside a shared wrapper
```

Why: folder allowlists push code into the wrong home. In web, 26 of 38 adapter proxies are empty,
because the "adapters" there are components and test helpers, not outside calls.

How a machine checks it: syntax. A `JSXElement` or `JSXFragment` in a file outside `widgets/` and
`flows/` is refused. The rules about which of our folders may import which stay as they are.

## The unit-test I/O trap (committed in `fe456add9`)

A setup file in `@dungeonmaster/testing`, loaded by every package's Jest config, traps `fs`,
`fs/promises` and `child_process` in every unit test. A call nothing staged fails the test and names
itself, even when the code under test catches the error, because every trapped call is recorded and checked after the test. T8 lists the ways out it does not cover yet, and which of them MSW covers instead.

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

Committed on `master` as `fe456add9` on 2026-09-25. Three checks back it:

1. A full `npm run ward` passed with the code changes (run `1790294805205-6478`: lint, typecheck, unit 3,757 files, integration 182, e2e 133).
2. The edits made after that run were comments only. `npm run ward -- --uncommitted` passed on them (run `1790404418094-caa0`: lint, typecheck, unit and integration in the five touched packages).
3. A worktree run of the old `fs-exists-sync-adapter.test.ts` proves the trap fires. That old version checks real files, and all four of its tests failed with `[io-trap] unstaged fs.existsSync(…)`. The recorder added its own "Test did real I/O that nothing staged" failure to each one.

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
| `jest.config.base.js`, `packages/testing/src/jest.setup-home.js`                                                                                                                                                                                                      | Comments that gave the import-time bootstraps as the reason `jest.setup-home.js` runs before a test file's imports, reworded to the present reason.                                                                                            |

This work was built under today's rules, so part of it is the shape these rules remove. The new server and mcp `orchestrator-bootstrap` adapters only forward to `StartOrchestrator.bootstrap()`, and the gateway migration deletes every forwarder (`scrolls/adapters-to-one-place.md`, "The direction", item 8). `bootstrap()` returns `{ success: true }`, which R1 counts as `void`. Once both land, the bootstrap responders call `StartOrchestrator.bootstrap()` directly, and `bootstrap()` may return `void`.

Outside git: `packages/orchestrator/dist/` was rebuilt so server and mcp typecheck the new `bootstrap()`.

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
- The adapters `get-folder-detail` doc teaches `new Error('ENOENT: …')` with no `code`, the likely origin of the code-less failures. It goes with the `adapters/` folder type, and T5 refuses the shape.

### Holes

The trap wraps `fs`, `fs/promises` and `child_process` (`TRAPPED_MODULES`,
`jest.setup-io-trap.js:25`). These get through it as of `fe456add9`:

| Hole                                     | Where it matters today                                                                                                                                                                                                                          | What a unit test does                                                                                                                                |
|------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `net` sockets and servers                | `orchestrator/…/net-check-port-free-adapter.ts`, `shared/…/net-free-port-pair-adapter.ts`, `siegelense/…/net-unix-request-adapter.ts`, `siegelense/…/net-unix-serve-adapter.ts`                                                                 | Opens a real socket or port                                                                                                                          |
| `fetch` over HTTP                        | The fetch adapters in hooks, hydration, hydration-recipes, orchestrator, shared, siegelense and web                                                                                                                                             | Sends a real request, unless that package's Jest setup loads MSW. Only `web` and `testing` list `start-endpoint-mock-setup.ts` in their Jest config. |
| `process.kill`                           | `orchestrator/…/process-signal-adapter.ts`, `orchestrator/…/proc-check-alive-adapter.ts`, `siegelense/…/process-is-alive-adapter.ts`, `siegelense/…/process-kill-group-adapter.ts`                                                              | Sends a real signal                                                                                                                                  |
| Class exports of the trapped modules     | `trapObject` passes any export whose name starts with a capital letter (`jest.setup-io-trap.js:85`), so `new fs.ReadStream(path)` and `new fs.WriteStream(path)` open real files                                                                | Reads or writes a real file                                                                                                                          |
| A blocked call made after its test ended | The recorder is drained in `afterEach` (`jest.setup-io-trap.js:146`). A timer or late promise that makes a blocked call after its test finished is reported against the next test in the file. After the file's last test it is never reported. | The wrong test fails, or nothing fails                                                                                                               |

The first three are the ways out T8 lists, and the `TRAPPED_MODULES` row in "Today's rules and docs that change" adds them to the trap. The gateway moves those calls into wrappers such as `#gateway/node/net`, `#gateway/node/fetch` and `#gateway/node/process`. A caller's proxy then stages the wrapper, but a gateway wrapper's own unit test still calls the raw module, so the holes matter there.

One effect is not a hole but changes things for consumers. The published `jest-config-base.js`
loads `src/jest.setup.js`, which loads the trap. After the next publish, a consumer repo whose Jest config spreads that base gets the trap too. Its unit tests that touch real files will start failing.

## Today's rules and docs that change

| Where                                                                         | Today                                                                                                                                                                                                                                                       | After                                                                                                                                                                                                                                                                                                        |
|-------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `require-zod-on-primitives`                                                   | Every `z.string()` / `z.number()` needs `.brand()`, and the model picks the text                                                                                                                                                                            | Replaced by `require-object-contract-brands` (B1): every object, nested object and leaf in a contract is branded, the text is derived (B3), and loose values take no brand (B1, B6)                                                                                                                          |
| `zod` dependency                                                              | 3.25, used through the v3 API                                                                                                                                                                                                                               | v4, so a branded object keeps `.shape` (B1)                                                                                                                                                                                                                                                                  |
| `ban-primitives`                                                              | Plain `string` / `number` refused in return types                                                                                                                                                                                                           | Removed: it has nothing left to refuse (B6). See "Lint rules: the work".                                                                                                                                                                                                                                     |
| `contracts-constraints.md:22`                                                 | "All contracts MUST use `.brand<'TypeName'>()` on primitives"                                                                                                                                                                                               | Every leaf of an object contract is branded, inline, with the owner-plus-key text (B1, B2, B3)                                                                                                                                                                                                               |
| `transformers-constraints.md:34-46`                                           | "All transformers MUST validate output using contracts", with `return dateStringContract.parse(formatted);` as the right way and returning `formatted` as "WRONG ... not branded". Lines 137-152 teach `return contentTextContract.parse(config.purpose);`. | A transformer that returns one of our objects builds it through the object's contract parse (B1). A loose string or number is returned plain (B6). Both examples become the "before".                                                                                                                        |
| `responders-constraints.md:150`                                               | "ALL inputs from external sources MUST use `unknown` type and validate through contracts"                                                                                                                                                                   | Unchanged. C4 makes the JSON half of it checkable.                                                                                                                                                                                                                                                           |
| `enforce-folder-return-types`                                                 | Bans `void` and `Promise<void>` returns in function-exporting folders; its message points at `AdapterResult`                                                                                                                                                | Changed by R1. `void` is allowed exactly when every call the function discards returned `void`. A return that can hold only one value counts as `void`. `AdapterResult` goes.                                                                                                                                |
| `dungeonmaster-rule-enforce-on-statics.ts` (`packages/shared/src/statics/`)   | Tags each rule `'pre-edit'` or `'post-edit'`. The pre-edit hook runs the `'pre-edit'` ones. `enforce-folder-return-types` is `'pre-edit'`.                                                                                                                  | Every new rule marked **Yes** in "New rules" is tagged `'pre-edit'`. `enforce-folder-return-types` loses its tag. `ban-primitives` and `require-zod-on-primitives` leave the map. A rule marked **No** gets no `'pre-edit'` tag and runs in ward.                                                            |
| `@typescript-eslint/no-magic-numbers`                                         | On outside tests, stubs and e2e specs. Ignores `-1`, `0`, `1`, default values and enums; `detectObjects: false` skips numbers written as object property values. ESLint's own `no-magic-numbers` is off.                                                    | Unchanged. `detectObjects: false` lets a literal sit in the object handed to a root parse (B1). A loose number passed to a call still needs a name in `statics/`; B6 only drops the brand parse around it.                                                                                                   |
| No magic-strings rule                                                         | String literals are not linted. Today many are wrapped in a brand parse, such as `pathSegmentContract.parse('package.json')`.                                                                                                                               | Unchanged. Under B6 those become plain literals, and no rule moves them to statics.                                                                                                                                                                                                                          |
| `enforce-magic-arrays`                                                        | Refuses an inline array whose elements are all string or number literals, outside statics, tests, stubs and proxies                                                                                                                                         | Unchanged. Wrapping each element in a brand parse hides an array from it today; one case exists (`tsconfig-discover-patterns-transformer.ts:17`, `[globPatternContract.parse('node_modules'), globPatternContract.parse('dist')]`). B6 removes the wrapping, so the rule catches it and moves it to statics. |
| `enforce-regex-usage`                                                         | Regex literals only in `contracts/`, `guards/` and `transformers/`                                                                                                                                                                                          | `statics/` allows regex too (`allowRegex: true` in `folder-config-statics.ts`), so a shared pattern can live there (B2)                                                                                                                                                                                      |
| `folder-config-statics.ts` `allowsLayerFiles`                                 | `true` only for `flows`, `adapters`, `brokers`, `responders` and `widgets`                                                                                                                                                                                  | Also `true` for `contracts`, `transformers`, `statics` and `bindings` (C7). `get-architecture` lists the allowed folders from this flag, so its text follows.                                                                                                                                                |
| Package barrels (`contracts.ts`) and `package.json` exports                   | `contracts.ts` exports stubs beside contracts: 232 in shared. Proxies export from `/testing`.                                                                                                                                                               | No barrel exports a stub or a proxy, and every `/testing` entry point is deleted. A test imports each stub and proxy from its own file. Only test, proxy, harness and stub files may import them. The stub files stay beside their contracts (C6).                                                           |
| `packages/testing/jest-config-base.js`, the Jest base config consumers spread | Loads `jest.setup.js` only. No home sandbox, so a consumer's tests run in the developer's real home.                                                                                                                                                        | Sets `globalSetup` and `globalTeardown` to `jest.setup-global.js` and `jest.setup-global-teardown.js` ("The Jest home sandbox")                                                                                                                                                                              |
| `enforce-implementation-colocation`                                           | Every implementation file needs a colocated test, statics included. All 324 statics files have one, and 178 of those tests are a single `toStrictEqual` that restates the whole object.                                                                     | A statics file needs a test only when it holds a regex                                                                                                                                                                                                                                                       |
| `folder-config-statics.ts` `allowedImports`                                   | Only `adapters/` may import `node_modules`; `contracts/` gets only zod                                                                                                                                                                                      | No folder imports an outside package directly, type or value; every folder imports any `#gateway` subpath (`raw-import-ban`, and the gateway sentinel in `enforce-import-dependencies`). Library stubs live in the gateway (C5).                                                                             |
| `forbid-type-reexport`                                                        | Refuses re-exporting an imported type through an export specifier, outside `index.ts`                                                                                                                                                                       | Unchanged. It sits beside C2's refusal of aliases that give a library type a second name.                                                                                                                                                                                                                    |
| `ban-adhoc-types`                                                             | "Define types in contracts/ and import them"; refuses `interface` and `as { … }` only; `adapters/`, `contracts/` and `widgets/` exempt                                                                                                                      | Extended by B9 to `type` aliases and return types built from an object literal that can leave a function; the gateway's lint block omits it; the message says "our types" (C2)                                                                                                                               |
| `architecture-overview-broker.ts:274`                                         | Prose: "take it as `User['id']`"                                                                                                                                                                                                                            | Enforced by B4                                                                                                                                                                                                                                                                                               |
| `ban-flattened-contract-params`                                               | Allows one indexed property per block                                                                                                                                                                                                                       | Unchanged. It still stops a block taking several fields off one owner.                                                                                                                                                                                                                                       |
| `eslint-plugin/src/brokers/rule/CLAUDE.md`                                    | "Use the shared Tsestree contract"                                                                                                                                                                                                                          | Use `TSESTree` from `#gateway/npm/typescript-eslint__utils`, and the gateway's node stubs from their own files (C2, C5)                                                                                                                                                                                      |
| `jest.setup-io-trap.js` `TRAPPED_MODULES` and its failure message             | Traps `fs`, `fs/promises` and `child_process`. The message says "Stage it through a proxy, or move the test to an integration test".                                                                                                                        | Also traps `net`, `tls`, `dgram`, `dns`, `dns/promises`, `http2` and `process.kill`, the `Worker` constructor, and the socket and server `connect` and `listen` methods. The message names `registerMock` in the calling file's proxy, and the recorded-failure stubs (T2, T8).                              |
| `jest.config.base.js`                                                         | Loads the home sandbox and `jest.setup.js`. MSW loads only where a package adds `start-endpoint-mock-setup.ts` itself: `web` and `testing`.                                                                                                                 | Also loads `start-endpoint-mock-setup.ts`, once every package's Jest transforms MSW's ESM (T8).                                                                                                                                                                                                              |
| `endpoint-mock-setup-responder.ts:17`                                         | `onUnhandledRequest: 'error'`, which code that catches every error swallows. No `ws` handler is registered, so an unhandled WebSocket connection goes out for real.                                                                                         | Records each unhandled request and fails the test in `afterEach`. Registers a `ws` handler that fails any connection no test's handler took (T8).                                                                                                                                                            |
| Proxies for Node and npm functions                                            | One adapter proxy per wrapped function, in each package that wraps it                                                                                                                                                                                       | A gateway wrapper's proxy and its module's stubs sit beside it, and callers import them from those files. A pass-through gets no proxy. The calling file's proxy composes the wrapper's proxy (T1, T2, T3, C5).                                                                                              |
| `StubArgument` (`packages/shared/src/@types/stub-argument.type.ts`)           | Recurses into every object field, making each member optional, so a class such as `ChildProcess` accepts `{ pid: 5 }`                                                                                                                                       | Leaves a field whose brand starts with `#Gateway` exactly as it is, so a test passes the gateway's stub (C9)                                                                                                                                                                                                 |

## Lint rules: the work

Every existing lint rule was checked against this doc on 2026-09-24: 63 in `eslint-plugin`, 8 in
`local-eslint`, and the typescript-eslint settings. The teaching text that models read was checked too; its changes are in "Architecture, folder-type and testing docs: the work". The audits are in `tmp/lint-audit-1.tsv`, `lint-audit-2.tsv`, `lint-audit-3.tsv`,
`lint-audit-new-rules.tsv` and `teaching-text-audit.tsv`.

### Existing rules that change

Most rules keep their behaviour. These change:

| Rule                                            | Today                                                                                                                                                                                                           | Change                                                                                                                                                                                                                                                                                                                                                                                                                               | Doc rule   | Pre-edit hook?                                                                                                                                                        |
|-------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ban-primitives`                                | Refuses a plain `string` or `number` return (this repo sets `allowPrimitiveReturns: false`). Its message says "If none fits, create a new contract".                                                            | **Remove.** Plain returns are allowed (B6), and plain inputs already were, so it has nothing left to refuse. B4 refuses the parameters that matter, such as `questId: string`. Its message is what mints `ContentText`.                                                                                                                                                                                                              | B6, B4     | Removed. Its `'pre-edit'` entry leaves the statics map.                                                                                                               |
| `require-zod-on-primitives`                     | Every `z.string()` and `z.number()` anywhere needs `.brand()`. Its test asserts that a loose `const schema = z.string()` is invalid (`rule-require-zod-on-primitives-broker.test.ts:47`).                       | **Replaced by `require-object-contract-brands`.** Keeps the brand-in-chain check and the enum skip. Drops the loose `z.string()` case. Adds the object brand, the derived text, the `contracts/` scope and the autofix.                                                                                                                                                                                                              | B1, B2, B3 | Removed. Its replacement is split in two (see "New rules").                                                                                                           |
| `ban-adhoc-types`                               | Refuses `interface` and `as { … }` casts. Skips `contracts/`, `adapters/` and `widgets/`. Misses `type X = { … }` aliases and inline object return types. Message: "Define types in contracts/ and import them" | Extended by B9: also refuses an object type literal in a module-level function's return type, a module-level alias, variable type or type argument, unless every member is a function. Skips `.proxy.ts` files. The gateway's lint block omits it. Message: "Define our types in contracts/ and import them. A library's types are imported through the gateway."                                                                    | B9, C2     | Yes, as today                                                                                                                                                         |
| `enforce-import-dependencies`                   | Treats `import type` like a value import. Its stub allowance keys on the `contracts` folder type (`rule-enforce-import-dependencies-broker.ts:161`, `validate-external-import-layer-broker.ts:93`).             | Refuse an import of a `.stub.ts` or `.proxy.ts` file from a file that is not a test, proxy, harness or stub file. Refuse a barrel that re-exports one. Package imports, type or value, already go through the gateway sentinel the gateway build added.                                                                                                                                                                              | C6         | Yes, as today                                                                                                                                                         |
| `enforce-implementation-colocation`             | Requires a test for every statics file.                                                                                                                                                                         | Require a statics test only when the file holds a regex, which means reading the file's content. Contract-stub pairing is unchanged.                                                                                                                                                                                                                                                                                                 | B2         | No, as today (`'post-edit'`): it checks that sibling files exist, and now reads a statics file's content                                                              |
| `enforce-stub-patterns`                         | Every stub takes `{ ...props }: StubArgument<T> = {}` and calls `contract.parse()` (`rule-enforce-stub-patterns-broker.ts:93-98`)                                                                               | No change for our stubs: every one parses one of our contracts. Library stubs live in the gateway, whose lint block omits this rule (C5).                                                                                                                                                                                                                                                                                            | C5         | Yes, as today                                                                                                                                                         |
| `enforce-contract-usage-in-tests`               | Suggests the stub path `./<name>.stub` beside the contract (line 158, and `contract-path-to-stub-path-transformer.ts:18`). Its message points at `@dungeonmaster/shared/contracts`.                             | Point at the stub's own file. The suggested stub path stays `./<name>.stub`.                                                                                                                                                                                                                                                                                                                                                         | C6         | Yes, as today                                                                                                                                                         |
| `enforce-proxy-child-creation`                  | In the gateway worktree: asks for `<export>Proxy` for a relative import, and for a `#gateway` import that has a proxy                                                                                           | Look for the `.proxy` file beside the imported export, in the gateway and in workspace packages alike. Also refuse a `registerMock({ fn })` of a gateway wrapper in a proxy outside the gateway.                                                                                                                                                                                                                                     | T1, T3, C6 | No, as today (`'post-edit'`): it checks whether a `.proxy` file exists                                                                                                |
| `enforce-stub-usage`                            | Checks `.test.ts` files only (line 38)                                                                                                                                                                          | Also check `.proxy.ts` and `.stub.ts` files. Add C5's check: no object literal cast to a type imported from a package.                                                                                                                                                                                                                                                                                                               | C5         | Yes, as today                                                                                                                                                         |
| `enforce-folder-return-types`                   | Always refuses `void`; its message recommends `AdapterResult` (line 28)                                                                                                                                         | **Rewrite.** Allow `void` exactly when every discarded call returned `void`; a single-value return counts as `void`. Needs the type checker.                                                                                                                                                                                                                                                                                         | R1         | **No. It is `'pre-edit'` today and moves to ward only**, because R1 needs the type checker. A `void` a function should not return is caught by ward, not at the edit. |
| `enforce-regex-usage`                           | Reads `allowRegex` from the folder config                                                                                                                                                                       | No code change. `statics/` gets `allowRegex: true`.                                                                                                                                                                                                                                                                                                                                                                                  | B2         | Yes, as today                                                                                                                                                         |
| `require-validation-on-untyped-property-access` | Catches `JSON.parse(...).field` read before a parse. Exempts every `-adapter.ts` file (line 46).                                                                                                                | Becomes C4: also `response.json()`, a gateway call that returns `unknown`, casts, storing the value, and returning it. Drop the `-adapter.ts` exemption. Skip gateway files, which follow the gateway's own `JSON.parse` rule.                                                                                                                                                                                                       | C4         | Yes, for `JSON.parse` and `.json()`. Its gateway-call check needs the type checker, so it becomes a separate rule (see "New rules").                                  |
| `ban-bare-os-home-tmp` (local-eslint)           | Allows `homedir()` and `tmpdir()` only in `adapters/os/`                                                                                                                                                        | **Remove.** It forced every `homedir()` and `tmpdir()` call through an adapter a proxy could mock, which was the only way to isolate a test from the real home before the Jest home sandbox existed. The sandbox and the I/O trap now isolate every test ("The Jest home sandbox"). `raw-import-ban` already refuses a raw `os` import outside the gateway, and the dungeonmaster home is read by one broker. Decided on 2026-09-25. | Sandbox    | Removed                                                                                                                                                               |
| `no-bare-process-cwd`                           | Imports the `GlobPattern` and `PathSegment` brands                                                                                                                                                              | Those are standalone brands (B2), so the values become plain `string`.                                                                                                                                                                                                                                                                                                                                                               | B2, B6     | Yes, as today                                                                                                                                                         |

**Every rule in both packages also changes mechanically.** Each one imports the copied `Tsestree` and
`EslintContext` types, directly in `eslint-plugin` and through its exports in `local-eslint`. C2 deletes those copies. Each rule then imports `TSESTree` and `TSESLint` from
`#gateway/npm/typescript-eslint__utils`. Each spot where the loose copy let code skip a check that the
real type requires needs fixing, such as reading `node.callee` before narrowing on `node.type`.

### New rules

A rule with a check the pre-edit hook can run and a check it cannot is split into two rules, because the hook picks rules by name ("Where each rule runs", below). The table lists each half.

| Doc rule   | Rule                                                                                                                                                                                 | Built by                                                                                                                                                                         | The check needs                                                                                                                                                                          | Pre-edit hook?                                                                                                       |
|------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| B1, B2, B3 | `require-object-contract-brands`: every row of its table except the two below                                                                                                        | Replacing `require-zod-on-primitives`                                                                                                                                            | Syntax                                                                                                                                                                                   | **Yes**                                                                                                              |
| B1, C7     | `require-object-contract-brands-indexed`: a leaf with no brand, and a layer contract's text                                                                                          | Split from `require-object-contract-brands`                                                                                                                                      | B4's index, to leave alone every key B4 claims; the parent file, to derive a layer's text                                                                                                | **No.** Without the index, the hook would tell a model to brand `questId` as `'SomeQuestId'`, which B4 then refuses. |
| B4         | `enforce-owner-field-reuse`: contract keys in `contracts/`, parameters in every folder, inline copies of an existing contract, and copied enum values                                | New, sharing its index with `require-object-contract-brands-indexed`                                                                                                             | A repo-wide index of object contracts and their keys                                                                                                                                     | **No:** the index reads other files                                                                                  |
| B4         | `ban-join-id-beside-child`: an id held beside its required child                                                                                                                     | Split from `enforce-owner-field-reuse`                                                                                                                                           | Syntax. The child's contract name comes from its import, and the id key is next to it.                                                                                                   | **Yes**                                                                                                              |
| B5, C2     | `ban-type-aliases`: an exported alias of a field (`Quest['id']`), or an alias that gives a library type a second name                                                                | New                                                                                                                                                                              | Syntax                                                                                                                                                                                   | **Yes**                                                                                                              |
| B9         | An object type that can leave a function is a contract                                                                                                                               | Extending `ban-adhoc-types`                                                                                                                                                      | Syntax                                                                                                                                                                                   | **Yes**                                                                                                              |
| B7         | `require-real-owner`                                                                                                                                                                 | New, sharing C1's index                                                                                                                                                          | A repo-wide index                                                                                                                                                                        | **No**, for the same reasons as C1                                                                                   |
| B8         | `ban-id-rebrand`                                                                                                                                                                     | New                                                                                                                                                                              | The type checker                                                                                                                                                                         | **No:** the type checker                                                                                             |
| C1         | `require-contract-parse`                                                                                                                                                             | New                                                                                                                                                                              | A repo-wide index read from the syntax tree                                                                                                                                              | **No.** See "Where each rule runs".                                                                                  |
| C3         | `ban-contract-type-predicates`                                                                                                                                                       | New                                                                                                                                                                              | Syntax: the predicate's type is imported from a `contracts/` path, or is `Owner['key']`. B5 bans every other alias of a field's type, so no brand can reach a predicate by another name. | **Yes**                                                                                                              |
| C4         | Parsed JSON goes straight into a contract                                                                                                                                            | Extending `require-validation-on-untyped-property-access`                                                                                                                        | Syntax                                                                                                                                                                                   | **Yes**                                                                                                              |
| C4         | `require-gateway-unknown-parse`: a gateway call returning `unknown` goes straight into a contract                                                                                    | Split from the rule above                                                                                                                                                        | The type checker, for the gateway function's return type                                                                                                                                 | **No:** the type checker                                                                                             |
| C5         | No outside value built by hand and cast in a test, proxy or stub file; callers use the gateway's stubs                                                                               | Extending `enforce-stub-usage`                                                                                                                                                   | Syntax and type imports                                                                                                                                                                  | **Yes**                                                                                                              |
| C6         | No barrel re-exports a stub or a proxy, and only test support imports one                                                                                                            | Extending `enforce-import-dependencies`                                                                                                                                          | Syntax                                                                                                                                                                                   | **Yes**                                                                                                              |
| C8         | `enforce-unique-contract-names`: a contract name is defined in one workspace package only                                                                                            | New, sharing the index B4 uses                                                                                                                                                   | A repo-wide index of exported contract names                                                                                                                                             | **No:** the index reads other files                                                                                  |
| C9         | `enforce-gateway-schema-fields`: no `z.custom` or `z.instanceof` in `contracts/`; a field of an outside package's type reuses the gateway's schema                                   | New                                                                                                                                                                              | Syntax                                                                                                                                                                                   | **Yes**                                                                                                              |
| C7         | Layer files in four more folder types                                                                                                                                                | Config in `folder-config-statics.ts`, read by `enforce-project-structure`; `enforce-implementation-colocation` applies each folder type's own test and proxy rules to its layers | Syntax, and sibling files for colocation                                                                                                                                                 | **Yes** for `enforce-project-structure`. **No** for `enforce-implementation-colocation`, as today.                   |
| R1         | Returns say what happened                                                                                                                                                            | Rewriting `enforce-folder-return-types`                                                                                                                                          | The type checker                                                                                                                                                                         | **No:** the type checker. It is pre-edit today.                                                                      |
| T4         | `ban-proxy-catch-all-defaults`: no always-true predicate in a proxy constructor                                                                                                      | New                                                                                                                                                                              | Syntax                                                                                                                                                                                   | **Yes**                                                                                                              |
| T4         | `ban-proxy-empty-called-with`: no `calledWith([])` answer in a proxy constructor for a function that takes arguments. Gateway proxies included.                                      | Split from the rule above                                                                                                                                                        | The type checker, for the function's signature                                                                                                                                           | **No:** the type checker                                                                                             |
| T5         | `ban-invented-failures`: no hand-made `Error` given to a mock's `rejects`, `throws` or a throwing `implement` in a proxy or test. Its message names the recorded-failure stub to use | New                                                                                                                                                                              | Syntax                                                                                                                                                                                   | **Yes**                                                                                                              |
| D1         | `ban-jsx-outside-widgets-and-flows`: no JSX outside `widgets/` and `flows/`                                                                                                          | New                                                                                                                                                                              | Syntax                                                                                                                                                                                   | **Yes**                                                                                                              |
| T6         | `ban-workspace-export-mocks`: no `registerMock` of another workspace package's export, and no `registerModuleMock` of another workspace package                                      | New                                                                                                                                                                              | Syntax and imports. The workspace package names come in as a rule option: `eslint.config.js` reads the root `package.json` once, when the config loads.                                  | **Yes**, because the rule itself reads no file                                                                       |

### Where each rule runs

Lint runs in two places, and the doc marks every rule above with the one it can use.

| Where                                            | What it lints                                                                                                                                                                                                                                                          | When                                                                  |
|--------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| The pre-edit hook, `dungeonmaster-pre-edit-lint` | The proposed text of the one file being written, in memory, before it reaches disk (`eslint-lint-run-targeted-broker.ts`, through `lintText`). It lints the old text and the new text, and blocks only on violations the edit adds (`violations-check-new-broker.ts`). | On every Write, Edit or MultiEdit, as a Claude Code `PreToolUse` hook |
| Ward                                             | Every file in scope, with every rule                                                                                                                                                                                                                                   | On `npm run ward`                                                     |

The hook runs only the rules tagged `'pre-edit'` in `dungeonmaster-rule-enforce-on-statics.ts`
(`packages/shared/src/statics/`). It picks rules by name, which is why a rule with checks on both sides of the line is split into two.

A rule can run pre-edit only when all three hold:

1. **It reads only the file being
   edited.** That file's new text is not on disk yet, and every other file is as it was before the edit. The statics file's header says it: "Pre-edit rules must not use file system operations". A value the config computes when it loads is fine. `eslint.config.js` is evaluated on each run, so a rule option such as T6's list of workspace packages costs no rule a file read.
2. **It needs no type
   checker.** `eslint.config.js` sets `parserOptions.project: true`, but the hook drops the project and lints again whenever the parser reports a project error. It also runs as a new process on every edit, so it would build the TypeScript program from nothing each time. No
   `@dungeonmaster` rule uses the type checker today.
3. **The file being edited can fix the
   violation.** The hook blocks the edit. A violation that only a change in another file can clear would block every edit to this file until that other change lands.

C1 fails all three, which is why it is the clearest case:

- It needs every `.parse(` call in the repo's production code, so it reads other files.
- A contract is flagged for what other files do not contain. The fix is a parse in some other file, so the hook would block the contract's own creation, since no caller can exist before the contract does.
- Deleting the last caller of a contract happens in another file, and lints only that file. So the contract that just lost its last parse is not linted at all. Only a full ward run, not one scoped to the changed files, catches it.

B7 and C8 fail for the same reasons. B4 and the indexed brand checks fail the first test only, and the fix sits in the file being edited. So they could run pre-edit if their index came in through the config the way T6's package names do. That means reading every contract in the package and its dependencies on each edit. Its cost is not measured, so they run in ward (open decision 8).

Two things about the hooks as installed today:

- **The post-edit hook is built but never
  installed.** `dungeonmaster-post-edit-lint` lints the written file with every rule and fixes what it can (`violations-fix-and-report-broker.ts`), but
  `dungeonmaster-hooks-creator-transformer.ts` registers only `AskUserQuestion` under `PostToolUse`. So the five rules tagged `'post-edit'` run only in ward, like every other rule not tagged
  `'pre-edit'`.
- **This repo's pre-edit hook is switched off.** Commit `c26c6af62` set `PreToolUse` to `[]` in
  `.claude/settings.json`. That file is generated, so the next `dungeonmaster init` puts the hook back.

## Architecture, folder-type and testing docs: the work

Models learn these rules from text that the MCP tools and the session hooks serve, not only from lint. The audit on 2026-09-24 found 23 sentences in 10 sources that contradict this doc. The rows for T1, T2, T5 and T8 were added on 2026-09-25. So was every row after the `packages/testing/CLAUDE.md:23`
row, found on a second read the same day that also checked the text `get-architecture` and
`get-testing-patterns` serve. Each must change with its rule, or the text keeps teaching the old rule while the lint refuses it. The rows on today's decisions (the gateway, stubs and proxies out of barrels, C9, R1, T4, T7) were added on 2026-09-26 from a scan of the same sources.

The tables are grouped by the tool that serves the text. A row's "Doc rule" names the rule in this doc, or "Gateway" for a change the gateway migration makes (`scrolls/adapters-to-one-place.md`, "Defaults", item 10, step 6). Both kinds are listed here, so every change to one source is in one place.

### Architecture docs: `get-architecture` and the session snippets

| Where                                                                                                                                | Says today                                                                                                                      | Change to                                                                                                                                                                      | Doc rule        |
|--------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|
| `shared/src/statics/session-snippet/session-snippet-statics.ts:104`, in every session in every repo                                  | "Returns must be branded Zod contracts — inputs MAY take a raw `string`. The asymmetry is deliberate"                           | "Every object contract and every string and number field in it is branded. Returns are branded. A parameter named for another object's field (`questId`) takes `Quest['id']`; any other parameter or local may be a plain `string`." | B1, B4, B6      |
| `shared/src/statics/session-snippet/session-snippet-statics.ts`, line 103                                                            | "Tests import `.stub.ts`, never `-contract.ts`; Stubs import contract to parse with"                                            | "Tests import each stub and proxy from its own file, never from a barrel. A stub for our type parses through its contract. A stub for an outside type comes from the gateway." | C5, C6          |
| `shared/src/brokers/architecture/overview/architecture-overview-broker.ts:264`, served by `get-architecture`                         | "`ban-primitives` is asymmetric on purpose: an input MAY take a raw `string`, a return MUST be branded."                        | "Brands live on object contracts: every object and every field there is branded. Returns are branded. A parameter named for another object's field takes `Owner['field']` (`enforce-owner-field-reuse`, everywhere but `errors/`); any other parameter may be a plain `string`." | B1, B4, B6      |
| `shared/src/brokers/architecture/overview/architecture-overview-broker.ts:393`, served by `get-architecture`                         | "An adapter mocks its own npm package"                                                                                          | "The proxy of the file that calls a gateway wrapper composes that wrapper's proxy. MSW answers HTTP and WebSocket."                                                            | T1, T8          |
| `shared/src/statics/session-snippet/session-snippet-statics.ts:105`, in every session in every repo                                  | "No `as unknown as` on a brand mismatch — re-parse it: `dagNodeIdContract.parse(stepId)`"                                       | "No `as unknown as` on a brand mismatch. A field that holds another object's id reuses that id's schema. Never parse one id into another brand."                               | B4, B8          |
| `shared/src/brokers/architecture/overview/architecture-overview-broker.ts:279`, served by `get-architecture`                         | `const dagNodeId = dagNodeIdContract.parse(stepId);  // ✅ re-brands through validation`                                        | Removed. A field that holds another object's id reuses that id's schema (B4), and parsing one id into another brand is refused (B8).                                           | B4, B8          |
| `shared/src/brokers/architecture/overview/architecture-overview-broker.ts`, line 336                                                 | `const data = JSON.parse(response) as ApiResponse;  // ✅ you know what the compiler cannot`                                    | `const data = apiResponseContract.parse(JSON.parse(response));`                                                                                                                | C4              |
| `shared/src/brokers/architecture/overview/architecture-overview-broker.ts`, line 352                                                 | `const indexMap = new Map<ChatEntry, number>();  // ❌ raw number trips ban-primitives`                                         | The `number` form is the right one; drop the ❌ line                                                                                                                           | B6              |
| `shared/src/brokers/architecture/overview/architecture-overview-broker.ts`, line 250                                                 | "Types supporting the file's one export may sit beside it"                                                                      | "An object type that leaves a function is a contract in `contracts/`. A type used only inside one function body stays inline."                                                 | B9              |
| `shared/src/brokers/architecture/overview/architecture-overview-broker.ts:76-77`, served by `get-architecture`                       | `lib/` becomes `adapters/`: "Only adapters wrap an npm package"; `utils/` splits into `adapters/`, `guards/` or `transformers/` | "An outside package is reached only through the gateway: `#gateway/<folder>/<subpath>`." The `adapters/` rows go.                                                              | Gateway         |
| Same file, line 96                                                                                                                   | `adapters/axios/get/axios-get-adapter.ts` as the naming example                                                                 | A broker path as the example                                                                                                                                                   | Gateway         |
| Same file, line 119                                                                                                                  | "A `brokers/` file may import another package's `contracts`/`adapters`/`brokers`"                                               | Drop `adapters`                                                                                                                                                                | Gateway         |
| Same file, line 177                                                                                                                  | "In `adapters/` only: the npm-package call stays in the parent"                                                                 | Removed with `adapters/`. The layer list adds `contracts`, `transformers`, `statics` and `bindings`                                                                            | C7              |
| Same file, new section                                                                                                               | Nothing on where test support lives                                                                                             | "A stub sits beside its contract and a proxy beside the file it mocks. No barrel exports either. Tests import each from its own file. Production code never imports one."      | C6              |
| Same file, new section                                                                                                               | Nothing on returns beyond the `void` ban                                                                                        | "Return what your calls told you. `void` only when every call you discard returned `void`. `{ success: true }` counts as `void`."                                              | R1              |
| `shared/src/statics/session-snippet/session-snippet-statics.ts`, the `modifyingCodeGuidance` snippet, in every session in every repo | No line on outside packages or test barrels                                                                                     | Add: "Import outside packages only through `#gateway/<folder>/<subpath>`, types included. Import each stub and proxy from its own file."                                       | C2, C6, Gateway |
| Same file, the `folderTypes` snippet                                                                                                 | An `adapters/` row                                                                                                              | Removed with `adapters/`                                                                                                                                                       | Gateway         |

### Folder-type docs: `get-folder-detail`

| Where                                                                                                                                                  | Says today                                                                                      | Change to                                                                                                                                                        | Doc rule    |
|--------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| `mcp/src/transformers/folder-constraints/folder-constraints-transformer.ts:39`, served by `get-folder-detail` for about ten folder types               | "All types must come from contracts/"                                                           | "Our own types come from contracts/. A library's types are imported from the library."                                                                           | C2          |
| `mcp/src/transformers/folder-constraints/folder-constraints-transformer.ts:39` (Same line, a "must not" item)                                          | "Use raw primitives (string, number) in signatures"                                             | "A field of an object contract is branded. A parameter, return or local is plain, unless it is a field taken through `Owner['key']`."                            | B1, B6      |
| `mcp/src/brokers/architecture/folder-detail/architecture-folder-detail-broker.ts:152`                                                                  | "Ad-hoc Types Forbidden: All types must come from contracts"                                    | "Ad-hoc types forbidden: our own types come from contracts/, and a library's types from the library."                                                            | C2          |
| `mcp/src/statics/folder-constraints/contracts-constraints.md:22`                                                                                       | "All contracts MUST use `.brand<'TypeName'>()` on primitives"                                   | "Every object contract, every object nested in it, and every string and number field carries `.brand<'…'>()`, with the text derived from the owner and the key." | B1, B3      |
| `mcp/src/statics/folder-constraints/transformers-constraints.md:36`                                                                                    | "All transformers MUST validate output using contracts"                                         | "A transformer that returns one of our objects builds it through the object's contract parse. Loose text and numbers are returned plain."                        | B1, B6      |
| `mcp/src/statics/folder-constraints/transformers-constraints.md`, line 152                                                                             | `return contentTextContract.parse(config.purpose);`                                             | `return config.purpose;`                                                                                                                                         | B6          |
| `shared/src/statics/folder-config/folder-config-statics.ts:22`, the statics entry                                                                      | `allowRegex: false`                                                                             | `allowRegex: true`                                                                                                                                               | B2          |
| `shared/src/statics/folder-config/folder-config-statics.ts`, line 55, the contracts `purpose`                                                          | "All data structures must be defined here with branded types."                                  | "Type definitions and validation schemas for the data we define. Every object and every field in it is branded."                                                 | B1, C2      |
| `shared/src/statics/folder-config/folder-config-statics.ts`, line 38, the contracts `allowedImports`                                                   | No npm package except zod, beside our own statics, errors, contracts and two workspace packages | Unchanged for values. `import type` from a package is allowed in every folder through `enforce-import-dependencies`.                                             | C2          |
| `mcp/src/transformers/folder-constraints/folder-constraints-transformer.ts:32`, and `mcp/src/statics/folder-constraints/responders-constraints.md:219` | "Mock only I/O boundaries (adapters)"                                                           | "Mock only what the I/O trap or MSW catches, through the gateway wrapper's proxy."                                                                               | T2          |
| `mcp/src/statics/folder-constraints/contracts-constraints.md:44`, served by `get-folder-detail`                                                        | "Test files MUST import from `.stub.ts` files, NOT from `-contract.ts` files"                   | "Test files import each stub from its own `.stub.ts` file, never from a contract or a barrel."                                                                   | C6          |
| Same file, line 106                                                                                                                                    | An example stub at `src/contracts/eslint-context/eslint-context.stub.ts`                        | Removed: that copy is deleted, and an outside type's stub comes from the gateway                                                                                 | C1, C5      |
| Same file, new section                                                                                                                                 | Nothing on a field that holds an outside type                                                   | "A field holding an outside package's type reuses the gateway's schema, branded `'#Gateway<Type>'`. Never `z.custom` or `z.instanceof` in a contract."           | C9          |
| Same file, new section                                                                                                                                 | Nothing on unused contracts                                                                     | "A contract nothing in production parses is deleted, with its stub and test."                                                                                    | C1          |
| `mcp/src/transformers/folder-constraints/folder-constraints-transformer.ts`, served for every folder type                                              | No line on outside packages                                                                     | "An outside package, type or value, is imported only through `#gateway/<folder>/<subpath>`."                                                                     | C2, Gateway |
| Every function-exporting folder's `*-constraints.md`                                                                                                   | The `void` ban, with `AdapterResult` as the way out                                             | R1's wording, as in the `get-architecture` row                                                                                                                   | R1          |

### Testing patterns: `get-testing-patterns`, and `packages/testing/CLAUDE.md`

| Where                                                                                                                                      | Says today                                                                                                                                     | Change to                                                                                                                                                                                                                               | Doc rule                       |
|--------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------|
| `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts:734`, served by `get-testing-patterns`              | "Raw primitives: return types must be branded"                                                                                                 | Drop the return rule. Keep "to test an invalid input, use `as never`".                                                                                                                                                                  | B6                             |
| `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts`, line 732                                          | "define types in contracts/ and import them"                                                                                                   | "define our types in contracts/ and import them"                                                                                                                                                                                        | C2                             |
| `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts:225`, served by `get-testing-patterns`              | "**Adapters** - Mock npm dependencies (axios, fs, etc.) at adapter boundary"                                                                   | "Mock a call the I/O trap or MSW catches: compose the gateway wrapper's proxy, imported from its own file, in the proxy of the file that calls it. Pass-throughs run real."                                                             | T1, T2                         |
| `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts`, line 252                                          | "Compose adapter proxies, provide semantic setup"                                                                                              | "Compose the proxies of the gateway wrappers the broker calls, each imported from its own `.proxy` file, and provide semantic setup."                                                                                                   | T1, T2                         |
| `packages/testing/CLAUDE.md:23`                                                                                                            | "Path adapter proxies: real passthrough via `requireActual`"                                                                                   | Removed. `path` is a pass-through in the gateway, runs real, and has no proxy.                                                                                                                                                          | T2                             |
| `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts:297`                                                | A constructor-level `calledWith([])` catch-all is allowed "when a parent proxy builds this adapter without describing any call of its own"     | Drop the exception. A function that takes arguments never gets a constructor default; the parent proxy describes the call.                                                                                                              | T4                             |
| `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts`, line 38                                           | `handle.calledWith([]).resolves(FileContentsStub({value: 'content'}))`                                                                         | `handle.calledWith([filePath]).resolves('content')`: an addressed call, and a plain value                                                                                                                                               | T4, B6                         |
| `eslint-plugin/src/brokers/rule/enforce-proxy-patterns/rule-enforce-proxy-patterns-broker.ts:41`, the `adapterProxyMustSetupMocks` message | "This sets up default mock behavior when proxy is created."                                                                                    | Drop that sentence. Only the check for a `jest.mocked` proxy with no staging stays.                                                                                                                                                     | T4                             |
| `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts`, served by `get-testing-patterns` in every repo    | Says nothing about the home sandbox. Line 623 lists `os.homedir` among no-argument functions to mock.                                          | A short section with the five author rules from "The Jest home sandbox". Line 623 adds: "`os.homedir` needs no mock for isolation; it already returns the sandbox."                                                                     | T2                             |
| `packages/testing/CLAUDE.md:105-107`                                                                                                       | Calls the teardown leak check "the one guard left for code the lint rule `ban-bare-os-home-tmp` can't see"                                     | The leak check is the guard that the sandbox held. The lint rule is gone.                                                                                                                                                               | `ban-bare-os-home-tmp` removal |
| `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts:586`, served by `get-testing-patterns`              | "Branded Strings: Use single `value` property + `contract.parse(value)`"                                                                       | Removed. No standalone brand contract exists (B2), so no stub wraps one string.                                                                                                                                                         | B2, B6                         |
| `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts`, lines 408 and 432                                 | EndpointMock is not for "server-side tests", and a package enables it by adding `start-endpoint-mock-setup.ts` to its own `setupFilesAfterEnv` | MSW loads in every package from the root Jest base config, server included                                                                                                                                                              | T8                             |
| `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts`, line 242                                          | "Only 2 things mocked: I/O npm dependencies + global functions", under a diagram where `httpAdapter` runs real and `axios` is mocked           | "Mocked: what the I/O trap or MSW catches, and globals a test pins. Everything else runs real."                                                                                                                                         | T1, T2                         |
| `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts:249`, served by `get-testing-patterns`              | "Contracts ❌ No — Use stubs (.stub.ts files)"                                                                                                 | Add: "An outside type — an AST node, a rule context, a `ChildProcess` — comes from the gateway's stub, imported from its own file. Never build one by hand and cast it."                                                                | C5                             |
| Same file, new section                                                                                                                     | Nothing on where test support lives                                                                                                            | "Import each stub and proxy from its own file. No barrel exports them."                                                                                                                                                                 | C6                             |
| Same file, new section                                                                                                                     | Nothing on gateway proxies                                                                                                                     | "The proxy of a file that calls a gateway wrapper composes that wrapper's proxy, imported from the `.proxy` file beside the wrapper. A pass-through runs real and has no proxy. Tests import outside packages through the gateway too." | T1, T2, T3, T7                 |
| Same file, new section                                                                                                                     | Nothing on catch-all answers                                                                                                                   | "No `calledWith([])`, and no predicate that is always true, in a proxy constructor for a function that takes arguments. Stage each call by its arguments."                                                                              | T4                             |
| Same file, new section                                                                                                                     | Nothing on gateway-branded fields                                                                                                              | "A contract field branded `'#Gateway<Type>'` takes the gateway's stub in a stub argument: `ScanStub({ proc: ChildProcessStub() })`. A partial fake does not compile."                                                                   | C9                             |
| Same file, new section                                                                                                                     | Nothing on building failures; the adapters doc it pointed to staged `new Error('ENOENT: …')` with no `code`                                    | "A failure comes from a wrapper proxy's named scenario, such as `fileMissing`, or a recorded-failure stub from the gateway, such as `FileMissingErrorStub`. Never a hand-made `Error`."                                                 | T5                             |
| Same file, new section                                                                                                                     | Nothing on mocking another workspace package                                                                                                   | "Never `registerMock` another workspace package's export. Compose the proxy it ships beside its API, such as `startOrchestratorProxy`."                                                                                                 | T6                             |

### Package docs

| Where                                                | Says today                                                     | Change to                                                                                                     | Doc rule |
|------------------------------------------------------|----------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|----------|
| `eslint-plugin/src/brokers/rule/CLAUDE.md:7`         | "Use the shared `Tsestree` contract."                          | "Import `TSESTree` from `#gateway/npm/typescript-eslint__utils`. Never copy it."                              | C1, C2   |
| `eslint-plugin/src/brokers/rule/CLAUDE.md`, line 58  | "All AST nodes in rule brokers must use `Tsestree` type."      | "AST nodes in rule brokers use the library's `TSESTree` types."                                               | C2       |
| `eslint-plugin/src/brokers/rule/CLAUDE.md`, line 127 | `const node = TsestreeStub({type: TsestreeNodeType.Program});` | `const node = ProgramStub({ code: '…' });`, from `#gateway/npm/typescript-eslint__utils/program/program.stub` | C5       |

`adapters-constraints.md` and the adapters rows of `folder-config-statics.ts` go with the `adapters/`
folder type, in the gateway migration (`scrolls/adapters-to-one-place.md`, "Defaults", item 10, step 6). The gateway's own teaching text is written there.

## Open decisions

1. **Settled: reusing a field across an import
   cycle.** The field reuses the owner's schema through a getter annotated with the brand it must carry (B4, "A reuse across an import cycle goes through an annotated getter"). Two options were weighed and dropped. One wrote the owner's brand again inline, with an index check that the two schemas match. It kept a second copy of the check. The other gave each owner an exported id schema file, which brings back the standalone brands B2 removes. Decided on 2026-09-26.
2. **Settled: loose values lose their
   brand.** Paths built by `join`, timeouts and `cwd` values are plain until they enter an owned field, where that field's parse checks them. This costs the path brands (about 45% of path mints come from a join or a template) and the `cwd` role labels such as
   `RepoRootCwd`. A `cwd` that is a field of an owner, such as a spawn request, keeps a brand. Decided on 2026-09-26.
3. **Settled: an id may pass through a plain
   parameter.** B6 lets a branded value into a plain parameter, so an id can travel through `({ mintedBy }: { mintedBy: string })` and be parsed back into an id later, unseen by B8. A parameter lives for one call, and the field it lands in is still checked on the parse. No rule is added for it. Decided on 2026-09-26.
4. **Settled: ids with no owner.** `SessionId`, `ProcessId`, `AgentId`, `ToolUseId`, `InstanceId` and
   `RunId` are carried by many contracts, but none is any contract's own `id` (B2). Each one that can be traced to a real object gets that object as its owner, and the owner declares `id` with the real check. A siegelense instance has a fleet registry entry, a ward run has its saved result, a session has its record, and a tool use has its stream block. The argument object at an entry point is parsed as a contract too, and B4 makes its `instanceId` reuse `instanceContract.shape.id`, so the regex runs where a person's typing enters. An id that cannot be traced to an object goes plain.
   `ProcessId` joins work item ids and spawn ids built from a template (`command-chat-output-emit-transformer.ts:48`, `agent-launch-broker.ts:126`), so it goes plain unless one object turns out to own both. Decided on 2026-09-26.
5. **Settled: `z.unknown()` is refused in contracts.** `responderResultContract` held
   `data: z.unknown()`, so its 171 parses checked nothing about `data`. B1 now refuses `z.unknown()` and
   `z.any()` anywhere in `contracts/`. Each responder's result contract holds its own `data` contract, and a value that is any JSON by nature is `z.json()`. Decided on 2026-09-26.
6. **Settled: overlapping owner
   names.** When two owners match a parameter or key, the longest owner name it ends with wins. `workItemId` matches `WorkItem` before `Item`, and `itemId` matches `Item`. Decided on 2026-09-26.

7. **Moved to the order of work: reading the catch-everything
   implementations.** It is work, not a choice. See step 10 of "Status and order of work".
8. **Whether B4's index can run in the pre-edit
   hook.** Settled for the rest: a rule that needs the type checker, or that flags a file for what other files lack, runs in ward only ("Where each rule runs"). C3 moved to a syntax check and runs pre-edit. Still open: `enforce-owner-field-reuse` and
   `require-object-contract-brands-indexed` could run pre-edit if `eslint.config.js` built their index when it loads, because their violations are fixed in the file being edited. That means reading every contract in the package and its dependencies on every edit. Not measured.
9. **Whether trapping `net`, `tls` and `dns` interferes with MSW's own
    interceptors.** T8 traps those modules and gives HTTP and WebSocket to MSW. MSW's Node interceptors sit on top of `http`, and whether they call into a trapped module themselves is not checked.
10. **Settled: the search tools never show a consumer the shipped test pieces.** `discover` skips
    `node_modules` in every repo, whatever its `.gitignore` says (`file-discovery-statics.ts:38`,
    `discover-ignore-init-broker.ts:7-8`). `get-project-map` and `get-project-inventory` take a workspace package's name and read only that package. So a consumer's models meet the shipped test infrastructure only through the channels in "What dungeonmaster ships for tests, what the gateway holds, and how models find it". The gateway's stubs and proxies sit in the consumer's own `packages/@gateway/`, which the tools do read. Checked on 2026-09-25.

11. **Settled: a name whose users share no
    dependency.** The rule errors: the contract is duplicated, and it must move down to a package every user depends on, or into a new package created to hold it. The model makes that move; the rule does not pick. Decided on 2026-09-26.

## Status and order of work

1. **Done:** the trap experiment. A setup file can trap Node's built-in modules for every unit test.
2. **Done, committed in `fe456add9`:** the unit-test I/O trap and `StartOrchestrator.bootstrap()`
   (see "The unit-test I/O trap"). It covers files and processes only; its "Holes" list says what it lets through.
3. **The gateway
   migration** (`scrolls/adapters-to-one-place.md`, "Defaults", item 10). C2, C5 and T1 to T3 are written against it: imports through `#gateway`, stubs and wrapper proxies beside their code. The gateway's own share of this doc's decisions is in its follow-ups (items 22, 25 and 26): the
   `#Gateway<Type>` schemas, the stub for every subpath, and the
   `unknown`-returning `fetchJson`. Those close before step 6 starts, because step 6 switches callers onto them.
4. **Delete unused
   contracts** (C1): build C1's parse index, list every contract nothing in production parses, hand-check the list, and delete each one with its stub and test. Any copied library type the gateway migration left behind goes here too, with its stub.
5. **Upgrade zod to
   v4.** B1 needs a branded object to keep `.shape`. zod is one pass-through in the gateway, so its version is set in one `package.json`.
6. **Stubs and library
   types:** stubs and proxies out of every barrel, and every `/testing` entry point deleted (C6); callers switched to the gateway's library stubs, and the C5 lint check; retype every lint rule to
   `TSESTree` from `#gateway/npm/typescript-eslint__utils` (C1, C2); contract fields of outside types switched to the gateway's schemas, and `StubArgument` changed to keep `#Gateway` fields (C9).
7. **Brands:** `require-object-contract-brands` with its autofix (B1, B2, B3); B4 with the shared index;
   B5, B7, B8, B9; remove `ban-primitives`; delete the standalone scalar brands.
8. **Contracts:** C3, C4, C7, C8, and C9's lint rule.
9. **Returns:** R1.
10.
**Tests:** T1 to T8. In order: MSW in the root Jest base config, which first needs every package's Jest to transform MSW's ESM; unhandled requests recorded and failed in `afterEach`, and a `ws`
handler that fails any connection no test took; the trap extended to every way out T8 lists; contract-checked handlers; each workspace package's own proxy with its real failure shapes; the catalog. Then read each of the 58 implementations tested only against a code-less error that catch every error, and fix the ones that should not: "unreadable means start fresh" is right for a cache and wrong for a user's settings file, as `settings-permissions-add-broker.ts` showed (`scrolls/adapters-to-one-place.md`,
"The one job adapters should do happens at the callers").
11. **Folders:** D1.
12. **Architecture, folder-type and testing
    docs,** alongside each rule they describe (see "Architecture, folder-type and testing docs: the work").

What it costs:

- Broker proxies compose the gateway's wrapper proxies and use its recorded-failure stubs, in place of per-package adapter proxies (T1 to T3).
- About 244 object shapes become contracts (B9), and about 1,000 lines of scalar stub wrapping leave the
  largest tests (B6).
- A function returning text or a number that no object owns returns a plain `string` or `number`. The
  name its brand carried is gone; so is a contract that checked nothing.

Each step lands before the rule it replaces is removed. Before a new lint rule is built, run it as a scan over the whole repo, and hand-check a sample of what it flags and what it lets through.

## Found along the way

| What                                                                                                                                                                                                                                                                                                                          | Where                                                                                          | State                       |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|-----------------------------|
| `FolderType` is `z.string()` in mcp and `z.enum` in shared under the same brand text                                                                                                                                                                                                                                          | `packages/mcp/src/contracts/folder-type/`, recorded in `packages/mcp/CLAUDE.md`                | Known bug                   |
| `retryCount` branded `'FailCount'`                                                                                                                                                                                                                                                                                            | `packages/shared/src/contracts/work-item/work-item-contract.ts:49`                             | Name mismatch               |
| The "Quest not found" branch has no test: consumer tests stage a thrown error, but the real `getQuest` returns `{ success: false }`                                                                                                                                                                                           | `quest-pause-responder.ts:40`, `quest-get-broker.ts:77-80`                                     | Test gap (T6)               |
| `JestSuiteName` brands what is really a file path, and every field of the Jest report contract is optional                                                                                                                                                                                                                    | ward's Jest report contracts                                                                   | A brand that checks nothing |
| Proxy invents errors with no `.code`                                                                                                                                                                                                                                                                                          | `packages/orchestrator/src/adapters/fs/walk-files/fs-walk-files-adapter.proxy.ts`              | T5                          |
| `mcpServerClientContract` and its stub have no production importer; its `process` field is `z.unknown()` standing in for a `ChildProcess`                                                                                                                                                                                     | `packages/mcp/src/contracts/mcp-server-client/`                                                | Dead code                   |
| `as never` on stub fields that `StubArgument` already unbrands: about 552 in 5 of the largest core test files (311 in `flow-graph-to-text-transformer.test.ts`), 527 in the largest web, server and mcp tests. `stub-argument.type.ts:4` says it "Allows tests to pass raw values". Not compiled to confirm each is unneeded. | e.g. `quest-modify-broker.test.ts:41-42`, `quest-flow.integration.test.ts:66-69`               | Likely dead casts           |
| `ExecutionStepStatusStub` wraps a contract that is a bare `z.enum(...)` with no brand; 111 calls in one file                                                                                                                                                                                                                  | `packages/web/src/contracts/execution-step-status/`                                            | Pointless stub              |
| Contract files export hand-written generic interfaces (`Collection`, `RowVerbs`, `Op`), not `z.infer` types, and import each other's types in a cycle. C1 refuses an exported type that is not `z.infer`.                                                                                                                     | `packages/hydration/src/contracts/hydration-collection/`, `ingredient-handle/`, `matched-set/` | Not decided under C1        |
| `questId` sits beside `quest: z.unknown()`, with the quest "validated separately". Once `quest` is `questContract`, B4's fifth check removes `questId`, and callers read `quest.id`.                                                                                                                                          | `packages/web/src/contracts/quest-modified-payload/quest-modified-payload-contract.ts:14-15`   | B4, open decision 5         |
| An `EslintInstance` type copied from ESLint, not yet checked                                                                                                                                                                                                                                                                  | `packages/hooks/src/contracts/` (listed in `tmp/libstub-other-candidates.txt`)                 | Follow up under C1          |
