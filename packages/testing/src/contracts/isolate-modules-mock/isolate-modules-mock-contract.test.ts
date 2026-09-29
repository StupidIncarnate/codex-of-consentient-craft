import { isolateModulesMockContract } from './isolate-modules-mock-contract';
import { IsolateModulesMockStub } from './isolate-modules-mock.stub';

describe('isolateModulesMockContract', () => {
  describe('valid entries', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const entry = IsolateModulesMockStub();

      const result = isolateModulesMockContract.parse(entry);

      expect(result).toStrictEqual({ module: '/abs/module', factory: expect.any(Function) });
    });
  });

  describe('invalid entries', () => {
    it('INVALID: {module: 42} => throws validation error', () => {
      expect(() => isolateModulesMockContract.parse({ module: 42 })).toThrow(
        /expected string, received number/u,
      );
    });
  });
});
