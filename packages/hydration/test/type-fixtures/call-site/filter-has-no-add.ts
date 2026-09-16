/**
 * Row 9 — `add` on a filtered set must not compile, for the same reason as row 8: a `Matched` set
 * exists only at run time. Counterpart: `scrolls/seigelense/proto/negative.ts`'s `filterHasNoAdd`.
 */
import { dm } from './_shared';
import { sessionFieldsContract } from '../dm-target';

export const filterHasNoAdd = dm.guilds.add(1, (g) => [
  g[0].sessions
    .filter({ where: { transcript: sessionFieldsContract.shape.transcript.parse('x') } })
    .add(1, () => []),
]);
