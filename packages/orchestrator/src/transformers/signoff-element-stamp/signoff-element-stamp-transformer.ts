/**
 * PURPOSE: Replaces the clock reading on whichever sign-off tracks one modify-quest element is
 * writing. Since sign-off fields on elements are retired, operates on the empty signoffFields list
 * and returns the element unchanged.
 *
 * USAGE:
 * signoffElementStampTransformer({ element: { id: 'obs-1' }, at });
 * // Returns: the same element with sign-off timestamps replaced
 */
import type { ItemWithId, UnitObservation } from '@dungeonmaster/shared/contracts';

export const signoffElementStampTransformer = ({
  element,
}: {
  element: ItemWithId;
  at: UnitObservation['at'];
}): ItemWithId => ({ ...element });
