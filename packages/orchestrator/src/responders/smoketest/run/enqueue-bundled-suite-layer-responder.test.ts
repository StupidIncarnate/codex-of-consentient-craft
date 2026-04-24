import {
  GuildIdStub,
  QuestIdStub,
  QuestSourceStub,
  QuestStub,
  UrlSlugStub,
} from '@dungeonmaster/shared/contracts';

import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';
import { smoketestListenerState } from '../../../state/smoketest-listener/smoketest-listener-state';
import { smoketestScenarioMetaState } from '../../../state/smoketest-scenario-meta/smoketest-scenario-meta-state';
import { EnqueueBundledSuiteLayerResponder } from './enqueue-bundled-suite-layer-responder';
import { EnqueueBundledSuiteLayerResponderProxy } from './enqueue-bundled-suite-layer-responder.proxy';

describe('EnqueueBundledSuiteLayerResponder', () => {
  describe('mcp suite', () => {
    it('VALID: {suite=mcp} => hydrates a quest, enqueues it on the queue, registers listener with isOrchestration=false, registers scenario meta caseId=smoketest-suite-mcp', async () => {
      questExecutionQueueState.clear();
      smoketestListenerState.clear();
      smoketestScenarioMetaState.clear();

      const proxy = EnqueueBundledSuiteLayerResponderProxy();
      proxy.setupPassthrough();
      const hydratedQuestId = QuestIdStub({ value: 'mcp-bundled-quest' });
      proxy.setupHydrateReturnsQuestId({ questId: hydratedQuestId });
      proxy.setupLoadQuestReturns({
        quest: QuestStub({ id: hydratedQuestId, status: 'in_progress' }),
      });

      const guildId = GuildIdStub();
      const guildSlug = UrlSlugStub({ value: 'smoketests' });
      const questSource = QuestSourceStub({ value: 'smoketest-mcp' });

      const result = await EnqueueBundledSuiteLayerResponder({
        suite: 'mcp',
        questSource,
        guildId,
        guildSlug,
      });

      expect(result).toStrictEqual({ questId: hydratedQuestId, guildSlug });

      const queueQuestIds = questExecutionQueueState.getAll().map((e) => e.questId);

      expect(queueQuestIds).toStrictEqual([hydratedQuestId]);

      const listenerEntry = smoketestListenerState.get({ questId: hydratedQuestId });

      expect(listenerEntry).toStrictEqual({
        assertions: [],
        isOrchestration: false,
      });

      const meta = smoketestScenarioMetaState.get({ questId: hydratedQuestId });

      expect(meta?.caseId).toBe('smoketest-suite-mcp');
      expect(meta?.name).toBe('Smoketest: MCP');
    });
  });

  describe('signals suite', () => {
    it('VALID: {suite=signals} => caseId=smoketest-suite-signals, name="Smoketest: Signals"', async () => {
      questExecutionQueueState.clear();
      smoketestListenerState.clear();
      smoketestScenarioMetaState.clear();

      const proxy = EnqueueBundledSuiteLayerResponderProxy();
      proxy.setupPassthrough();
      const hydratedQuestId = QuestIdStub({ value: 'signals-bundled-quest' });
      proxy.setupHydrateReturnsQuestId({ questId: hydratedQuestId });
      proxy.setupLoadQuestReturns({
        quest: QuestStub({ id: hydratedQuestId, status: 'in_progress' }),
      });

      const guildSlug = UrlSlugStub({ value: 'smoketests' });

      const result = await EnqueueBundledSuiteLayerResponder({
        suite: 'signals',
        questSource: QuestSourceStub({ value: 'smoketest-signals' }),
        guildId: GuildIdStub(),
        guildSlug,
      });

      expect(result).toStrictEqual({ questId: hydratedQuestId, guildSlug });

      const meta = smoketestScenarioMetaState.get({ questId: hydratedQuestId });

      expect(meta?.caseId).toBe('smoketest-suite-signals');
      expect(meta?.name).toBe('Smoketest: Signals');
    });
  });

  describe('hydrate broker integration', () => {
    it('VALID: {suite=mcp} => questHydrateBroker called once with the forwarded guildId + questSource', async () => {
      questExecutionQueueState.clear();
      smoketestListenerState.clear();
      smoketestScenarioMetaState.clear();

      const proxy = EnqueueBundledSuiteLayerResponderProxy();
      proxy.setupPassthrough();
      const hydratedQuestId = QuestIdStub({ value: 'mcp-bundled' });
      proxy.setupHydrateReturnsQuestId({ questId: hydratedQuestId });
      proxy.setupLoadQuestReturns({
        quest: QuestStub({ id: hydratedQuestId, status: 'in_progress' }),
      });

      const guildId = GuildIdStub();
      const questSource = QuestSourceStub({ value: 'smoketest-mcp' });

      await EnqueueBundledSuiteLayerResponder({
        suite: 'mcp',
        questSource,
        guildId,
        guildSlug: UrlSlugStub({ value: 'smoketests' }),
      });

      const calls = proxy.getHydrateBrokerCallArgs();
      const callCount = calls.length;

      expect(callCount).toBe(1);

      const firstCall = calls[0]?.[0];
      const capturedGuildId = Reflect.get(firstCall as object, 'guildId');
      const capturedQuestSource = Reflect.get(firstCall as object, 'questSource');

      expect(capturedGuildId).toBe(guildId);
      expect(capturedQuestSource).toBe(questSource);
    });
  });
});
