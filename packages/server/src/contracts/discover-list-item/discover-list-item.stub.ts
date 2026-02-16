/**
 * PURPOSE: Creates test data for discover list items with name, type, and optional purpose
 *
 * USAGE:
 * const item = DiscoverListItemStub({ name: 'has-permission-guard', type: 'guard', purpose: 'Validates permission' });
 * // Returns lightweight discover list item for tree view
 */
import { discoverListItemContract } from './discover-list-item-contract';
import type { DiscoverListItem } from './discover-list-item-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const DiscoverListItemStub = ({
  ...props
}: StubArgument<DiscoverListItem> = {}): DiscoverListItem =>
  discoverListItemContract.parse({
    name: 'example-guard',
    type: 'guard',
    ...props,
  });
