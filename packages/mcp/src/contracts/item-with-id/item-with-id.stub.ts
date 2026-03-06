import type { StubArgument } from '@dungeonmaster/shared/@types';

import { itemWithIdContract } from './item-with-id-contract';
import type { ItemWithId } from './item-with-id-contract';

export const ItemWithIdStub = ({ ...props }: StubArgument<ItemWithId> = {}): ItemWithId =>
  itemWithIdContract.parse({
    id: 'default-item',
    ...props,
  });
