import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import { GuildIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { ChatStartFlow } from './chat-start-flow';

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

describe('ChatStartFlow', () => {
  describe('export', () => {
    it('VALID: ChatStartFlow => exports an async function', () => {
      expect(typeof ChatStartFlow).toBe('function');
    });
  });

  describe('delegation to responder', () => {
    it('ERROR: {guildId: nonexistent, message} => throws guild not found', async () => {
      const restore = setupTestHome({ baseName: 'chat-start-1' });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const error = await ChatStartFlow({ guildId, message: 'Help me build auth' }).catch(
        (thrown: unknown) => thrown,
      );

      restore();

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/Guild not found/u);
    });

    it('ERROR: {guildId: nonexistent, message, sessionId} => with optional sessionId, throws guild not found', async () => {
      const restore = setupTestHome({ baseName: 'chat-start-2' });
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
