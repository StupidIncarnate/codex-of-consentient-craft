import { allowedImportContract } from './allowed-import-contract';
import { AllowedImportStub } from './allowed-import.stub';

describe('AllowedImportStub', () => {
  it('VALID: {value: "contracts/"} => returns branded AllowedImport', () => {
    const result = AllowedImportStub({ value: 'contracts/' });

    expect(result).toBe('contracts/');
  });

  it('VALID: {value: "adapters/"} => returns branded AllowedImport', () => {
    const result = AllowedImportStub({ value: 'adapters/' });

    expect(result).toBe('adapters/');
  });

  it('VALID: {} => returns default "contracts/"', () => {
    const result = AllowedImportStub();

    expect(result).toBe('contracts/');
  });

  it('INVALID: {value: "invalid-value"} => throws ZodError', () => {
    expect(() => {
      allowedImportContract.parse('invalid-value');
    }).toThrow('Invalid enum value');
  });
});
