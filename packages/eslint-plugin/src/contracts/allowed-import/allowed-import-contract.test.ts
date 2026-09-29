import { allowedImportContract } from './allowed-import-contract';
import { AllowedImportStub } from './allowed-import.stub';

describe('AllowedImportStub', () => {
  it('VALID: {value: "contracts/"} => returns branded AllowedImport', () => {
    const result = AllowedImportStub({ value: 'contracts/' });

    expect(result).toBe('contracts/');
  });

  it('VALID: {value: "brokers/"} => returns branded AllowedImport', () => {
    const result = AllowedImportStub({ value: 'brokers/' });

    expect(result).toBe('brokers/');
  });

  it('INVALID: {value: "adapters/"} => throws ZodError, since no folder type allows adapters/', () => {
    expect(() => {
      allowedImportContract.parse('adapters/');
    }).toThrow('Invalid option');
  });

  it('VALID: {} => returns default "contracts/"', () => {
    const result = AllowedImportStub();

    expect(result).toBe('contracts/');
  });

  it('INVALID: {value: "invalid-value"} => throws ZodError', () => {
    expect(() => {
      allowedImportContract.parse('invalid-value');
    }).toThrow('Invalid option');
  });
});
