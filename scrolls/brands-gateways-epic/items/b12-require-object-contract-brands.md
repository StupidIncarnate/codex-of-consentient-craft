# B12: `require-object-contract-brands` and `require-object-contract-brands-indexed`, with autofix — landed OFF

| | |
|---|---|
| Phase | Phase 4 — brands |
| Source | `scrolls/brands-types-tests-rules.md` (BR), B1 "every object contract, every object nested in it, and every string and number field carries a brand, and nothing else does", lines 133-396 (rule table at 378-396, "what gets a brand" table at 170-191); B2 "a brand is declared only on an object contract, or inline on a field of one", lines 398-497; B3 "the brand text is the owner's name plus the field key", lines 499-552; "New rules" rows 2253-2254; `require-zod-on-primitives` row 2228; C7's layer row (from `b07-layers-and-statics-regex.md`, cross-referenced, not rebuilt here) |
| Needs | [B01](b01-zod-v4.md), [B10](b10-owner-index.md) |
| Unblocks | [B15](b15-brand-migration.md), and Z01–Z07 |
| Packages touched | `eslint-plugin` (the two rules), `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts` (tagging), `.dungeonmaster.json` or wherever the rule's on/off config lives (this rule lands switched off — see Work step 6) |
| Checks to run | `lint,typecheck,unit` |
| Split | One agent for `require-object-contract-brands` (syntax-only, pre-edit); a second for `require-object-contract-brands-indexed` (needs B10's index, ward only) — the two rules split naturally along the pre-edit/ward-only line |
| Runs alone | No — runs with [B13](b13-owner-field-reuse.md), [B14](b14-type-alias-and-adhoc-type-rules.md) |

## Why

Every rule in the repo that asks a model to judge whether a text field is "worth" branding gets the
answer "yes, make one", because agreeing costs the model less than judging. That produces brands that
check nothing — `ContentText` alone is used 894 times (486 outside tests) across 108 object fields under
75 different keys, checking nothing at all. B1 removes the judgement: **every** object contract, every
object nested in it, and every string/number leaf in it carries a brand — no exceptions, no model
decision about which fields "deserve" one. B3 (folded into this same rule, see below) derives every
brand's text mechanically, so branding everything invents no new name anyone has to pick.

## What gets a brand (B1's table, copied in full)

| Schema | Brand? |
|---|---|
| An object contract | Yes. The text is the owner's name: `z.object({ … }).brand<'WorkItem'>()` |
| An object nested in a field | Yes. The text is the owner plus the key: `owner: z.object({ … }).brand<'QuestOwner'>()`. Its leaves are branded too. |
| Another contract, used whole as a field: an object, union or enum contract | No new brand. It keeps its own: `user: userContract` carries `'User'`, and `users: z.array(userContract)` carries `'User'` on each element. A union contract keeps its branches' brands. An enum contract has none. A layer contract is not this case: it takes the owner plus the key (C7). |
| Part of another object contract, written inline | Yes, as a nested object: `user: userContract.pick({ … })` inside `dealContract` is `.brand<'DealUser'>()`. The fields it keeps are reuses, so they keep the source's brands. |
| An array of objects | Each element object gets a brand with the array field's key: `items: z.array(z.object({ … }).brand<'QuestItems'>())`. The array itself gets none. |
| A `z.string()` or `z.number()` leaf | Yes. The text is the owner plus the key (B3). |
| An element of an array of strings or numbers | Yes, with the array field's key: `tags: z.array(z.string().brand<'QuestTags'>())` |
| A value of a `z.record` or `z.map` | Yes, with the field's key, as an array element is: `counts: z.record(…, z.number().brand<'QuestCounts'>())`. An object value is `.brand<'QuestCounts'>()` the same way. |
| A key of a `z.record` or `z.map` | A string or number key gets the field's key plus `Key`: `counts: z.record(z.string().brand<'QuestCountsKey'>(), …)`. A key that holds another owner's id reuses it ([B13](b13-owner-field-reuse.md)): `z.record(questContract.shape.id, …)`. An enum key takes no brand. |
| A position of a `z.tuple` | A string or number position gets the field's key plus its index: `span: z.tuple([z.number().brand<'QuestSpan0'>(), z.number().brand<'QuestSpan1'>()])`. An object position is branded the same way. |
| A field that holds the contract itself, at any depth | It keeps the owner's own brand, through a getter. See "A contract that holds itself" below. |
| An enum or literal | No. A literal type already cannot be confused with free text. |
| A boolean | No |
| A value that is any JSON by nature, such as a JSON-RPC `params` or a JSON Schema | `z.json()`, with no brand, as for an enum. |
| `z.unknown()` or `z.any()` | Refused anywhere in `contracts/`. See below. |
| A reuse of another owner's field ([B13](b13-owner-field-reuse.md)), or of the owner's own local id const (B2) | It keeps the source's brand |
| A field holding an outside package's type | It reuses the gateway's schema, and keeps its `'#Gateway<Type>'` brand ([B06](b06-gateway-schema-fields-in-contracts.md)) |
| A string or number that is not a field of an object contract: a parameter, return or local | No brand of its own. It stays plain, or carries a field's brand through `Owner['key']`. An object that a function returns is a contract ([B14](b14-type-alias-and-adhoc-type-rules.md)'s B9). |

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

