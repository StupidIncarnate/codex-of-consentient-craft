import { indexProxy } from './index.proxy';

describe('orchestrator', () => {
  it('EDGE: {barrel import} => start-orchestrator module-load schedules no real interval timers', async () => {
    // indexProxy mocks the interval scheduler so start-orchestrator's module-load bootstraps
    // (rate-limits poller, stale-process watchdog, execution-queue runner) never start real
    // setInterval timers. Without it those timers outlive jest's per-file module reset and keep
    // firing for the worker's whole lifetime — the rate-limits poller writes read-errors into
    // other test files' stderr spies (notably chat-spawn).
    indexProxy();
    const timersBefore = process
      .getActiveResourcesInfo()
      .filter((resource) => resource === 'Timeout').length;

    await import('./index');

    const timersAfter = process
      .getActiveResourcesInfo()
      .filter((resource) => resource === 'Timeout').length;

    expect(timersAfter).toBe(timersBefore);
  });

  it('VALID: exports module', async () => {
    indexProxy();
    const orchestrator = await import('./index');

    const exportedKeys = Object.keys(orchestrator).sort();

    expect(exportedKeys).toStrictEqual([
      'StartOrchestrator',
      'addQuestInputContract',
      'addQuestResultContract',
      'agentPromptResultContract',
      'agentRoleContract',
      'agentSlotContract',
      'codeweaverPromptStatics',
      'dumpsterCreatePromptStatics',
      'flowriderPromptStatics',
      'followupDepthContract',
      'getQuestInputContract',
      'getQuestResultContract',
      'isoTimestampContract',
      'lawbringerPromptStatics',
      'modifyQuestInputContract',
      'modifyQuestResultContract',
      'nextStepContract',
      'orchestrationEventsState',
      'orchestrationProcessesState',
      'questFindQuestPathBroker',
      'questFolderFindBroker',
      'questGetBroker',
      'questGetServerConfigResultContract',
      'questListBroker',
      'questLoadBroker',
      'questModifyBroker',
      'questOutboxWatchBroker',
      'questRunWardResultContract',
      'questSectionContract',
      'questStageContract',
      'questUserAddBroker',
      'sessionIdExtractorTransformer',
      'siegemasterPromptStatics',
      'signalFromStreamTransformer',
      'slotCountContract',
      'slotDataContract',
      'slotIndexContract',
      'slotManagerResultContract',
      'slotOperationsContract',
      'spawnInstructionContract',
      'spiritmenderPromptStatics',
      'streamJsonLineContract',
      'streamJsonToTextTransformer',
      'streamJsonToToolUseTransformer',
      'streamSignalContract',
      'toolDisplayConfigStatics',
      'toolInputToDisplayTransformer',
      'verifyQuestCheckContract',
      'workItemIdContract',
      'workTrackerContract',
    ]);
  });
});
