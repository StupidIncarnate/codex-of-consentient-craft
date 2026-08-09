import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';

import { FollowupChatStartFlow } from './followup-chat-start-flow';

describe('FollowupChatStartFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();

  describe('export', () => {
    it('VALID: FollowupChatStartFlow => exports an async function', () => {
      expect(FollowupChatStartFlow).toStrictEqual(expect.any(Function));
    });
  });

  describe('delegation to responder', () => {
    it('ERROR: {questId: nonexistent} => throws quest not found, proving the flow reached the real responder', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'followup-chat-1' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'nonexistent-quest' });
      const error = await FollowupChatStartFlow({
        guildId,
        questId,
        message: 'What did you decide about auth?',
      }).catch((thrown: unknown) => thrown);

      restore();

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Quest not found: nonexistent-quest');
    });
  });
});
