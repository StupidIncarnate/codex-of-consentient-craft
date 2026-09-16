/**
 * Row 8 — a filtered set has no index: how many rows a `filter` matches is a fact about the gates
 * at RUN time, not about the recipe. Counterpart: `scrolls/seigelense/proto/negative.ts`'s
 * `filterHasNoIndex`.
 */
import { dm } from './_shared';
import { sessionFieldsContract } from '../dm-target';

export const filterHasNoIndex = dm.guilds.add(1, (g) => [
  g[0].sessions.filter({ where: { transcript: sessionFieldsContract.shape.transcript.parse('x') } })[0].remove(),
]);