// left alone
(): KebabCaseVariants => …                           // a returned object is a contract (B9, see B14)
questContract = z.object({ title: z.string().min(1).brand<'QuestTitle'>() }).brand<'Quest'>()
questContract = z.object({ tags: z.array(z.string().brand<'QuestTags'>()) }).brand<'Quest'>()
questContract = z.object({ counts: z.record(z.string().brand<'QuestCountsKey'>(), z.number().brand<'QuestCounts'>()) }).brand<'Quest'>()
questContract = z.object({ owner: z.object({ name: z.string().brand<'QuestOwnerName'>() }).brand<'QuestOwner'>() }).brand<'Quest'>()
workItemContract = z.object({ status: z.enum([...]), resumeOnly: z.boolean() }).brand<'WorkItem'>()
dealContract = z.object({ userId: userContract.shape.id, user: userContract.optional() }).brand<'Deal'>()   // user keeps 'User'
({ questId }: { questId: Quest['id'] })                  // the field's own brand, taken off the object
({ timeoutMs }: { timeoutMs: number })                   // loose value: plain
```

Ins and outs that change what you build:

- **An object contract may hold another object contract whole, and that contract keeps its own brand.**
  A join is the common case:
  ```typescript
  export const dealContract = z
    .object({
      id: z.string().uuid().brand<'DealId'>(),
      userId: userContract.shape.id,          // the join id: carries 'UserId' (B4, see B13)
      user: userContract.optional(),          // the child, whole, when expanded: carries 'User', not 'DealUser'
      lineItems: z.array(lineItemContract),   // each element carries 'LineItem'
    })
    .brand<'Deal'>();
  ```
  A `User` from anywhere fits `deal.user`, and `deal.user` fits anywhere a `User` goes. A `'DealUser'`
  brand would refuse both, and the only way around it would be a re-parse.
- **A contract that always holds the child does not also hold its id.** This is B4's fifth check
  (`ban-join-id-beside-child`), built in [B13](b13-owner-field-reuse.md), not this item — but it means
  this rule must not brand an id key that check is about to remove.
- **Two cases look like a nested-object case and are not:**

  | Field value | Why it is different | Brand |
  |---|---|---|
  | A layer contract, `owner: ownerLayerContract` | A layer is the parent's own nested object, moved to another file (C7, [B07](b07-layers-and-statics-regex.md)) | The owner plus the key: `'QuestOwner'` |
  | Part of another contract written inline, `user: userContract.pick({ … })` | It is a new object. In zod v4, `.pick()`, `.omit()`, `.extend()` and `.partial()` drop the brand ([B01](b01-zod-v4.md)) | The owner plus the key: `'DealUser'` |

- **An enum used by two or more contracts is its own contract**, and takes no brand of its own — this
  rule must not try to brand `z.enum(...)` even when reused. `enforce-owner-field-reuse` (in
  [B13](b13-owner-field-reuse.md)) is what catches a *copied* enum; this rule only needs to leave enums
  alone.
- **`z.unknown()` and `z.any()` are refused in `contracts/`.** 128 uses in 85 contract files existed as of
  a 2026-09-26 scan in the source doc — re-scan fresh when this item starts, since Phase 2/3 items may
  have already removed some. Each becomes: our own data's contract (for a responder's `data` field, one
  branch per status), `z.json()` (for anything that is any JSON value by nature — checked 2026-09-26
  against zod's v4 build: accepts nested objects, arrays, strings, numbers, booleans and `null`, rejects a
  function, `undefined` and a `Map`), the gateway's schema ([B06](b06-gateway-schema-fields-in-contracts.md)),
  or (for a mock-call-argument record such as `staged-call-contract.ts`'s `args`) left unsettled per the
  source doc — do not force a schema onto that one field without reporting the ambiguity. **This rule
  itself only needs to flag `z.unknown()`/`z.any()` in `contracts/`; deciding each field's replacement
  contract is [B15](b15-brand-migration.md)'s migration work, not this item's.**
- **A record key is branded, so a plain string cannot index the record.** `quest.byQuest['q1']` does not
  compile when the key is `QuestId`. This is a consequence of the rule, not extra work for this item, but
  note it in your report so [B15](b15-brand-migration.md)'s agents are not surprised by the compile
  errors it causes at every record-indexing call site.
- **A contract that holds itself uses the getter form.** [B01](b01-zod-v4.md) already rewrote the five
  known self-referencing contracts to this form — this rule's job is to *enforce* the form going forward,
  not to build it again:
  ```typescript
  const treeNodeFields = z.object({ name: z.string().brand<'TreeNodeName'>() });
  type TreeNodeSelf = z.infer<typeof treeNodeFields> & { children: TreeNodeSelf[] } & z.$brand<'TreeNode'>;
  export const treeNodeContract = z
    .object({
      ...treeNodeFields.shape,
      get children(): z.ZodArray<z.core.$ZodType<TreeNodeSelf>> {
        return z.array(treeNodeContract);
      },
    })
    .brand<'TreeNode'>();
  ```
  The five rules for this form (all enforced by the "self-reference" row below): the field list and
  local type are not exported; the field list carries no object brand of its own; the local type ends in
  `z.$brand<'…'>` with the owner's text; the getter's return type wraps `z.core.$ZodType<Self>`, never
  `z.ZodType<Self>`; `z.lazy` and a cast to `z.ZodType` are refused anywhere in `contracts/`.
- **Build an object through its root contract's parse.** `contract.parse({ … })` brands every leaf in
  one step. This is a *convention* this rule's autofix should encourage by construction (writing
  `.brand()` calls that only work when chained through a root parse) but the rule itself does not check
  call sites for parse style — that migration work (the three parse-style anti-patterns: parse-each-leaf,
  build-then-reparse, generic-merge-then-cast) is [B15](b15-brand-migration.md)'s.

## B2: a brand is declared only on an object contract, or inline on a field of one

No standalone brand contract. No exported brand type. The only way to get a brand is through the object
that owns it.

```
// before — a standalone brand contract and its exported type
export const questIdContract = z.string().min(1).brand<'QuestId'>();
export type QuestId = z.infer<typeof questIdContract>;
export const contentTextContract = z.string().brand<'ContentText'>();

