/**
 * Row 11, re-proven on the DATABASE shape — an unknown field in a filter's own match object must
 * not compile against `sql-target.ts`'s foreign-key shape either, not only over `dm-target.ts`'s
 * quest. See `recipes-chunk-01-03-framework-types.md` §4: "Rows 3, 7b and 11 are re-proven on the
 * DATABASE shape as well … because the mutation table names `u[0].comments` specifically, and
 * nothing proves those three rows against a foreign-key shape until these fixtures exist."
 */
import { blog } from './_shared';

export const dbUnknownColumn = blog.users.add(1, (u) => [
  u[0].posts.filter({ where: { nope: 1 } }).remove(),
]);
