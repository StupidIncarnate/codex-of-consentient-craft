import { stepFileReferenceContract } from './step-file-reference-contract';
import { StepFileReferenceStub } from './step-file-reference.stub';

describe('stepFileReferenceContract', () => {
  describe('valid references', () => {
    it('VALID: {path} => parses successfully', () => {
      const ref = StepFileReferenceStub({
        path: 'src/brokers/user/create/user-create-broker.ts',
      });

      expect(ref).toStrictEqual({
        path: 'src/brokers/user/create/user-create-broker.ts',
      });
    });

    it('VALID: {stub defaults} => uses default values', () => {
      const ref = StepFileReferenceStub();

      expect(ref).toStrictEqual({
        path: 'src/brokers/user/create/user-create-broker.ts',
      });
    });
  });

  describe('invalid references', () => {
    it('INVALID_PATH: {path: ""} => throws validation error', () => {
      const parseEmptyPath = (): unknown =>
        stepFileReferenceContract.parse({
          path: '',
        });

      expect(parseEmptyPath).toThrow(/String must contain at least 1 character/u);
    });

    it('EMPTY: {missing path} => throws validation error', () => {
      const parseMissingPath = (): unknown => stepFileReferenceContract.parse({});

      expect(parseMissingPath).toThrow(/Required/u);
    });
  });
});
