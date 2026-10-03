import type { StubArgument } from '@dungeonmaster/shared/@types';

import { diskItemContract } from './disk-item-contract';
import type { DiskItem } from './disk-item-contract';

export const DiskItemStub = ({ ...props }: StubArgument<DiskItem> = {}): DiskItem =>
  diskItemContract.parse({
    storeId: 'ward-run-results',
    path: '/path/to/.ward/run-1.json',
    bytes: 1024,
    mtimeMs: 1_700_000_000_000,
    protectedReason: null,
    ...props,
  });
