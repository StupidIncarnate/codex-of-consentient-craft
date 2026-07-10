/**
 * PURPOSE: Maps a work item role to its position index in the floor config array for sorting.
 *   A role can map to more than one config entry (the ward role spans both the MINI BOSS and FLOOR BOSS
 *   floors); pass the resolved floorName to disambiguate so each ward mode sorts to its own floor.
 *
 * USAGE:
 * roleToConfigIndexTransformer({role: 'codeweaver'});
 * // Returns: ConfigIndex representing position in floor config
 * roleToConfigIndexTransformer({role: 'ward', floorName: 'FLOOR BOSS'});
 * // Returns: ConfigIndex of the FLOOR BOSS (wardPosition 'last') entry, not the MINI BOSS entry
 */

import type { ConfigIndex } from '../../contracts/config-index/config-index-contract';
import { configIndexContract } from '../../contracts/config-index/config-index-contract';
import type { FloorName } from '../../contracts/floor-name/floor-name-contract';
import type { WorkItemRole } from '../../contracts/work-item-role/work-item-role-contract';
import { executionFloorConfigStatics } from '../../statics/execution-floor-config/execution-floor-config-statics';

export const roleToConfigIndexTransformer = ({
  role,
  floorName,
}: {
  role: WorkItemRole;
  floorName?: FloorName;
}): ConfigIndex => {
  const index =
    floorName === undefined
      ? executionFloorConfigStatics.floors.findIndex((f) => f.role === role)
      : executionFloorConfigStatics.floors.findIndex(
          (f) => f.role === role && f.name === floorName,
        );

  return configIndexContract.parse(
    index === -1 ? executionFloorConfigStatics.floors.length : index,
  );
};
