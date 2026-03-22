import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { DesignChatStartFlow } from './design-chat-start-flow';

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

describe('DesignChatStartFlow', () => {
  describe('export', () => {
    it('VALID: DesignChatStartFlow => exports an async function', () => {
      expect(typeof DesignChatStartFlow).toBe('function');
    });
  });

  describe('delegation to responder', () => {
    it('ERROR: {guildId: nonexistent, questId, message} => throws guild not found', async () => {
      const restore = setupTestHome({ baseName: 'design-chat-1' });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const questId = QuestIdStub({ value: 'test-quest' });
      const error = await DesignChatStartFlow({
        guildId,
        questId,
        message: 'Create prototype',
      }).catch((thrown: unknown) => thrown);

      restore();

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/Guild not found/u);
    });
  });
});
