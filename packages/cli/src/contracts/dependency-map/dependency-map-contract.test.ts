import { dependencyMapContract } from './dependency-map-contract';
import { DependencyMapStub } from './dependency-map.stub';

describe('dependencyMapContract', () => {
  describe('valid inputs', () => {
    it('VALID: {typescript: "^5.8.3"} => parses successfully', () => {
      const result = dependencyMapContract.parse({ typescript: '^5.8.3' });

      expect(result).toStrictEqual({ typescript: '^5.8.3' });
    });

    it('VALID: {} => parses empty object', () => {
      const result = dependencyMapContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('DependencyMapStub', () => {
    it('VALID: {} => returns default stub', () => {
      const result = DependencyMapStub();

      expect(Reflect.get(result, 'typescript')).toBe('^5.8.3');
    });
  });
});
