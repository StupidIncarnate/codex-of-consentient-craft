import { directoryBrowseResponseDataContract } from './directory-browse-response-data-contract';
import { DirectoryBrowseResponseDataStub } from './directory-browse-response-data.stub';
import { DirectoryEntryStub } from '@dungeonmaster/shared/contracts/directory-entry/directory-entry.stub';

describe('directoryBrowseResponseDataContract', () => {
  it('VALID: {default stub} => parses one directory entry', () => {
    const result = DirectoryBrowseResponseDataStub();

    expect(directoryBrowseResponseDataContract.parse(result)).toStrictEqual([DirectoryEntryStub()]);
  });

  it('INVALID: {object instead of array} => throws validation error', () => {
    expect(() => directoryBrowseResponseDataContract.parse({})).toThrow(
      /expected array, received object/u,
    );
  });
});
