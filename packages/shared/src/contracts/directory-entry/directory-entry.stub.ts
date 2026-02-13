import type { StubArgument } from '@dungeonmaster/shared/@types';

import { directoryEntryContract } from './directory-entry-contract';
import type { DirectoryEntry } from './directory-entry-contract';

export const DirectoryEntryStub = ({
  ...props
}: StubArgument<DirectoryEntry> = {}): DirectoryEntry =>
  directoryEntryContract.parse({
    name: 'my-folder',
    path: '/home/user/my-folder',
    isDirectory: true,
    ...props,
  });
