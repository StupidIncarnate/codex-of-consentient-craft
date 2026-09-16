/**
 * Row 7a — the IMMEDIATE-PARENT condition: a child accessor on the wrong host. `sessions` links
 * only to `guild`, so it must not appear on a quest handle even though a guild is in the quest's
 * own ancestor chain. Counterpart: `scrolls/seigelense/proto/negative.ts`'s `childNotDeclared`.
 */
import { dm } from './_shared';

export const childWrongHost = dm.guilds.add(1, (g) => [
  g[0].quests.add(1, (q) => [q[0].sessions.add(1, () => [])]),
]);
