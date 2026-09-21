/**
 * PURPOSE: Computes the floor-config sort index for a work item, resolving the FLOOR BOSS entry for
 *   a ward work item. Reach for this over calling `roleToConfigIndexTransformer` straight from a
 *   sort comparator: `ward` is the one role the floor config lists twice, and resolving it inline
 *   would need a local helper, which `@dungeonmaster/no-nested-functions` forbids.
 *
 * USAGE:
 * wardAwareConfigIndexTransformer({ workItem: wardItem });
 * // Returns: ConfigIndex of the FLOOR BOSS entry
 * wardAwareConfigIndexTransformer({ workItem: codeweaverItem });
 * // Returns: ConfigIndex for FORGE
 *
 * EVERY `role: 'ward'` WORK ITEM IS A FLOOR BOSS. `wardFull` is the only family whose role is `ward`,
 * so a ward work item is always that family's scope. A `ward` STEP inside a code-changing family
 * never reaches here — its work item carries the ROLE OF ITS SCOPE (`codeweaver`, `flowrider`,
 * `siegemaster`), never `ward`.
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import type { ConfigIndex } from '../../contracts/config-index/config-index-contract';
import { floorNameContract } from '../../contracts/floor-name/floor-name-contract';
import { roleToConfigIndexTransformer } from '../role-to-config-index/role-to-config-index-transformer';

const WARD_FLOOR_NAME = 'FLOOR BOSS';

export const wardAwareConfigIndexTransformer = ({
  workItem,
}: {
  workItem: WorkItem;
}): ConfigIndex =>
  roleToConfigIndexTransformer({
    role: workItem.role,
    ...(workItem.role === 'ward' ? { floorName: floorNameContract.parse(WARD_FLOOR_NAME) } : {}),
  });
