import { operationFlowLabelContract } from './operation-flow-label-contract';
import { OperationFlowLabelStub } from './operation-flow-label.stub';

describe('operationFlowLabelContract', () => {
  describe('valid input', () => {
    it('VALID: {value: "Send queued comment batch"} => parses the flow name', () => {
      const label = OperationFlowLabelStub({ value: 'Send queued comment batch' });

      expect(String(label)).toBe('Send queued comment batch');
    });

    it('VALID: {value: kebab flow id} => parses the raw id used as a drift fallback', () => {
      const label = OperationFlowLabelStub({ value: 'send-queued-comment-batch' });

      expect(String(label)).toBe('send-queued-comment-batch');
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {value: ""} => throws a too-small error', () => {
      expect(() => {
        return operationFlowLabelContract.parse('');
      }).toThrow(/too_small/u);
    });

    it('INVALID: {value: 42} => throws an expected-string error', () => {
      expect(() => {
        return operationFlowLabelContract.parse(42);
      }).toThrow(/Expected string/u);
    });
  });
});
