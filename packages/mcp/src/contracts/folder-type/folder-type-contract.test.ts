import { FolderTypeStub } from './folder-type.stub';

describe('folderTypeContract', () => {
  it('VALID: {value: "brokers"} => parses successfully', () => {
    const result = FolderTypeStub({ value: 'brokers' });

    expect(result).toBe('brokers');
  });

  it('VALID: {value: "contracts"} => parses successfully', () => {
    const result = FolderTypeStub({ value: 'contracts' });

    expect(result).toBe('contracts');
  });
});
