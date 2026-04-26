import { processIdParamsContract } from './process-id-params-contract';
import { ProcessIdParamsStub } from './process-id-params.stub';

describe('processIdParamsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {processId: "proc-12345"} => parses successfully', () => {
      const result = ProcessIdParamsStub({ processId: 'proc-12345' });

      expect(result.processId).toBe('proc-12345');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing processId} => throws validation error', () => {
      expect(() => {
        processIdParamsContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
