import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';

import { DesignChatStartFlow } from './design-chat-start-flow';

describe('DesignChatStartFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();

  describe('export', () => {
    it('VALID: DesignChatStartFlow => exports an async function', () => {
      expect(DesignChatStartFlow).toStrictEqual(expect.any(Function));
    });
  });

  describe('delegation to responder', () => {
    it('ERROR: {guildId: nonexistent, questId, message} => throws guild not found', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'design-chat-1' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const questId = QuestIdStub({ value: 'test-quest' });
      const error = await DesignChatStartFlow({
        guildId,
        questId,
        message: 'Create prototype',
      }).catch((thrown: unknown) => thrown);

      restore();

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/^Guild not found$/u);
    });
  });
});
