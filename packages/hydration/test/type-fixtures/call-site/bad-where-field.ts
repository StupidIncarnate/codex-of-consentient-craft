/**
 * Row 11 — an unknown field in a filter's own match object must not compile — the same
 * excess-property rule as row 2's `set`. Counterpart: `scrolls/seigelense/siegelense-recipes.md`'s
 * "What the compiler enforces" table, row "an unknown field in `where`".
 */
import { dm } from './_shared';

export const badWhereField = dm.guilds.add(1, (g) => [
  g[0].quests.filter({ where: { nope: 1 } }).remove(),
]);
