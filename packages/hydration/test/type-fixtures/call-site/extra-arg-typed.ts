/**
 * Row 6 — the right verb, the wrong argument type, must not compile. `withNestedChain` takes a
 * branded `ChainDepth` number; this passes a string. Counterpart:
 * `scrolls/seigelense/siegelense-recipes.md`'s "What the compiler enforces" table, row "a wrongly
 * typed argument to an extra".
 */
import { dm } from './_shared';

export const extraArgTyped = dm.guilds.add(1, (g) => [
  g[0].sessions.add(1, (s) => [s[0].withNestedChain({ depth: 'two' })]),
]);
