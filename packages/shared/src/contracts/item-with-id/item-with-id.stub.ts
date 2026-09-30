import type { StubArgument } from '../../@types/stub-argument.type';

import type { ItemWithId } from './item-with-id-contract';

// No parse: `ItemWithId` is a types-only structural constraint with no schema to parse through.
export const ItemWithIdStub = ({ ...props }: StubArgument<ItemWithId> = {}): ItemWithId => ({
  id: 'default-item',
  ...props,
});
