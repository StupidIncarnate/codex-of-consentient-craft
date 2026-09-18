import type { StubArgument } from '@dungeonmaster/shared/@types';

import { storageReadingContract } from './storage-reading-contract';
import type { StorageReading } from './storage-reading-contract';

export const StorageReadingStub = ({
  ...props
}: StubArgument<StorageReading> = {}): StorageReading =>
  storageReadingContract.parse({
    origin: 'http://localhost:3000',
    local: {},
    session: {},
    ...props,
  });
