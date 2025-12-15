import { folderDetailInputContract as _folderDetailInputContract } from './folder-detail-input-contract';
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

  it('VALID: {folderType: "adapters"} => parses successfully', () => {
    const result = FolderDetailInputStub({ folderType: 'adapters' });

    expect(result).toStrictEqual({ folderType: 'adapters' });
  });
});
