import { moduleNameContract } from './module-name-contract';
import { ModuleNameStub } from './module-name.stub';

describe('moduleNameContract', () => {
  describe('valid module names', () => {
    it('VALID: {value: "axios"} => parses successfully', () => {
      const moduleName = ModuleNameStub({ value: 'axios' });

      const result = moduleNameContract.parse(moduleName);

      expect(result).toBe('axios');
    });

    it('VALID: {value: "fs"} => parses successfully', () => {
      const moduleName = ModuleNameStub({ value: 'fs' });

      const result = moduleNameContract.parse(moduleName);

      expect(result).toBe('fs');
    });

    it('VALID: {value: "fs/promises"} => parses with slash', () => {
      const moduleName = ModuleNameStub({ value: 'fs/promises' });

      const result = moduleNameContract.parse(moduleName);

      expect(result).toBe('fs/promises');
    });

    it('VALID: {value: "@scope/package"} => parses scoped package', () => {
      const moduleName = ModuleNameStub({ value: '@scope/package' });

      const result = moduleNameContract.parse(moduleName);

      expect(result).toBe('@scope/package');
    });
  });

  describe('invalid module names', () => {
    it('INVALID_EMPTY: {value: ""} => throws validation error', () => {
      expect(() => {
        return moduleNameContract.parse('');
      }).toThrow(/String must contain at least 1 character/u);
    });
  });
});
