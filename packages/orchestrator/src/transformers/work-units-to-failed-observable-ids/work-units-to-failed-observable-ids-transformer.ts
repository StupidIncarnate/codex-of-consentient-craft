/**
 * PURPOSE: Extracts observable IDs from failed siegemaster work units
 *
 * USAGE:
 * workUnitsToFailedObservableIdsTransformer({ workUnits: failedWorkUnits });
 * // Returns array of ObservableId from siegemaster work units
 */

import type { ObservableId } from '@dungeonmaster/shared/contracts';

import type { WorkUnit } from '../../contracts/work-unit/work-unit-contract';

export const workUnitsToFailedObservableIdsTransformer = ({
  workUnits,
}: {
  workUnits: WorkUnit[];
}): ObservableId[] =>
  workUnits.flatMap((unit) =>
    unit.role === 'siegemaster'
      ? unit.flow.nodes.flatMap((n) => n.observables.map((o) => o.id))
      : [],
  );
