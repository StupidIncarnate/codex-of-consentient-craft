import { stepFileReferenceContract } from './step-file-reference-contract';
import { StepFileReferenceStub } from './step-file-reference.stub';

describe('stepFileReferenceContract', () => {
  describe('valid references', () => {
    it('VALID: {path, action: create} => parses successfully', () => {
      const ref = StepFileReferenceStub({
        path: 'src/brokers/user/create/user-create-broker.ts',
        action: 'create',
      });

      expect(ref).toStrictEqual({
        path: 'src/brokers/user/create/user-create-broker.ts',
        action: 'create',
      });
    });

    it('VALID: {path, action: modify} => parses successfully', () => {
      const ref = StepFileReferenceStub({
        path: 'src/contracts/user/user-contract.ts',
        action: 'modify',
      });

      expect(ref).toStrictEqual({
        path: 'src/contracts/user/user-contract.ts',
        action: 'modify',
      });
    });

    it('VALID: {stub defaults} => uses default values', () => {
      const ref = StepFileReferenceStub();

      expect(ref).toStrictEqual({
        path: 'src/brokers/user/create/user-create-broker.ts',
        action: 'create',
      });
    });
  });

  describe('invalid references', () => {
    it('INVALID_ACTION: {action: "delete"} => throws validation error', () => {
      const parseInvalidAction = (): unknown =>
        stepFileReferenceContract.parse({
          path: 'src/brokers/user/create/user-create-broker.ts',
          action: 'delete',
        });

      expect(parseInvalidAction).toThrow(/Invalid enum value/u);
    });

    it('INVALID_PATH: {path: ""} => throws validation error', () => {
      const parseEmptyPath = (): unknown =>
        stepFileReferenceContract.parse({
          path: '',
          action: 'create',
        });

      expect(parseEmptyPath).toThrow(/String must contain at least 1 character/u);
    });

    it('EMPTY: {missing path} => throws validation error', () => {
      const parseMissingPath = (): unknown =>
        stepFileReferenceContract.parse({
          action: 'create',
        });

      expect(parseMissingPath).toThrow(/Required/u);
    });
  });
});
