import { folderTypeContract as _folderTypeContract } from './folder-type-contract';
import { FolderTypeStub } from './folder-type.stub';

describe('FolderTypeStub', () => {
  it('VALID: {value: "contracts"} => returns branded FolderType', () => {
    const result = FolderTypeStub({ value: 'contracts' });

    expect(result).toBe('contracts');
  });

  it('VALID: {value: "adapters"} => returns branded FolderType', () => {
    const result = FolderTypeStub({ value: 'adapters' });

    expect(result).toBe('adapters');
  });

  it('VALID: {} => returns default "contracts"', () => {
    const result = FolderTypeStub();

    expect(result).toBe('contracts');
  });

  it('INVALID: {value: "invalid-folder"} => throws ZodError', () => {
    expect(() => {
      FolderTypeStub({ value: 'invalid-folder' });
    }).toThrow('Invalid enum value');
  });
});
