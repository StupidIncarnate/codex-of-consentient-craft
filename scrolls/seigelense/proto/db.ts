/**
 * A DATABASE-backed repo, to prove the framework names neither files nor SQL.
 * Dungeonmaster's own state is JSON on disk; most repos installing this have rows.
 */
import type { Contract } from './hydration';
import { createHydration } from './hydration';

declare const c: <T>() => Contract<T>;

// ------------------------------------------------- the repo's own TARGET

type QueryResult = { rows: Record<string, unknown>[] };

export type SqlTarget = {
  /** A transaction the whole plan runs inside, so a failed plan rolls back. */
  tx: { query: (sql: string, params: unknown[]) => Promise<QueryResult> };
  /** Absent for a caller with no server, exactly as in the file-backed repo. */
  baseUrl?: string;
};

const { ingredient, registry } = createHydration<SqlTarget>();

declare const insert: (
  args: { target: SqlTarget; table: string; fields: Record<string, unknown> },
) => Promise<QueryResult>;
declare const httpPost: (
  args: { target: SqlTarget; path: string; fields: Record<string, unknown> },
) => Promise<QueryResult>;

// ------------------------------------------------- branded ids

export type UserId = string & { readonly _brand: 'UserId' };
export type PostId = string & { readonly _brand: 'PostId' };

// ------------------------------------------------- user — a plain row

export type UserFields = { email: string; displayName: string };
export type UserRecord = { id: UserId; email: string; createdAt: string };

export const userIngredient = ingredient({
  name: 'user',
  description: 'one user row, with the id and createdAt the database assigns',
  fields: c<UserFields>(),
  record: c<UserRecord>(),
  routes: {
    // through the app: password hashing, a welcome email, an audit row
    api: ({ target, fields }) => httpPost({ target, path: '/api/users', fields }),
    // straight INSERT: no hashing, no email, no audit row. That is the trade `write` names.
    write: ({ target, fields }) => insert({ target, table: 'users', fields }),
  },
  copies: 'UserService.create',
});

// ------------------------------------------------- post — a FOREIGN KEY child

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'takendown';

export type PostFields = {
  title: string;
  body: string;
  status: PostStatus;
  authorId: UserId;
};
export type PostRecord = { id: PostId; title: string; status: PostStatus; authorId: UserId };

export const postIngredient = ingredient({
  name: 'post',
  description: 'one post owned by a user, at whatever status you set it to',
  fields: c<PostFields>(),
  record: c<PostRecord>(),
  // `links` IS the foreign key: `authorId` is the column, `user` is the referenced row.
  links: [{ of: 'user', as: 'authorId' }],
  // `takendown` is reachable only by a moderator action, so nothing asks for it here.
  transitions: { field: 'status', to: ['draft', 'scheduled', 'published'] },
  routes: {
    api: ({ target, fields }) => httpPost({ target, path: '/api/posts', fields }),
    write: ({ target, fields }) => insert({ target, table: 'posts', fields }),
  },
  copies: 'PostService.create',
});

// ------------------------------------------------- comment — a grandchild

export type CommentFields = { body: string; postId: PostId; authorId: UserId };
export type CommentRecord = { id: string; body: string };

export const commentIngredient = ingredient({
  name: 'comment',
  description: 'one comment on a post, written by a user',
  fields: c<CommentFields>(),
  record: c<CommentRecord>(),
  // TWO foreign keys: the post it hangs on AND the user who wrote it.
  links: [
    { of: 'post', as: 'postId' },
    { of: 'user', as: 'authorId' },
  ],
  routes: { write: ({ target, fields }) => insert({ target, table: 'comments', fields }) },
  copies: 'CommentService.create',
});

export const blog = registry({
  users: userIngredient,
  posts: postIngredient,
  comments: commentIngredient,
});
