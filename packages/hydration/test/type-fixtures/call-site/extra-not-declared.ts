/**
 * Row 5 — an extra the ingredient never declared must not compile. `withNestedChain` is
 * `sessionIngredient`'s own extra; `questIngredient` declares none. Counterpart:
 * `scrolls/seigelense/siegelense-recipes.md`'s "What the compiler enforces" table, row "an extra the
 * ingredient never declared".
 */
import { dm } from './_shared';

export const extraNotDeclared = dm.guilds.add(1, (g) => [
  g[0].quests.add(1, (q) => [q[0].withNestedChain({ depth: 2 })]),
]);
