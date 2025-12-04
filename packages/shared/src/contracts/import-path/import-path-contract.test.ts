import { importPathContract } from './import-path-contract';
import { ImportPathStub } from './import-path.stub';

describe('importPathContract', () => {
  it('VALID: {value: "statics"} => parses successfully', () => {
    const result = ImportPathStub({ value: 'statics' });

    expect(result).toBe('statics');
  });

  it('VALID: {value: "contracts"} => parses successfully', () => {
    const result = ImportPathStub({ value: 'contracts' });

    expect(result).toBe('contracts');
  });

  it('VALID: {value: "node_modules"} => parses successfully', () => {
    const result = ImportPathStub({ value: 'node_modules' });

    expect(result).toBe('node_modules');
  });

  it('VALID: contract is defined', () => {
    expect(importPathContract).toBeDefined();
  });
});
