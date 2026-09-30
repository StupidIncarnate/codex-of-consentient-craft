import { OrchestrationBootFlowStateStub } from './orchestration-boot-flow-state.stub';
import { orchestrationBootFlowStateContract } from './orchestration-boot-flow-state-contract';

describe('orchestrationBootFlowStateContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = OrchestrationBootFlowStateStub();

      expect(orchestrationBootFlowStateContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {ran: wrong type} => throws', () => {
      expect(() =>
        orchestrationBootFlowStateContract.parse({
          ...OrchestrationBootFlowStateStub(),
          ran: 'nope',
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
