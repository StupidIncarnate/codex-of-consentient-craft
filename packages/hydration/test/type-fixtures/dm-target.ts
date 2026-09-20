/**
 * PURPOSE: The FILE-backed ingredient set proving `ingredientDeclareBroker` against a target this
 * repo itself would use — a home directory, where `write` produces the same file a real hydrate
 * call would. `sql-target.ts` is its DATABASE-backed twin; the two together are the proof that the
 * framework names neither files nor SQL. Every malformed-declaration fixture under
 * `test/type-fixtures/declaration/` and `call-site/` imports these ingredients or their field
 * contracts rather than declaring fresh ones, so a change here is a change to every one of them.
 *
 * USAGE:
 * import { questIngredient } from './dm-target';
 */
import { z } from 'zod';
import { ingredientDeclareBroker } from '../../src/brokers/ingredient/declare/ingredient-declare-broker';
import type {
  IngredientConfig,
  IngredientConfigInferenceAnchor,
  Ingredient,
  ExtrasFree,
} from '../../src/contracts/ingredient-config/ingredient-config-contract';
import type { CopiesFor } from '../../src/contracts/hydration-routes/hydration-routes-contract';
import type { Url } from '../../src/contracts/hydration-target/hydration-target-contract';

const _homeDirectoryContract = z.string().brand<'HomeDirectory'>();

/** Dungeonmaster's own state is JSON on disk, so its target is a HOME DIRECTORY. */
export interface DmTarget {
  home: z.infer<typeof _homeDirectoryContract>;
  /** Absent for a caller with no server. Only `write` routes can run then. */
  baseUrl?: Url;
}

/**
 * Binds `ingredientDeclareBroker`'s `TTarget` to `DmTarget` once, so every ingredient below reads
 * like the spec's own un-annotated examples — a fixture-local stand-in for the sugar
 * `hydrationCreateBroker` (chunk 3, not yet built) will provide for real. `TTarget` has no
 * inference site of its own (see `ingredientDeclareBroker`'s own comment), and TypeScript refuses a
 * CALL EXPRESSION that gives some of a generic function's type arguments and leaves others to
 * infer — so this wrapper omits `TName` from `IngredientConfig`/`IngredientConfigInferenceAnchor`
 * entirely (both default it to `string`) and reads it back off `C['name']` for the one explicit,
 * fully-saturated call to the real broker. `const C` still captures each ingredient's own literal
 * `name` structurally either way — the default widens the CONSTRAINT `C` is checked against, never
 * the value inferred FOR it.
 */
const dmIngredient = <TFields extends object, const C extends IngredientConfig<DmTarget, TFields>>(
  config: C &
    IngredientConfigInferenceAnchor<TFields> &
    CopiesFor<C['routes']> & { extras?: ExtrasFree<C['extras']> },
): Ingredient<C> => ingredientDeclareBroker<DmTarget, TFields, C['name'], C>(config);

declare const httpPost: (args: {
  target: DmTarget;
  path: string;
  fields: Record<string, unknown>;
}) => Promise<unknown>;
declare const hydrate: (args: {
  target: DmTarget;
  fields: Record<string, unknown>;
}) => Promise<unknown>;
declare const readRecord: (args: {
  target: DmTarget;
  where: Record<string, unknown>;
}) => Promise<unknown>;
declare const rewrite: (args: {
  target: DmTarget;
  record: Record<string, unknown>;
  fields: Record<string, unknown>;
}) => Promise<unknown>;
declare const unlink: (args: {
  target: DmTarget;
  record: Record<string, unknown>;
}) => Promise<unknown>;
declare const walkQuestStatus: (args: {
  from: unknown;
  to: unknown;
  target: DmTarget;
  record: Record<string, unknown>;
}) => unknown;

// ------------------------------------------------- ids shared across more than one ingredient

const guildIdContract = z.string().brand<'GuildId'>();
const questIdContract = z.string().brand<'QuestId'>();
const sessionIdContract = z.string().brand<'SessionId'>();
const urlSlugContract = z.string().brand<'UrlSlug'>();

// ------------------------------------------------- guild — an API-route ingredient

const guildNameContract = z.string().brand<'GuildName'>();

export const guildFieldsContract = z.object({
  name: guildNameContract,
  path: z.string().brand<'GuildPath'>(),
});
export const guildRecordContract = z.object({
  id: guildIdContract,
  name: guildNameContract,
  urlSlug: urlSlugContract,
});

// Widened to the base `z.ZodType`, all three type arguments given, rather than left as the
// concrete `ZodObject` `guildFieldsContract` itself is — see `IngredientConfigInferenceAnchor`'s
// own comment for why a bare object schema reintroduces zod's `deepPartial()` method-comparison
// failure once TFields is inferred through it a second time. The THIRD argument (the schema's own
// pre-brand INPUT type) matters: `z.ZodType<T>` alone defaults it to `T`, which a branded schema's
// real input never satisfies, and the cast itself is refused as a result.
type GuildFields = z.infer<typeof guildFieldsContract>;
const guildFields: z.ZodType<
  GuildFields,
  z.ZodTypeDef,
  z.input<typeof guildFieldsContract>
> = guildFieldsContract;

