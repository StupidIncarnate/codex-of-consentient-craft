/**
 * PURPOSE: Defines the shape of an item that has an `id` property, used for deep upsert operations
 *
 * USAGE:
 * import type { ItemWithId } from './item-with-id-contract';
 * // Use as constraint for arrays that support id-based upsert
 */

// A structural type, never a parsed value: `ItemWithId` is only a generic constraint
// (`T extends ItemWithId`) every quest item array satisfies, and a brand would make it unsatisfiable
// by any owner's own item. `TId` is the owning item's id type.
export interface ItemWithId<TId extends string = string> {
  [key: string]: unknown;
  id: TId;
  _delete?: boolean | undefined;
}
