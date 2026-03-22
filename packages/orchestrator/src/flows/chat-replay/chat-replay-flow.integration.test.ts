import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import { GuildIdStub, ProcessIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { ChatReplayFlow } from './chat-replay-flow';

const setupTestHome = ({ baseName }: { baseName: string }): (() => void) => {
  const savedDungeonmasterHome = process.env.DUNGEONMASTER_HOME;
  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: baseName }),
  });
  process.env.DUNGEONMASTER_HOME = testbed.guildPath;
  const dmDir = join(testbed.guildPath, environmentStatics.testDataDir);
  mkdirSync(dmDir, { recursive: true });
  writeFileSync(join(dmDir, 'config.json'), JSON.stringify({ guilds: [] }));

  return (): void => {
    if (savedDungeonmasterHome === undefined) {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    } else {
      process.env.DUNGEONMASTER_HOME = savedDungeonmasterHome;
    }
  };
};

describe('ChatReplayFlow', () => {
  describe('export', () => {
    it('VALID: ChatReplayFlow => exports an async function', () => {
      expect(typeof ChatReplayFlow).toBe('function');
    });
  });

  describe('delegation to responder', () => {
    it('ERROR: {guildId: nonexistent} => rejects with guild not found', async () => {
      const restore = setupTestHome({ baseName: 'chat-replay-1' });
      const sessionId = SessionIdStub({ value: 'session-replay-integration' });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const error = await ChatReplayFlow({ sessionId, guildId }).catch((thrown: unknown) => thrown);

      restore();

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/Guild not found/u);
    });

    it('ERROR: {guildId: nonexistent, chatProcessId: provided} => rejects with guild not found', async () => {
      const restore = setupTestHome({ baseName: 'chat-replay-2' });
      const sessionId = SessionIdStub({ value: 'session-replay-with-process' });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const chatProcessId = ProcessIdStub({ value: 'replay-explicit-process-id' });
      const error = await ChatReplayFlow({ sessionId, guildId, chatProcessId }).catch(
        (thrown: unknown) => thrown,
      );

      restore();

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/Guild not found/u);
    });
  });

  describe('chatProcessId passthrough', () => {
    it('ERROR: {chatProcessId: omitted} => auto-generates process id and still rejects with guild not found', async () => {
      const restore = setupTestHome({ baseName: 'chat-replay-3' });
      const sessionId = SessionIdStub({ value: 'session-no-process-id' });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const error = await ChatReplayFlow({ sessionId, guildId }).catch((thrown: unknown) => thrown);

      restore();

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/Guild not found/u);
    });
  });
});
