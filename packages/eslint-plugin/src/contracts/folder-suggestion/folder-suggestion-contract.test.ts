import { FolderSuggestionStub } from './folder-suggestion.stub';
import { folderSuggestionContract } from './folder-suggestion-contract';

describe('FolderSuggestionStub', () => {
  it('VALID: {value: "adapters or transformers"} => returns branded FolderSuggestion', () => {
    const result = FolderSuggestionStub({ value: 'adapters or transformers' });

    expect(result).toBe('adapters or transformers');
  });

  it('VALID: {value: "adapters"} => returns branded FolderSuggestion', () => {
    const result = FolderSuggestionStub({ value: 'adapters' });

    expect(result).toBe('adapters');
  });

  it('VALID: {value: "contracts"} => returns branded FolderSuggestion', () => {
    const result = FolderSuggestionStub({ value: 'contracts' });

    expect(result).toBe('contracts');
  });

  it('VALID: {value: "distribute by function"} => returns branded FolderSuggestion', () => {
    const result = FolderSuggestionStub({ value: 'distribute by function' });

    expect(result).toBe('distribute by function');
  });

  it('VALID: {value: ""} => returns branded FolderSuggestion', () => {
    const result = FolderSuggestionStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: default => returns branded FolderSuggestion with default value', () => {
    const result = FolderSuggestionStub();

    expect(result).toBe('contracts');
  });

  it('INVALID: {value: number} => throws ZodError with "Expected string"', () => {
    expect(() => {
      return folderSuggestionContract.parse(123 as never);
    }).toThrow(/Expected string/u);
  });
});
