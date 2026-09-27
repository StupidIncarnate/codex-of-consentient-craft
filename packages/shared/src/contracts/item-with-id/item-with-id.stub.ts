import type { StubArgument } from '../../@types/stub-argument.type';

import { itemWithIdContract } from './item-with-id-contract';
import type { ItemWithId } from './item-with-id-contract';

export const ItemWithIdStub = ({ ...props }: StubArgument<ItemWithId> = {}): ItemWithId =>
  itemWithIdContract.parse({
    id: 'default-item',
    ...props,
  });
