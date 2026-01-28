import { debugSessionInitResultContract } from './debug-session-init-result-contract';
import { DebugSessionInitResultStub } from './debug-session-init-result.stub';

describe('debugSessionInitResultContract', () => {
  describe('valid input', () => {
    it('VALID: {state, invocations} => parses successfully', () => {
      const input = DebugSessionInitResultStub();

      const result = debugSessionInitResultContract.parse(input);

      expect(result).toStrictEqual({
        state: {
          currentScreen: 'menu',
          isExited: false,
        },
        invocations: {
          onSpawnChaoswhisperer: [],
          onResumeChaoswhisperer: [],
          onRunQuest: [],
          onExit: [],
        },
      });
    });

    it('VALID: {with custom state} => parses with overridden state', () => {
      const input = DebugSessionInitResultStub({
        state: {
          currentScreen: 'add',
          isExited: true,
        },
      });

      const result = debugSessionInitResultContract.parse(input);

      expect(result).toStrictEqual({
        state: {
          currentScreen: 'add',
          isExited: true,
        },
        invocations: {
          onSpawnChaoswhisperer: [],
          onResumeChaoswhisperer: [],
          onRunQuest: [],
          onExit: [],
        },
      });
    });
  });
});
