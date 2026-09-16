/**
 * Row 7b — the ALL-LINKS-SATISFIED condition, provable only on the DATABASE-backed fixture set.
 * `comments` names `user` among its own links, so the immediate-parent condition alone would let
 * this through — but a comment ALSO needs a `post`, which no ancestor of a bare user supplies.
 * Counterpart: `scrolls/seigelense/siegelense-recipes.md`'s mutation table ("Break" / "Caught by"),
 * row "drop the child accessor's ALL-LINKS-SATISFIED condition".
 */
import { blog } from './_shared';

export const childLinksUnsatisfied = blog.users.add(1, (u) => [u[0].comments.add(1, () => [])]);
