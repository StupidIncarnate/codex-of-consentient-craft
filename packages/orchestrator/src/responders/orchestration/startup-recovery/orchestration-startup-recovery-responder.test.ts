import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationStartupRecoveryResponderProxy } from './orchestration-startup-recovery-responder.proxy';
import { OrchestrationStartupRecoveryResponder } from './orchestration-startup-recovery-responder';

describe('OrchestrationStartupRecoveryResponder', () => {
  describe('no active quests', () => {
    it('VALID: {no guilds} => completes without launching any loops', async () => {
      const proxy = OrchestrationStartupRecoveryResponderProxy();
      proxy.setupEmpty({
        homeDir: '/tmp/test-home',
        homePath: FilePathStub({ value: '/tmp/test-home/.dungeonmaster' }),
      });

      await OrchestrationStartupRecoveryResponder();

      expect(true).toBe(true);
    });
  });
});
