import { isFrameworkStackLineGuard } from './is-framework-stack-line-guard';

describe('isFrameworkStackLineGuard', () => {
  describe('framework lines', () => {
    it('VALID: {jest-circus line} => returns true', () => {
      const result = isFrameworkStackLineGuard({
        line: '    at callAsyncCircusFn (/home/user/project/node_modules/jest-circus/build/jestAdapterInit.js:1497:10)',
      });

      expect(result).toBe(true);
    });

    it('VALID: {jest-runner line} => returns true', () => {
      const result = isFrameworkStackLineGuard({
        line: '    at runTest (/home/user/project/node_modules/jest-runner/build/index.js:343:7)',
      });

      expect(result).toBe(true);
    });

    it('VALID: {expect/build line} => returns true', () => {
      const result = isFrameworkStackLineGuard({
        line: '    at Object.toBe (/home/user/project/node_modules/expect/build/index.js:2140:20)',
      });

      expect(result).toBe(true);
    });

    it('VALID: {new Promise anonymous} => returns true', () => {
      const result = isFrameworkStackLineGuard({
        line: '    at new Promise (<anonymous>)',
      });

      expect(result).toBe(true);
    });
  });

  describe('application lines', () => {
    it('VALID: {test file line} => returns false', () => {
      const result = isFrameworkStackLineGuard({
        line: '    at Object.<anonymous> (src/adapters/fs/mkdir/fs-mkdir-adapter.test.ts:14:58)',
      });

      expect(result).toBe(false);
    });

    it('VALID: {source file line} => returns false', () => {
      const result = isFrameworkStackLineGuard({
        line: '    at Object.<anonymous> (src/brokers/user/user-broker.ts:25:10)',
      });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {line: undefined} => returns false', () => {
      const result = isFrameworkStackLineGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {line: empty string} => returns false', () => {
      const result = isFrameworkStackLineGuard({ line: '' });

      expect(result).toBe(false);
    });
  });
});
