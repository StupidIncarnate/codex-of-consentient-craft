/**
 * Row 10 — `expect` takes only `'one' | 'some' | 'any'`; a value outside that set must not compile.
 * Counterpart: `scrolls/seigelense/siegelense-recipes.md`'s "What the compiler enforces" table, row
 * "a bad `expect` value".
 */
import { dm } from './_shared';

export const badExpect = dm.guilds.add(1, (g) => [
  g[0].quests.filter({ where: { status: 'queued' }, expect: 'exactly-two' }).remove(),
]);
