import {
  FilePathStub,
  GuildIdStub,
  QuestIdStub,
  QuestSourceStub,
  SmoketestRunIdStub,
  SmoketestSuiteStub,
  UrlSlugStub,
} from '@dungeonmaster/shared/contracts';

import { smoketestCaseCatalogStatics } from '../../../statics/smoketest-case-catalog/smoketest-case-catalog-statics';
import { smoketestRunState } from '../../../state/smoketest-run/smoketest-run-state';
import { SmoketestRunResponder } from './smoketest-run-responder';
import { SmoketestRunResponderProxy } from './smoketest-run-responder.proxy';

const EnqueuedRecordStub = ({
  questId,
  guildSlug,
}: {
  questId: ReturnType<typeof QuestIdStub>;
  guildSlug: ReturnType<typeof UrlSlugStub>;
}): { questId: ReturnType<typeof QuestIdStub>; guildSlug: ReturnType<typeof UrlSlugStub> } => ({
  questId,
  guildSlug,
});

const extractQuestSources = ({
  calls,
}: {
  calls: readonly unknown[][];
}): readonly ReturnType<typeof QuestSourceStub>[] =>
  calls.map((c) => {
    const [arg] = c;
    return Reflect.get(arg as object, 'questSource') as ReturnType<typeof QuestSourceStub>;
  });

const extractBundledSuites = ({
  calls,
}: {
  calls: readonly unknown[][];
}): readonly ReturnType<typeof SmoketestSuiteStub>[] =>
  calls.map((c) => {
    const [arg] = c;
    return Reflect.get(arg as object, 'suite') as ReturnType<typeof SmoketestSuiteStub>;
  });

