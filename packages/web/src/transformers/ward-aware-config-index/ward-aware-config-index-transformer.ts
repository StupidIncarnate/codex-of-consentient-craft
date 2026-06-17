/**
 * PURPOSE: Computes the floor-config sort index for a work item, resolving which of the two ward
 *   floor entries ('MINI BOSS' or 'FLOOR BOSS') applies for a ward work item based on its wardMode.
 *   Extracts the disambiguation logic so sort comparators can call it without an inline local helper
 *   (which @dungeonmaster/no-nested-functions forbids).
 *
 * USAGE:
 * wardAwareConfigIndexTransformer({ workItem: wardItem, allItemMap });
 * // Returns: ConfigIndex for the ward's floor — either MINI BOSS (8) or FLOOR BOSS (19)
 * wardAwareConfigIndexTransformer({ workItem: codeweaverItem, allItemMap });
 * // Returns: ConfigIndex for FORGE (6)
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import type { ConfigIndex } from '../../contracts/config-index/config-index-contract';
import { resolveWardFloorNameTransformer } from '../resolve-ward-floor-name/resolve-ward-floor-name-transformer';
import { roleToConfigIndexTransformer } from '../role-to-config-index/role-to-config-index-transformer';

export const wardAwareConfigIndexTransformer = ({
  workItem,
  allItemMap,
}: {
  workItem: WorkItem;
  allItemMap: Map<WorkItem['id'], WorkItem>;
}): ConfigIndex =>
  roleToConfigIndexTransformer({
    role: workItem.role,
    ...(workItem.role === 'ward'
      ? { floorName: resolveWardFloorNameTransformer({ workItem, allItemMap }) }
      : {}),
  });
