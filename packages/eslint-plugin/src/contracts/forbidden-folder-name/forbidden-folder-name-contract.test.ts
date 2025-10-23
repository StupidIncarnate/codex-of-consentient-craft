import { ForbiddenFolderNameStub } from './forbidden-folder-name.stub';

describe('ForbiddenFolderNameStub', () => {
  it('VALID: {value: "utils"} => returns branded ForbiddenFolderName', () => {
    const result = ForbiddenFolderNameStub({ value: 'utils' });

    expect(result).toBe('utils');
  });

  it('VALID: {value: "lib"} => returns branded ForbiddenFolderName', () => {
    const result = ForbiddenFolderNameStub({ value: 'lib' });

    expect(result).toBe('lib');
  });

  it('VALID: {value: "helpers"} => returns branded ForbiddenFolderName', () => {
    const result = ForbiddenFolderNameStub({ value: 'helpers' });

    expect(result).toBe('helpers');
  });

  it('VALID: {value: ""} => returns branded ForbiddenFolderName', () => {
    const result = ForbiddenFolderNameStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: default => returns branded ForbiddenFolderName with default value', () => {
    const result = ForbiddenFolderNameStub();

    expect(typeof result).toBe('string');
  });

  it('INVALID: {value: number} => throws ZodError with "Expected string"', () => {
    expect(() => {
      return ForbiddenFolderNameStub({ value: 123 as never });
    }).toThrow(/Expected string/u);
  });
});
