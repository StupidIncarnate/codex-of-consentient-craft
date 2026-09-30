import { DirectoryEntryStub } from '@dungeonmaster/shared/contracts/directory-entry/directory-entry.stub';
import { directoryBrowseResponseDataContract } from './directory-browse-response-data-contract';
import type { DirectoryBrowseResponseData } from './directory-browse-response-data-contract';

export const DirectoryBrowseResponseDataStub = (): DirectoryBrowseResponseData =>
  directoryBrowseResponseDataContract.parse([DirectoryEntryStub()]);