// after — the brand lives on its owner's field
export const questContract = z
  .object({
    id: z.string().min(1).brand<'QuestId'>(),
    title: z.string().min(1).brand<'QuestTitle'>(),
  })
  .brand<'Quest'>();
export type Quest = z.infer<typeof questContract>;
```

```
// flagged
export const questIdContract = z.string().min(1).brand<'QuestId'>();      // standalone brand
const label = z.string().brand<'Label'>();                                 // a local brand no owner uses as its `id`
export const workItemId = z.string().uuid().brand<'WorkItemId'>();        // the exception's const, but exported
export type QuestId = z.infer<typeof questContract>['id'];                 // exported brand type (see B5, in B14)

// left alone
export const questContract = z.object({ id: z.string().min(1).brand<'QuestId'>() }).brand<'Quest'>();
const workItemId = z.string().uuid().brand<'WorkItemId'>();               // local, not exported
export const workItemContract = z.object({ id: workItemId, mintedBy: workItemId.optional() }).brand<'WorkItem'>();
```

**One exception, for an owner that points at itself.** `WorkItem` holds its own id in `dependsOn`,
`insertedBy` and `mintedBy`. A contract cannot reference its own `.shape` while it is being declared, so
an owner may hold its id in a local const that is **not exported**, whose brand text follows the owner
field that uses it as `id` (B3):

```typescript
const workItemId = z.string().uuid().brand<'WorkItemId'>();   // local, not exported
export const workItemContract = z
  .object({
    id: workItemId,
    dependsOn: z.array(workItemId).default([]),
    mintedBy: workItemId.optional(),
  })
  .brand<'WorkItem'>();
