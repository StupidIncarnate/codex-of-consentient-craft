/**
 * PURPOSE: Maps a work item role to its position index in the floor config array for sorting
 *
 * USAGE:
 * roleToConfigIndexTransformer({role: 'codeweaver'});
 * // Returns: ConfigIndex representing position in floor config
 */

import type { ConfigIndex } from '../../contracts/config-index/config-index-contract';
import { configIndexContract } from '../../contracts/config-index/config-index-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import { executionFloorConfigStatics } from '../../statics/execution-floor-config/execution-floor-config-statics';

export const roleToConfigIndexTransformer = ({ role }: { role: ExecutionRole }): ConfigIndex => {
  const index = executionFloorConfigStatics.floors.findIndex((f) => f.role === role);

  return configIndexContract.parse(
    index === -1 ? executionFloorConfigStatics.floors.length : index,
  );
};
