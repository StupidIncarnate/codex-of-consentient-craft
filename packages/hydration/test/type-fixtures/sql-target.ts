/**
 * PURPOSE: The DATABASE-backed ingredient set proving `ingredientDeclareBroker` names neither files
 * nor SQL — `dm-target.ts` is its FILE-backed twin, and the two together are the proof, since a
 * transaction-holding target and a home-directory target share the identical declaration surface.
 * Every malformed-declaration fixture under `test/type-fixtures/declaration/` and `call-site/` that
 * needs the DATABASE shape (the mutation table's `u[0].comments` row is only reachable here) imports
 * these ingredients or their field contracts rather than declaring fresh ones.
 *
 * USAGE:
 * import { postIngredient } from './sql-target';
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

const _sqlQueryContract = z.string().brand<'SqlQuery'>();
type SqlQuery = z.infer<typeof _sqlQueryContract>;
interface SqlQueryResult {
  rows: Record<PropertyKey, unknown>[];
}

/** Most repos installing this framework have rows, not files — its target is a TRANSACTION the
 * whole plan runs inside, so a failed plan rolls back. */
export interface SqlTarget {
  tx: { query: (sql: SqlQuery, params: readonly unknown[]) => Promise<SqlQueryResult> };
  /** Absent for a caller with no server, exactly as in the file-backed repo. */
  baseUrl?: Url;
}

/**
 * Binds `ingredientDeclareBroker`'s `TTarget` to `SqlTarget` once — see `dm-target.ts`'s
 * `dmIngredient` for the full reasoning, which this mirrors exactly.
 */
const sqlIngredient = <
  TFields extends object,
  const C extends IngredientConfig<SqlTarget, TFields>,
>(
  config: C &
    IngredientConfigInferenceAnchor<TFields> &
    CopiesFor<C['routes']> & { extras?: ExtrasFree<C['extras']> },
): Ingredient<C> => ingredientDeclareBroker<SqlTarget, TFields, C['name'], C>(config);

declare const insert: (args: {
  target: SqlTarget;
  table: string;
  fields: Record<string, unknown>;
}) => Promise<SqlQueryResult>;
declare const httpPost: (args: {
  target: SqlTarget;
  path: string;
  fields: Record<string, unknown>;
}) => Promise<SqlQueryResult>;
declare const walkPostStatus: (args: {
  from: unknown;
  to: unknown;
  target: SqlTarget;
  record: Record<string, unknown>;
}) => unknown;

// ------------------------------------------------- ids shared across more than one ingredient

const userIdContract = z.string().brand<'UserId'>();
const postIdContract = z.string().brand<'PostId'>();

// ------------------------------------------------- user — a plain row, both routes

export const userFieldsContract = z.object({
  email: z.string().brand<'UserEmail'>(),
  displayName: z.string().brand<'UserDisplayName'>(),
});
export const userRecordContract = z.object({
  id: userIdContract,
  email: userFieldsContract.shape.email,
  createdAt: z.string().brand<'CreatedAt'>(),
});

// Widened to the base `z.ZodType`, all three type arguments given, rather than left as the
// concrete `ZodObject` this schema is — a caller's real object schema, checked against TWO
// independently-inferred `{ readonly _output: TFields }` sites (this one and `C`'s own
// constraint), reintroduces zod's `deepPartial()` method-comparison failure otherwise. The third
// argument is the schema's own pre-brand INPUT type: `z.ZodType<T>` alone defaults it to `T`,
// which a branded schema's real input never satisfies.
type UserFields = z.infer<typeof userFieldsContract>;
const userFields: z.ZodType<
  UserFields,
  z.ZodTypeDef,
  z.input<typeof userFieldsContract>
> = userFieldsContract;

export const userIngredient = sqlIngredient({
  name: 'user',
  description: 'one user row, with the id and createdAt the database assigns',
  fields: userFields,
  record: userRecordContract,
  routes: {
    // through the app: password hashing, a welcome email, an audit row
    api: async ({ target, fields }) => httpPost({ target, path: '/api/users', fields }),
    // straight INSERT: no hashing, no email, no audit row — the trade `write` names.
    write: async ({ target, fields }) => insert({ target, table: 'users', fields }),
  },
  copies: 'UserService.create',
});

// ------------------------------------------------- post — a FOREIGN KEY child, a transition

export const postFieldsContract = z.object({
  title: z.string().brand<'PostTitle'>(),
  body: z.string().brand<'PostBody'>(),
  status: z.enum(['draft', 'scheduled', 'published', 'takendown']),
  authorId: userIdContract,
});
export const postRecordContract = z.object({
  id: postIdContract,
  title: postFieldsContract.shape.title,
  status: postFieldsContract.shape.status,
  authorId: userIdContract,
});

// See `userFields`'s own comment.
type PostFields = z.infer<typeof postFieldsContract>;
const postFields: z.ZodType<
  PostFields,
  z.ZodTypeDef,
  z.input<typeof postFieldsContract>
> = postFieldsContract;

export const postIngredient = sqlIngredient({
  name: 'post',
  description: 'one post owned by a user, at whatever status you set it to',
  fields: postFields,
  record: postRecordContract,
  // `links` IS the foreign key: `authorId` is the column, `user` is the referenced row.
  links: [{ of: 'user', as: 'authorId' }],
  transitions: {
    field: 'status',
    // `takendown` is reachable only by a moderator action, so nothing asks for it here.
    to: ['draft', 'scheduled', 'published'],
    reach: ({ from, to, target, record }) => walkPostStatus({ from, to, target, record }),
  },
  routes: {
    api: async ({ target, fields }) => httpPost({ target, path: '/api/posts', fields }),
    write: async ({ target, fields }) => insert({ target, table: 'posts', fields }),
  },
  copies: 'PostService.create',
});

// ------------------------------------------------- comment — a grandchild, TWO links, no lifecycle

export const commentFieldsContract = z.object({
  body: z.string().brand<'CommentBody'>(),
  postId: postIdContract,
  authorId: userIdContract,
});
export const commentRecordContract = z.object({
  id: z.string().brand<'CommentId'>(),
  body: commentFieldsContract.shape.body,
});

// See `userFields`'s own comment.
type CommentFields = z.infer<typeof commentFieldsContract>;
const commentFields: z.ZodType<
  CommentFields,
  z.ZodTypeDef,
  z.input<typeof commentFieldsContract>
> = commentFieldsContract;

export const commentIngredient = sqlIngredient({
  name: 'comment',
  description: 'one comment on a post, written by a user',
  fields: commentFields,
  record: commentRecordContract,
  // TWO foreign keys: the post it hangs on AND the user who wrote it.
  links: [
    { of: 'post', as: 'postId' },
    { of: 'user', as: 'authorId' },
  ],
  routes: {
    write: async ({ target, fields }) => insert({ target, table: 'comments', fields }),
    remove: async ({ target, record }) => insert({ target, table: 'comments', fields: record }),
  },
  copies: 'CommentService.create',
});