describe('SmoketestRunResponder', () => {
  describe('concurrency guard', () => {
    it('ERROR: {concurrent run} => rejects when another run is active', async () => {
      SmoketestRunResponderProxy();
      smoketestRunState.end();
      smoketestRunState.start({
        runId: SmoketestRunIdStub(),
        suite: SmoketestSuiteStub({ value: 'mcp' }),
      });

      const promise = SmoketestRunResponder({
        suite: SmoketestSuiteStub({ value: 'signals' }),
        startPath: FilePathStub({ value: '/tmp' }),
      });

      await expect(promise).rejects.toThrow(/^Smoketest already running.*$/u);

      smoketestRunState.end();

      expect(smoketestRunState.getActive()).toBe(null);
    });

    it('VALID: {state cleanup after concurrent test} => can be ended cleanly', () => {
      smoketestRunState.end();

      expect(smoketestRunState.getActive()).toBe(null);
    });
  });

  describe('mcp suite', () => {
    it('VALID: {suite=mcp} => clears prior MCP quests, dispatches bundled-suite layer once with questSource=smoketest-mcp', async () => {
      smoketestRunState.end();
      const proxy = SmoketestRunResponderProxy();
      const guildId = GuildIdStub();
      const guildSlug = UrlSlugStub({ value: 'smoketests' });
      const bundledQuestId = QuestIdStub({ value: 'mcp-bundled-quest' });
      const bundledRecord = EnqueuedRecordStub({ questId: bundledQuestId, guildSlug });
      proxy.setupHappyPath({ guildId, guildSlug, bundledRecord });

      const result = await SmoketestRunResponder({
        suite: SmoketestSuiteStub({ value: 'mcp' }),
        startPath: FilePathStub({ value: '/tmp/proj' }),
      });

      expect(extractQuestSources({ calls: proxy.getClearPriorCallArgs() })).toStrictEqual([
        QuestSourceStub({ value: 'smoketest-mcp' }),
      ]);
      expect(extractBundledSuites({ calls: proxy.getEnqueueBundledCallArgs() })).toStrictEqual([
        SmoketestSuiteStub({ value: 'mcp' }),
      ]);
      expect(proxy.getEnqueueOrchestrationCallArgs()).toStrictEqual([]);
      expect(result).toStrictEqual({
        runId: result.runId,
        enqueued: [bundledRecord],
        results: [],
      });
    });

    it('VALID: {suite=mcp, bundled layer returns null} => responder skips that null record, enqueued is empty', async () => {
      smoketestRunState.end();
      const proxy = SmoketestRunResponderProxy();
      const guildId = GuildIdStub();
      const guildSlug = UrlSlugStub({ value: 'smoketests' });
      proxy.setupHappyPath({ guildId, guildSlug, bundledRecord: null });

      const result = await SmoketestRunResponder({
        suite: SmoketestSuiteStub({ value: 'mcp' }),
        startPath: FilePathStub({ value: '/tmp/proj' }),
      });

      expect(result.enqueued).toStrictEqual([]);
    });
  });

  describe('signals suite', () => {
    it('VALID: {suite=signals} => clears prior signals quests, dispatches bundled-suite layer once with questSource=smoketest-signals', async () => {
      smoketestRunState.end();
      const proxy = SmoketestRunResponderProxy();
      const guildId = GuildIdStub();
      const guildSlug = UrlSlugStub({ value: 'smoketests' });
      const bundledQuestId = QuestIdStub({ value: 'signals-bundled-quest' });
      const bundledRecord = EnqueuedRecordStub({ questId: bundledQuestId, guildSlug });
      proxy.setupHappyPath({ guildId, guildSlug, bundledRecord });

      const result = await SmoketestRunResponder({
        suite: SmoketestSuiteStub({ value: 'signals' }),
        startPath: FilePathStub({ value: '/tmp/proj' }),
      });

      expect(extractQuestSources({ calls: proxy.getClearPriorCallArgs() })).toStrictEqual([
        QuestSourceStub({ value: 'smoketest-signals' }),
      ]);
      expect(extractBundledSuites({ calls: proxy.getEnqueueBundledCallArgs() })).toStrictEqual([
        SmoketestSuiteStub({ value: 'signals' }),
      ]);
      expect(result.enqueued).toStrictEqual([bundledRecord]);
    });
  });

  describe('orchestration suite', () => {
    it('VALID: {suite=orchestration} => clears prior orchestration quests, dispatches orchestration-scenario layer ONCE PER scenario in smoketestCaseCatalogStatics.orchestration', async () => {
      smoketestRunState.end();
      const proxy = SmoketestRunResponderProxy();
      const guildId = GuildIdStub();
      const guildSlug = UrlSlugStub({ value: 'smoketests' });
      const expectedScenarioCount = smoketestCaseCatalogStatics.orchestration.length;
      const orchestrationRecords = smoketestCaseCatalogStatics.orchestration.map((_s, i) =>
        EnqueuedRecordStub({
          questId: QuestIdStub({ value: `orch-quest-${i}` }),
          guildSlug,
        }),
      );
      proxy.setupHappyPath({ guildId, guildSlug, orchestrationRecords });

      const result = await SmoketestRunResponder({
        suite: SmoketestSuiteStub({ value: 'orchestration' }),
        startPath: FilePathStub({ value: '/tmp/proj' }),
      });

      expect(extractQuestSources({ calls: proxy.getClearPriorCallArgs() })).toStrictEqual([
        QuestSourceStub({ value: 'smoketest-orchestration' }),
      ]);
      expect(proxy.getEnqueueBundledCallArgs()).toStrictEqual([]);

      const orchCallCount = proxy.getEnqueueOrchestrationCallArgs().length;

      expect(orchCallCount).toBe(expectedScenarioCount);
      expect(result.enqueued).toStrictEqual(orchestrationRecords);
    });
  });

  describe('all suite (combined)', () => {
    it('VALID: {suite=all} => clears all three sources in mcp/signals/orchestration order, dispatches bundled twice + orchestration N times', async () => {
      smoketestRunState.end();
      const proxy = SmoketestRunResponderProxy();
      const guildId = GuildIdStub();
      const guildSlug = UrlSlugStub({ value: 'smoketests' });
      const expectedScenarioCount = smoketestCaseCatalogStatics.orchestration.length;
      const mcpRecord = EnqueuedRecordStub({
        questId: QuestIdStub({ value: 'mcp-bundled' }),
        guildSlug,
      });
      const signalsRecord = EnqueuedRecordStub({
        questId: QuestIdStub({ value: 'signals-bundled' }),
        guildSlug,
      });
      const orchestrationRecords = smoketestCaseCatalogStatics.orchestration.map((_s, i) =>
        EnqueuedRecordStub({
          questId: QuestIdStub({ value: `orch-${i}` }),
          guildSlug,
        }),
      );
      proxy.setupHappyPath({
        guildId,
        guildSlug,
        bundledRecords: [mcpRecord, signalsRecord],
        orchestrationRecords,
      });

      const result = await SmoketestRunResponder({
        suite: SmoketestSuiteStub({ value: 'all' }),
        startPath: FilePathStub({ value: '/tmp/proj' }),
      });

      expect(extractQuestSources({ calls: proxy.getClearPriorCallArgs() })).toStrictEqual([
        QuestSourceStub({ value: 'smoketest-mcp' }),
        QuestSourceStub({ value: 'smoketest-signals' }),
        QuestSourceStub({ value: 'smoketest-orchestration' }),
      ]);
      expect(extractBundledSuites({ calls: proxy.getEnqueueBundledCallArgs() })).toStrictEqual([
        SmoketestSuiteStub({ value: 'mcp' }),
        SmoketestSuiteStub({ value: 'signals' }),
      ]);

      const orchCallCount = proxy.getEnqueueOrchestrationCallArgs().length;

      expect(orchCallCount).toBe(expectedScenarioCount);
      expect(result.enqueued).toStrictEqual([mcpRecord, signalsRecord, ...orchestrationRecords]);
    });
  });

  describe('finally cleanup', () => {
    it('VALID: {orchestration suite layer throws mid-loop} => smoketestRunState is reset to inactive', async () => {
      smoketestRunState.end();
      const proxy = SmoketestRunResponderProxy();
      const guildId = GuildIdStub();
      const guildSlug = UrlSlugStub({ value: 'smoketests' });
      proxy.setupHappyPath({ guildId, guildSlug, orchestrationRecords: [] });
      proxy.setupOrchestrationLayerRejectsOnce({ error: new Error('layer failure') });

      const promise = SmoketestRunResponder({
        suite: SmoketestSuiteStub({ value: 'orchestration' }),
        startPath: FilePathStub({ value: '/tmp/proj' }),
      });

      await expect(promise).rejects.toThrow(/^layer failure$/u);
      expect(smoketestRunState.getActive()).toBe(null);
    });

    it('VALID: {happy mcp run} => smoketestRunState is reset to inactive after success', async () => {
      smoketestRunState.end();
      const proxy = SmoketestRunResponderProxy();
      const guildId = GuildIdStub();
      const guildSlug = UrlSlugStub({ value: 'smoketests' });
      proxy.setupHappyPath({
        guildId,
        guildSlug,
        bundledRecord: EnqueuedRecordStub({
          questId: QuestIdStub({ value: 'mcp-bundled' }),
          guildSlug,
        }),
      });

      await SmoketestRunResponder({
        suite: SmoketestSuiteStub({ value: 'mcp' }),
        startPath: FilePathStub({ value: '/tmp/proj' }),
      });

      expect(smoketestRunState.getActive()).toBe(null);
    });
  });
});
