/**
 * Row 2 — `set` with a field the ingredient never declared must not compile. Counterpart:
 * `scrolls/seigelense/siegelense-recipes.md`'s "What the compiler enforces" table, row "an unknown
 * field in `set`".
 */
import { dm } from './_shared';

export const unknownField = dm.guilds.add(1, (g) => [g[0].set({ nope: 1 })]);
