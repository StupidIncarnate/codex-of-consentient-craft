import type { StubArgument } from '@dungeonmaster/shared/@types';

import { operationItemContract } from './operation-item-contract';
import type { OperationItem } from './operation-item-contract';

export const OperationItemStub = ({ ...props }: StubArgument<OperationItem> = {}): OperationItem =>
  operationItemContract.parse({
    id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
    role: 'codeweaver',
    text: 'core: config load+validate adapter',
    status: 'pending',
    locked: false,
    ...props,
  });