```

A format check that many owners need lives in `statics/` as a pattern (see
[B07](b07-layers-and-statics-regex.md) for the `allowsLayerFiles`/`allowRegex` config this depends on):

```typescript
export const pathStatics = { absolutePattern: /^(\/|[A-Za-z]:\\)/u } as const;
path: z.string().regex(pathStatics.absolutePattern).brand<'GuildPath'>(),
```

A value with no owner stays plain — a path built by `join`, or a timeout, is a plain `string`/`number`
until it is put into an owned field. Several ids have no owner today (`SessionId`, `ProcessId`,
`AgentId`, `ToolUseId`, `InstanceId`, `RunId`) — open decision 4 covers what to do with each, and that
decision's execution is [B15](b15-brand-migration.md)'s job, not this item's; this rule just needs to
allow a plain value with no owner to pass with no brand.

## B3: the brand text is the owner's name plus the field key

The owner's name is the const that holds the `z.object`, without its `Contract` suffix, in PascalCase.
A field's brand is the owner's name plus the field's key in PascalCase, so `used_percentage` becomes
`UsedPercentage`. A nested object's brand is the owner's name plus its key, and its fields add their keys
after that. A local id const (B2) takes the text of the field that uses it as `id`.

```
// flagged
questContract = z.object({ id: z.string().brand<'QuestId'>() }).brand<'QuestContract'>()   // must be 'Quest'
questContract = z.object({ id: z.string().brand<'Id'>() }).brand<'Quest'>()               // must be 'QuestId'
workItemContract = z.object({ retryCount: z.number().brand<'FailCount'>() }).brand<'WorkItem'>()   // must be 'WorkItemRetryCount'

