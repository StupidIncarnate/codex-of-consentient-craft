/**
 * Row 4 — a value that is not a status at all must not compile, distinct from row 3's real-but-
 * unreachable status. Counterpart: `scrolls/seigelense/siegelense-recipes.md`'s "What the compiler
 * enforces" table, row "a value that is not a status at all".
 */
import { dm } from './_shared';

export const notAStatus = dm.guilds.add(1, (g) => [
  g[0].quests.add(1, (q) => [q[0].set({ status: 'nonsense' })]),
]);
