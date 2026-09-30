import { ExecutionQueueBootstrapResponderStateStub } from './execution-queue-bootstrap-responder-state.stub';
import { executionQueueBootstrapResponderStateContract } from './execution-queue-bootstrap-responder-state-contract';

describe('executionQueueBootstrapResponderStateContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ExecutionQueueBootstrapResponderStateStub();

      expect(executionQueueBootstrapResponderStateContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {installed: wrong type} => throws', () => {
      expect(() =>
        executionQueueBootstrapResponderStateContract.parse({
          ...ExecutionQueueBootstrapResponderStateStub(),
          installed: 'nope',
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