// left alone
questContract = z.object({ id: z.string().brand<'QuestId'>() }).brand<'Quest'>()
guildContract = z.object({ id: z.string().uuid().brand<'GuildId'>() }).brand<'Guild'>()
questContract = z.object({ owner: z.object({ name: z.string().brand<'QuestOwnerName'>() }).brand<'QuestOwner'>() }).brand<'Quest'>()
```

Ins and outs: an object nested inline adds each key on the path (`questContract.owner` is
`'QuestOwner'`, `questContract.owner.name` is `'QuestOwnerName'`); another contract used whole keeps its
own text (`user: userContract` inside `dealContract` is `'User'`, not `'DealUser'`); each object branch
of a union takes the owner's name, and a key in several branches must use the same schema in each; two
brands share a text only if they share an owner and a key ([B11](b11-unique-contract-names.md) keeps
owner names unique across packages, so this holds repo-wide); `ContentText` cannot be written under this
rule — no owner-plus-key produces it, except a fake `Content` object, which
[B14](b14-type-alias-and-adhoc-type-rules.md)'s B7 catches; reusing a brand keeps its source's text.

## Current state

Confirmed this session (2026-09-26): no rule folder named `require-object-contract-brands` or
`require-object-contract-brands-indexed` exists in `packages/eslint-plugin/src/brokers/rule/` (only
`require-zod-on-primitives`, the rule this item replaces, exists there today, alongside `ban-primitives`,
`ban-adhoc-types`, `enforce-contract-usage-in-tests`, `enforce-import-dependencies`,
`enforce-proxy-child-creation`, `enforce-stub-patterns`, `enforce-stub-usage`). `zod` in this checkout is
still the v3.25.76-based dependency at the time of this scan — confirm [B01](b01-zod-v4.md) is `done`
before writing any code that depends on `.shape` existing on a branded object, since that only works
under v4.

`dungeonmaster-rule-enforce-on-statics.ts` (`packages/shared/src/statics/dungeonmaster-rule-enforce-on/`)
exists and is confirmed as the tagging file this item must edit.

This rule **lands switched OFF**, per the EPIC item list's own instruction — it would flag hundreds of
places across the repo (every existing contract) before [B15](b15-brand-migration.md) has migrated them.
[B15](b15-brand-migration.md) is the item that switches it on, at the end of its migration, alongside
[B13](b13-owner-field-reuse.md)'s rule.

## Work

1. **Build `require-object-contract-brands`** as a single ESLint rule covering every row of B1's table
   above **except** the two rows marked "indexed" (a leaf with no brand needing B4's index to know it
   isn't a reuse, and a layer contract's brand text needing the parent file). This half needs only the
   syntax of the file being edited — no other file, no type checker — so it is **pre-edit eligible**.
2. **Build `require-object-contract-brands-indexed`** covering exactly those two indexed rows. It reads
   [B10](b10-owner-index.md)'s index (to know which keys [B13](b13-owner-field-reuse.md)'s
   `enforce-owner-field-reuse` claims, so this rule never asks to brand a reuse as its own name) and the
   parent file (to derive a layer contract's expected texts from its one use). This half is **ward only**.
   Without the index, the pre-edit hook would tell a model to brand `questId` as `'SomeQuestId'`, which
   [B13](b13-owner-field-reuse.md)'s rule then refuses — the two rules must share the index so they never
   disagree about a key.
3. **The full check table**, combined from B1's rule table (lines 378-396):

   | What the rule checks | Where | Message | Indexed? |
   |---|---|---|---|
   | Every object schema in a contract ends in `.brand<'…'>()` | Every `z.object` call in `contracts/`, at any depth, including inside `z.array`/`z.record`/`z.map`/`z.tuple`; also `.extend()`/`.pick()`/`.omit()`/`.partial()` results and `z.strictObject()`/`z.looseObject()`. Exception: the field list of a self-referencing contract. | `z.object in {{file}} has no brand. Add .brand<'{{expected}}'>().` | No |
   | Every `z.string()`/`z.number()` leaf inside it has `.brand<'…'>()` somewhere in its chain, except a key `enforce-owner-field-reuse` claims | Each property value, through `.optional()`/`.nullable()`/`.default()`/`.min()` and other chained calls; also inside `z.array`; key and value of `z.record`/`z.map`; each position of `z.tuple` | `Field {{key}} has no brand. Add .brand<'{{expected}}'>().` | **Yes** |
   | A contract that holds itself uses the getter form | A local, unexported `z.object` with no brand, whose only uses are `...x.shape` spread into one owner and `z.infer<typeof x>` in a local type; a getter is left alone when its return type wraps `z.core.$ZodType<…>` of a local type ending in `z.$brand<'{{owner}}'>`. `z.lazy` anywhere in `contracts/` is refused. | `A contract that holds itself uses an annotated getter, not z.lazy. See "A contract that holds itself".` | No |
   | No brand on an enum, literal or boolean | `z.enum`, `z.literal`, `z.boolean` chains | `{{key}} is an enum, literal or boolean. Remove the brand.` | No |
   | No `z.unknown()` or `z.any()` | Anywhere in `contracts/`, at any depth | `{{key}} is z.unknown(), which checks nothing. Use the value's contract, or z.json() when it is any JSON value.` | No |
   | The brand text equals the derived text (B3) | Every `.brand<'…'>()` on an object or leaf, except in a `*-layer-contract.ts` file (the indexed rule checks those) | `Brand text '{{actual}}' must be '{{expected}}'.` | No (layers: Yes) |
   | A field that reuses another schema is left alone | A `.shape.<key>` access, the owner's local id const, or another contract/object/union/enum imported from a non-layer `*-contract.ts` file; may be wrapped in `.optional()`/`.nullable()`/`.default()`/`z.array()`; a getter reuse across an import cycle counts too | none | No |
   | Indexed: a layer contract is not a reuse | An identifier imported from a `*-layer-contract.ts` file; checks every brand text in it against owner+key+leaf-key; checks exactly one file imports it | `Layer {{layer}} is used under key {{key}}. Its brand must be '{{expected}}'.` and `Layer {{layer}} is imported by {{file}}. Only its parent, {{parent}}, may import it.` | **Yes** |
   | Part of another contract is not a reuse | A value ending in `.pick(…)`/`.omit(…)`/`.extend(…)`/`.partial(…)` on another contract | `z.object in {{file}} has no brand. Add .brand<'{{expected}}'>().` | No |
   | A reuse adds no check of its own | A reuse followed by a refinement (`questContract.shape.id.min(5)`) | `{{key}} reuses {{source}}. Add no check to it: one brand text means one check.` | No |
   | No `.brand<'…'>()` anywhere else (B2) | Every `.brand(` call not on a `z.object(...)` or inside one, except a local unexported id const | `A brand sits only on an object contract or one of its fields. Move it onto the field that owns the value, or drop it.` | No |
   | A local id const's text is its owner's `id` text (B3) | The const's declaration, traced to the owner field using it as `id` | `Brand text '{{actual}}' must be '{{expected}}', the id of {{owner}}.` | No |

4. **Build the autofix.** Every expected text is derived from the const name and the key path, so the
   fixer writes the missing `.brand<'…'>()` itself, and replaces a wrong text. This replaces
   `require-zod-on-primitives` entirely (see "Lint rules" below) — the fixer needs no model judgement,
   since B3's naming is fully mechanical.
5. **Run both rules as a scan over the whole repo before switching either on** (the standing rule for
   every new lint rule in this epic) — hand-check a sample of what each flags and what it lets through.
