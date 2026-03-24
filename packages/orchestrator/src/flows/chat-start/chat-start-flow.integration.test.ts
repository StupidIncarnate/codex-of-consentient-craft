import { GuildIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';

import { ChatStartFlow } from './chat-start-flow';

describe('ChatStartFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();

  describe('export', () => {
    it('VALID: ChatStartFlow => exports an async function', () => {
      expect(typeof ChatStartFlow).toBe('function');
    });
  });

  describe('delegation to responder', () => {
    it('ERROR: {guildId: nonexistent, message} => throws guild not found', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'chat-start-1' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const error = await ChatStartFlow({ guildId, message: 'Help me build auth' }).catch(
        (thrown: unknown) => thrown,
      );

      restore();

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/Guild not found/u);
    });

    it('ERROR: {guildId: nonexistent, message, sessionId} => with optional sessionId, throws guild not found', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'chat-start-2' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const sessionId = SessionIdStub({ value: 'session-abc123' });
      const error = await ChatStartFlow({ guildId, message: 'Continue our chat', sessionId }).catch(
        (thrown: unknown) => thrown,
      );

      restore();

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/Guild not found/u);
    });
  });
});
