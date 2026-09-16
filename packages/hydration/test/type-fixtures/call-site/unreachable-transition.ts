/**
 * Row 3 — a real status outside the transition's own `to` list must not compile. `stalled` is a
 * real member of `dm-target.ts`'s quest `status` field, but `questIngredient` deliberately leaves
 * it off `transitions.to` — "nothing reaches it by asking". Counterpart:
 * `scrolls/seigelense/proto/negative.ts`'s `unreachableTransition`.
 */
import { dm } from './_shared';

export const unreachableTransition = dm.guilds.add(1, (g) => [
  g[0].quests.add(1, (q) => [q[0].set({ status: 'stalled' })]),
]);