6. **Land both rules switched OFF.** A rule this broad would flag essentially every existing contract in
   the repo before migration. Confirm how this repo expresses "built but not enforced" (an ESLint
   `warn`/`off` severity in the rule's config entry, or a flag in `.dungeonmaster.json`, or the ward
   config — read how other landed-off rules in this repo's history express it, if any precedent exists,
   and match it; report which mechanism you used). **[B15](b15-brand-migration.md) is the item that
   switches both rules on**, at the end of its migration.
7. **Tag `require-object-contract-brands` `'pre-edit'`** in `dungeonmaster-rule-enforce-on-statics.ts`.
   **Do not tag `require-object-contract-brands-indexed`** — it stays ward-only.
8. **Remove `ban-primitives` and `require-zod-on-primitives`** from the enforce-on-statics map entirely —
   `ban-primitives` has nothing left to refuse once plain returns are allowed
   ([B14](b14-type-alias-and-adhoc-type-rules.md)'s B6), and `require-zod-on-primitives` is fully replaced
   by this item's two rules. **Do not delete the rule files themselves until confirming no other item
   still depends on them being present during its own migration** — report if you find one.

## Lint rules this item adds or changes

See the full table in Work step 3. Summary:

| Rule | Pre-edit? | Autofix? | Landed |
|---|---|---|---|
| `require-object-contract-brands` | **Yes** | Yes | OFF — [B15](b15-brand-migration.md) switches on |
| `require-object-contract-brands-indexed` | **No** — needs [B10](b10-owner-index.md)'s index and the parent file for layers | Yes (same fixer, ward-invoked) | OFF — [B15](b15-brand-migration.md) switches on |
| `require-zod-on-primitives` | Removed | — | Deleted from the enforce-on-statics map |
| `ban-primitives` | Removed | — | Deleted from the enforce-on-statics map (B6's job triggers the removal; this item executes it since it shares the same statics-file edit) |

## Teaching text this item changes

From BR "Today's rules and docs that change" (row 2228 area): `require-zod-on-primitives` — "Every
`z.string()` and `z.number()` anywhere needs `.brand()`" → "Replaced by `require-object-contract-brands`.
Keeps the brand-in-chain check and the enum skip. Drops the loose `z.string()` case. Adds the object
brand, the derived text, the `contracts/` scope and the autofix." Doc rule: B1, B2, B3. This row's actual
doc-file edits (session snippets, `get-architecture` text, `get-folder-detail` text) are finished in
[Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md) once every item is
done — this item should leave a note in its report confirming the rule names and behavior are final so
the Z-phase agent writes accurate text.

## Done when

- [ ] `require-object-contract-brands` exists, covers every non-indexed row of the table, has an autofix,
      is tagged `'pre-edit'`, and is landed switched OFF.
- [ ] `require-object-contract-brands-indexed` exists, covers both indexed rows (leaf-is-a-reuse,
      layer-contract-text), reads [B10](b10-owner-index.md)'s index, is NOT tagged `'pre-edit'`, and is
      landed switched OFF.
- [ ] `require-zod-on-primitives` and `ban-primitives` are removed from
      `dungeonmaster-rule-enforce-on-statics.ts`.
- [ ] Both new rules were scanned over the whole repo and hand-checked before being switched off (not
      on) — confirm the scan happened even though the rules land off, since "land off" still means
      "prove the rule's logic is correct" before handing it to [B15](b15-brand-migration.md).
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0.

## Traps

- Do not switch either rule on — that is explicitly [B15](b15-brand-migration.md)'s job, at the very end
  of its migration, alongside [B13](b13-owner-field-reuse.md)'s rule.
- `require-object-contract-brands-indexed` must never brand a key that `enforce-owner-field-reuse` (in
  [B13](b13-owner-field-reuse.md)) claims — the two rules share one index specifically so they cannot
  disagree; if you build this item before [B13](b13-owner-field-reuse.md)'s rule exists, still wire the
  index-sharing contract correctly (read from [B10](b10-owner-index.md) directly) rather than guessing at
  what [B13](b13-owner-field-reuse.md) will claim.
- Do not attempt the self-referencing-contract getter form here — [B01](b01-zod-v4.md) already builds the
  five instances; this item only writes the rule that enforces the pattern going forward.
- `z.unknown()`/`z.any()` replacement decisions (per-field) are [B15](b15-brand-migration.md)'s migration
  work — this rule only flags them.

## Concessions made while executing

