import { CliAppScreenStub } from '../../../contracts/cli-app-screen/cli-app-screen.stub';

import { debugSessionBroker } from './debug-session-broker';
import { debugSessionBrokerProxy } from './debug-session-broker.proxy';

type CliAppScreen = ReturnType<typeof CliAppScreenStub>;

describe('debugSessionBroker', () => {
  describe('initialization', () => {
    it('VALID: {initialScreen: menu} => returns initialized session state', () => {
      debugSessionBrokerProxy();
      const initialScreen = CliAppScreenStub({ value: 'menu' });

      const result = debugSessionBroker({ initialScreen });

      expect(result).toStrictEqual({
        state: {
          currentScreen: 'menu' as CliAppScreen,
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

    it('VALID: {initialScreen: add} => returns state with add screen', () => {
      debugSessionBrokerProxy();
      const initialScreen = CliAppScreenStub({ value: 'add' });

      const result = debugSessionBroker({ initialScreen });

      expect(result).toStrictEqual({
        state: {
          currentScreen: 'add' as CliAppScreen,
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
  });
});
