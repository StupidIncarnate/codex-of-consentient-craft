import { RegisterMonitorSessionResultStub } from '@dungeonmaster/orchestrator/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { orchestratorRegisterMonitorSessionAdapter } from './orchestrator-register-monitor-session-adapter';
import { orchestratorRegisterMonitorSessionAdapterProxy } from './orchestrator-register-monitor-session-adapter.proxy';

describe('orchestratorRegisterMonitorSessionAdapter', () => {
  describe('successful registration', () => {
    it('VALID: {sessionFilePath} => returns RegisterMonitorSessionResult', async () => {
      const proxy = orchestratorRegisterMonitorSessionAdapterProxy();
      const expected = RegisterMonitorSessionResultStub();

      proxy.returns({ result: expected });

      const result = await orchestratorRegisterMonitorSessionAdapter({
        sessionFilePath: FilePathStub({ value: '/home/user/.claude/projects/p/abc.jsonl' }),
      });

      expect(result).toStrictEqual(expected);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorRegisterMonitorSessionAdapterProxy();

      proxy.throws({ error: new Error('Session already registered') });

      await expect(
        orchestratorRegisterMonitorSessionAdapter({
          sessionFilePath: FilePathStub({ value: '/home/user/.claude/projects/p/abc.jsonl' }),
        }),
      ).rejects.toThrow(/Session already registered/u);
    });
  });
});
