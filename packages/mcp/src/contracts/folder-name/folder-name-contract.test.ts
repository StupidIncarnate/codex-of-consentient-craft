import { folderNameContract as _folderNameContract } from './folder-name-contract';
import { FolderNameStub } from './folder-name.stub';

describe('folderNameContract', () => {
  it('VALID: {value: "guards"} => parses successfully', () => {
    const result = FolderNameStub({ value: 'guards' });

    expect(result).toBe('guards');
  });

  it('VALID: {value: "brokers"} => parses successfully', () => {
    const result = FolderNameStub({ value: 'brokers' });

    expect(result).toBe('brokers');
  });

  it('VALID: {value: "transformers"} => parses successfully', () => {
    const result = FolderNameStub({ value: 'transformers' });

    expect(result).toBe('transformers');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = FolderNameStub({ value: '' });

    expect(result).toBe('');
  });
});
