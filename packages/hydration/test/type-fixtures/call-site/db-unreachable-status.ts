/**
 * Row 3, re-proven on the DATABASE shape — a real status outside the transition's own `to` list
 * must not compile there either, not only over `dm-target.ts`'s file-backed quest. `postIngredient`
 * declares `to: ['draft', 'scheduled', 'published']`; `takendown` is a real member of `status` the
 * gates refuse. See `recipes-chunk-01-03-framework-types.md` §4: "Rows 3, 7b and 11 are re-proven on
 * the DATABASE shape as well … because the mutation table names `u[0].comments` specifically, and
 * nothing proves those three rows against a foreign-key shape until these fixtures exist."
 */
import { blog } from './_shared';

export const dbUnreachableStatus = blog.users.add(1, (u) => [
  u[0].posts.add(1, (p) => [p[0].set({ status: 'takendown' })]),
]);
