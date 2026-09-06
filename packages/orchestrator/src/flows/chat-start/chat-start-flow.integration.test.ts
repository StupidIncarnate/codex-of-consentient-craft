import { GuildIdStub, SessionIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { orchestrationQuestHarness } from '../../../test/harnesses/orchestration-quest/orchestration-quest.harness';

import { ChatStartFlow } from './chat-start-flow';

describe('ChatStartFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const questHelper = orchestrationQuestHarness();

  describe('export', () => {
    it('VALID: ChatStartFlow => exports an async function', () => {
      expect(ChatStartFlow).toStrictEqual(expect.any(Function));
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
      expect((error as Error).message).toBe(
        'Guild not found: 00000000-0000-0000-0000-000000000000',
      );
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
      expect((error as Error).message).toBe(
        'Guild not found: 00000000-0000-0000-0000-000000000000',
      );
    });
  });

  // Bug repro: the main quest-chat HTTP route names its quest in the URL and has already loaded
  // it — but a chat work item's sessionId is stamped ASYNCHRONOUSLY (chat-spawn-broker's
  // onSessionId callback fires only once the spawned CLI's system/init line streams back, via a
  // separate quest write). A quest whose intake item already sits at a terminal status with no
  // sessionId ever captured is exactly the shape that window leaves behind. Before this fix,
  // `existingQuestId` reached resolveChatQuestLayerBroker but nothing there read it, so a missing
  // sessionId fell all the way through to the intake-new branch and minted a SECOND, unrelated
  // quest instead of spawning into the one the caller already named.
  describe('existingQuestId — resolves into the SAME quest, never mints a new one', () => {
    it('VALID: {existingQuestId names a real quest whose chaoswhisperer item is complete with no sessionId} => ChatStartFlow resolves questId to the SAME quest', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'chat-start-existing-quest-id' }),
      });
      const home = envHarness.setupHome({ tempDir: testbed.guildPath });
      const cli = questHelper.configureFakeClaudeCli();
      const { guild, questId } = await questHelper.createGuildAndQuest({ testbed });

      await questHelper.seedFlowsAndComments({
        questId,
        flows: [],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', status: 'complete' })],
        comments: [],
      });

      const result = await ChatStartFlow({
        guildId: guild.id,
        message: 'one more thing',
        existingQuestId: questId,
      });

      cli.restore();
      home.restore();
      testbed.cleanup();

      // The load-bearing proof: under the bug, resolveChatQuestLayerBroker's intake-new branch
      // mints a FRESH random questId here — asserting equality to the id created above is exactly
      // what distinguishes "spawned into the existing quest" from "minted a second one".
      expect(result.questId).toBe(questId);
    }, 15000);
  });
});
