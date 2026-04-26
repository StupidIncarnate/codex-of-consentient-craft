import type { StubArgument } from '@dungeonmaster/shared/@types';
import { directoryBrowseBodyContract } from './directory-browse-body-contract';
import type { DirectoryBrowseBody } from './directory-browse-body-contract';

export const DirectoryBrowseBodyStub = ({
  ...props
}: StubArgument<DirectoryBrowseBody> = {}): DirectoryBrowseBody =>
  directoryBrowseBodyContract.parse({ ...props });
