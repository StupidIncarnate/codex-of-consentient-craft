import { QuestIdStub } from '@dungeonmaster/shared/contracts';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';

import { FollowupChatStopFlow } from './followup-chat-stop-flow';

describe('FollowupChatStopFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();

  describe('export', () => {
    it('VALID: FollowupChatStopFlow => exports an async function', () => {
      expect(FollowupChatStopFlow).toStrictEqual(expect.any(Function));
    });
  });

  describe('delegation to responder', () => {
    it('ERROR: {questId: nonexistent} => throws quest not found, proving the flow reached the real responder', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'followup-chat-stop-1' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
      const questId = QuestIdStub({ value: 'nonexistent-quest' });

      const error = await FollowupChatStopFlow({ questId }).catch((thrown: unknown) => thrown);

      restore();

      expect((error as Error).message).toBe('Quest not found: nonexistent-quest');
    });
  });
});
