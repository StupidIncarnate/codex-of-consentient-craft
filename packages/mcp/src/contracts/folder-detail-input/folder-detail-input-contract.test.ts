import { folderDetailInputContract } from './folder-detail-input-contract';
import { FolderDetailInputStub } from './folder-detail-input.stub';

describe('folderDetailInputContract', () => {
  it('VALID: {folderType: "brokers"} => parses successfully', () => {
    const result = FolderDetailInputStub({ folderType: 'brokers' });

    expect(result).toStrictEqual({ folderType: 'brokers' });
  });

  it('VALID: {folderType: "contracts"} => parses successfully', () => {
    const result = FolderDetailInputStub({ folderType: 'contracts' });

    expect(result).toStrictEqual({ folderType: 'contracts' });
  });

  it('VALID: {folderType: "guards"} => parses successfully', () => {
    const result = FolderDetailInputStub({ folderType: 'guards' });

    expect(result).toStrictEqual({ folderType: 'guards' });
  });

  it('VALID: {folderType: "transformers"} => parses successfully', () => {
    const result = FolderDetailInputStub({ folderType: 'transformers' });

    expect(result).toStrictEqual({ folderType: 'transformers' });
  });

  it('INVALID: {folderType: "adapters"} => throws, since adapters is not a folder type', () => {
    expect(() => {
      folderDetailInputContract.parse({ folderType: 'adapters' });
    }).toThrow(/Invalid option/u);
  });

  it('INVALID: {folderType, extra} => throws Unrecognized key error', () => {
    expect(() => {
      folderDetailInputContract.parse({ folderType: 'brokers', path: '/some/path' } as never);
    }).toThrow(/Unrecognized key/u);
  });
});
