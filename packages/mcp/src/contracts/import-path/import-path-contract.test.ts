import { importPathContract as _importPathContract } from './import-path-contract';
import { ImportPathStub } from './import-path.stub';

describe('importPathContract', () => {
  it('VALID: "statics" => parses successfully', () => {
    const result = ImportPathStub({ value: 'statics' });

    expect(result).toBe('statics');
  });

  it('VALID: "contracts" => parses successfully', () => {
    const result = ImportPathStub({ value: 'contracts' });

    expect(result).toBe('contracts');
  });

  it('VALID: "node_modules" => parses successfully', () => {
    const result = ImportPathStub({ value: 'node_modules' });

    expect(result).toBe('node_modules');
  });
});
