import { debugSessionBrokerResultContract } from './debug-session-broker-result-contract';
import { DebugSessionBrokerResultStub } from './debug-session-broker-result.stub';

describe('debugSessionBrokerResultContract', () => {
  describe('valid input', () => {
    it('VALID: {handler, state, invocations} => parses successfully', () => {
      const input = DebugSessionBrokerResultStub();

      const result = debugSessionBrokerResultContract.parse(input);

      expect(result).toStrictEqual({
        handler: expect.any(Function),
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
      const input = DebugSessionBrokerResultStub({
        state: {
          currentScreen: 'help',
          isExited: true,
        },
      });

      const result = debugSessionBrokerResultContract.parse(input);

      expect(result).toStrictEqual({
        handler: expect.any(Function),
        state: {
          currentScreen: 'help',
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
