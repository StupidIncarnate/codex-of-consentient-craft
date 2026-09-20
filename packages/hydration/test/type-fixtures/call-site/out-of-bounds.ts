/**
 * Row 1 — an out-of-bounds index into a fixed-length tuple must not compile. `add(3, …)` mints
 * three handles; `q[3]` asks for a fourth. Counterpart: `scrolls/seigelense/siegelense-recipes.md`'s
 * mutation table ("Break" / "Caught by"), row "make `Tuple` always degrade to an array".
 */
import { dm } from './_shared';

export const outOfBounds = dm.guilds.add(1, (g) => [
  g[0].quests.add(3, (q) => {
    const overflow = q[3];
    return [g[0].remove()];
  }),
]);
