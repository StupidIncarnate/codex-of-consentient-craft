/**
 * Row 9 — `add` on a filtered set must not compile, for the same reason as row 8: a `Matched` set
 * exists only at run time. Counterpart: `scrolls/seigelense/siegelense-recipes.md`'s mutation table
 * ("Break" / "Caught by"), row "drop `Matched`'s restriction so a filtered set gains `add`".
 */
import { dm } from './_shared';
import { sessionFieldsContract } from '../dm-target';

export const filterHasNoAdd = dm.guilds.add(1, (g) => [
  g[0].sessions
    .filter({ where: { transcript: sessionFieldsContract.shape.transcript.parse('x') } })
    .add(1, () => []),
]);
