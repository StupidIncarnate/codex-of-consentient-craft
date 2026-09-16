/**
 * The ALL-LINKS-SATISFIED proof `under()` itself needs: `operations` names both `quest` and
 * `guild`, but `under({ title })` names a real field that is not the link field (`guildId`), so
 * `guild` never joins the ancestor chain. `operations` must not appear just because `under()` was
 * called at all — proof that `SuppliedAncestorNames` keys on the specific link satisfied, never on
 * whether `under()` ran.
 */
import { dm } from './_shared';
import { questFieldsContract } from '../dm-target';

export const underLinksUnsatisfied = dm.quests
  .under({ title: questFieldsContract.shape.title.parse('Unrelated field') })
  .add(1, (q) => [q[0].operations.add(1, () => [])]);
