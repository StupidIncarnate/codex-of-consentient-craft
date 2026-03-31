import { GuildIdStub, ProcessIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';

import { ChatReplayFlow } from './chat-replay-flow';

describe('ChatReplayFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();

  describe('export', () => {
    it('VALID: ChatReplayFlow => exports an async function', () => {
      expect(ChatReplayFlow).toStrictEqual(expect.any(Function));
    });
  });

  describe('delegation to responder', () => {
    it('ERROR: {guildId: nonexistent} => rejects with guild not found', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'chat-replay-1' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
      const sessionId = SessionIdStub({ value: 'session-replay-integration' });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const error = await ChatReplayFlow({ sessionId, guildId }).catch((thrown: unknown) => thrown);

      restore();

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        'Guild not found: 00000000-0000-0000-0000-000000000000',
      );
    });

    it('ERROR: {guildId: nonexistent, chatProcessId: provided} => rejects with guild not found', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'chat-replay-2' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
      const sessionId = SessionIdStub({ value: 'session-replay-with-process' });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const chatProcessId = ProcessIdStub({ value: 'replay-explicit-process-id' });
      const error = await ChatReplayFlow({ sessionId, guildId, chatProcessId }).catch(
        (thrown: unknown) => thrown,
      );

      restore();

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        'Guild not found: 00000000-0000-0000-0000-000000000000',
      );
    });
  });

  describe('chatProcessId passthrough', () => {
    it('ERROR: {chatProcessId: omitted} => auto-generates process id and still rejects with guild not found', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'chat-replay-3' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
      const sessionId = SessionIdStub({ value: 'session-no-process-id' });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const error = await ChatReplayFlow({ sessionId, guildId }).catch((thrown: unknown) => thrown);

      restore();

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        'Guild not found: 00000000-0000-0000-0000-000000000000',
      );
    });
  });
});
