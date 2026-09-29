import { OrchestrationModeStub } from '@dungeonmaster/shared/contracts/orchestration-mode/orchestration-mode.stub';

import { orchestrationModeGetResultContract } from './orchestration-mode-get-result-contract';
import { OrchestrationModeGetResultStub } from './orchestration-mode-get-result.stub';

describe('orchestrationModeGetResultContract', () => {
  describe('valid results', () => {
    it('VALID: {default stub} => parses to claude', () => {
      const result = orchestrationModeGetResultContract.parse(OrchestrationModeGetResultStub());

      expect(result).toStrictEqual({ mode: 'claude' });
    });

    it('VALID: {mode: node} => keeps the override', () => {
      const result = orchestrationModeGetResultContract.parse(
        OrchestrationModeGetResultStub({ mode: OrchestrationModeStub({ value: 'node' }) }),
      );

      expect(result).toStrictEqual({ mode: 'node' });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {mode: "bogus"} => throws validation error', () => {
      expect(() => orchestrationModeGetResultContract.parse({ mode: 'bogus' })).toThrow(/mode/u);
    });

    it('INVALID: {missing mode} => throws validation error', () => {
      expect(() => orchestrationModeGetResultContract.parse({})).toThrow(/mode/u);
    });
  });
});
