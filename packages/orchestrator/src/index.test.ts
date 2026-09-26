import { indexProxy } from './index.proxy';
import * as orchestrator from './index';

describe('orchestrator', () => {
  // THE BARREL IS IMPORTED STATICALLY, and that is a measurement rather than a style choice.
  // `./index` pulls the whole package, so ts-jest transforms its entire module graph the first time
  // anything reaches it. A dynamic `await import('./index')` runs that transform inside the test
  // body, and ward's slow-test gate reads it as a slow TEST: 13.1s on a cold cache against
  // 5ms warm, the same work either way. A static import is transformed when jest requires this
  // file, before any test starts, so the cost lands in the suite's wall time instead.
  it('VALID: exports module', () => {
    indexProxy();

    const exportedKeys = Object.keys(orchestrator).sort();

    expect(exportedKeys).toStrictEqual([
      'BaseBranchNotFoundError',
      'QuestBranchNameTakenError',
      'StartOrchestrator',
      'addQuestInputContract',
      'addQuestResultContract',
      'agentPromptResultContract',
      'agentRoleContract',
      'dispatchPlayResponseContract',
      'dumpsterCreatePromptStatics',
      'followupDepthContract',
      'getQuestInputContract',
      'getQuestResultContract',
      'isoTimestampContract',
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
      'questSectionContract',
      'questStageContract',
      'questSummaryContract',
      'questUserAddBroker',
      'sessionIdExtractorTransformer',
      'signalFromStreamTransformer',
      'slotCountContract',
      'slotIndexContract',
      'slotManagerResultContract',
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
    ]);
  });
});
