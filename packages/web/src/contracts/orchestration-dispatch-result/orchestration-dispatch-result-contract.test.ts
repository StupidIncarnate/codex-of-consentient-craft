import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { orchestrationDispatchResultContract } from './orchestration-dispatch-result-contract';
import { OrchestrationDispatchResultStub } from './orchestration-dispatch-result.stub';

describe('orchestrationDispatchResultContract', () => {
  describe('valid results', () => {
    it('VALID: {state} => parses successfully', () => {
      const state = DispatchStateStub({ mode: 'paused' });

      const result = orchestrationDispatchResultContract.parse(
        OrchestrationDispatchResultStub({ state }),
      );

      expect(result).toStrictEqual({ state });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {state: {bad}} => throws validation error', () => {
      expect(() => orchestrationDispatchResultContract.parse({ state: { bad: 'data' } })).toThrow(
        /invalid_/u,
      );
    });

    it('INVALID: {missing state} => throws validation error', () => {
      expect(() => orchestrationDispatchResultContract.parse({})).toThrow(/state/u);
    });
  });
});