export const guildIngredient = dmIngredient({
  name: 'guild',
  description: 'a guild the server has registered, with its id and url slug minted',
  fields: guildFields,
  record: guildRecordContract,
  // The server mints the id and the slug, so there is no honest way to write this to disk:
  // `api` is the ONLY route, and a caller with no baseUrl cannot seed a guild.
  routes: { api: async ({ target, fields }) => httpPost({ target, path: '/api/guilds', fields }) },
});

// ------------------------------------------------- quest — a WRITE-route ingredient, a transition,
// and every existing-row route (`query`, `update`, `remove`) beyond the three that make a row.

const questTitleContract = z.string().brand<'QuestTitle'>();

export const questFieldsContract = z.object({
  title: questTitleContract,
  userRequest: z.string().brand<'QuestUserRequest'>(),
  // Fixture-only status names, deliberately NOT the real QuestStatus values — this ingredient is
  // an illustrative stand-in, not this repo's own quest.
  status: z.enum(['queued', 'accepted', 'underway', 'stalled', 'finished']),
  guildId: guildIdContract,
});
export const questRecordContract = z.object({
  id: questIdContract,
  title: questTitleContract,
  status: questFieldsContract.shape.status,
  guildId: guildIdContract,
});

// See `guildFields`'s own comment: widened to the base `z.ZodType`, all three type arguments
// given, so TFields is checked once rather than through two independently-inferred ZodObjects.
type QuestFields = z.infer<typeof questFieldsContract>;
const questFields: z.ZodType<
  QuestFields,
  z.ZodTypeDef,
  z.input<typeof questFieldsContract>
> = questFieldsContract;

export const questIngredient = dmIngredient({
  name: 'quest',
  description: 'one quest under a guild, at whatever status you set it to',
  fields: questFields,
  record: questRecordContract,
  links: [{ of: 'guild', as: 'guildId' }],
  defaults: (index) => ({ title: questTitleContract.parse(`Quest ${index + 1}`) }),
  transitions: {
    field: 'status',
    // `stalled` is deliberately absent: nothing reaches it by asking.
    to: ['queued', 'accepted', 'underway', 'finished'],
    // Receives the RECORD being walked — without it, `reach` has no way to tell which of
    // `add(3, …)`'s three rows it is being asked to move.
    reach: ({ from, to, target, record }) => walkQuestStatus({ from, to, target, record }),
  },
  routes: {
    api: async ({ target, fields }) => httpPost({ target, path: '/api/quests', fields }),
    write: async ({ target, fields }) => hydrate({ target, fields }),
    query: async ({ target, where }) => readRecord({ target, where }),
    update: async ({ target, record, fields }) => rewrite({ target, record, fields }),
    remove: async ({ target, record }) => unlink({ target, record }),
  },
  copies: 'questPersistBroker',
});

// ------------------------------------------------- operation — links to a quest AND a guild, the
// ingredient the spec's own worked example calls `q[0].operations.filter(…).remove()` on.

const operationIdContract = z.string().brand<'OperationId'>();

export const operationFieldsContract = z.object({
  role: z.enum(['riftcarver', 'codeweaver', 'ward', 'flowrider', 'siegemaster']),
  text: z.string().brand<'OperationText'>(),
  questId: questIdContract,
  guildId: guildIdContract,
  sessionId: sessionIdContract,
});
export const operationRecordContract = z.object({
  id: operationIdContract,
  role: operationFieldsContract.shape.role,
});

// See `guildFields`'s own comment.
type OperationFields = z.infer<typeof operationFieldsContract>;
const operationFields: z.ZodType<
  OperationFields,
  z.ZodTypeDef,
  z.input<typeof operationFieldsContract>
> = operationFieldsContract;

export const operationIngredient = dmIngredient({
  name: 'operation',
  description: 'one operation item on a quest ledger, for a named role',
  fields: operationFields,
  record: operationRecordContract,
  links: [
    { of: 'quest', as: 'questId' },
    { of: 'guild', as: 'guildId' },
  ],
  routes: { write: async ({ target, fields }) => hydrate({ target, fields }) },
  copies: 'questOperationsUpdateBroker',
});

// ------------------------------------------------- session — extras, no lifecycle, its own id
// field named `sessionId` rather than `id`.

export const sessionFieldsContract = z.object({
  guildId: guildIdContract,
  transcript: z.string().brand<'SessionTranscript'>(),
});
export const sessionRecordContract = z.object({
  sessionId: sessionIdContract,
  url: urlSlugContract,
});

export const nestedChainArgsContract = z.object({ depth: z.number().brand<'ChainDepth'>() });

// See `guildFields`'s own comment.
type SessionFields = z.infer<typeof sessionFieldsContract>;
const sessionFields: z.ZodType<
  SessionFields,
  z.ZodTypeDef,
  z.input<typeof sessionFieldsContract>
> = sessionFieldsContract;

export const sessionIngredient = dmIngredient({
  name: 'session',
  description: 'a claude session transcript on disk, addressable by url',
  fields: sessionFields,
  record: sessionRecordContract,
  links: [{ of: 'guild', as: 'guildId' }],
  routes: { write: async ({ target, fields }) => hydrate({ target, fields }) },
  copies: 'chatSubagentTailBroker',
  extras: {
    withNestedChain: {
      args: nestedChainArgsContract,
      apply: (): unknown => undefined,
    },
  },
});
