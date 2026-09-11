import { indexProxy } from './index.proxy';
import * as orchestrator from './index';

describe('orchestrator', () => {
  // THE BARREL IS IMPORTED STATICALLY, and that is a measurement rather than a style choice.
  // `./index` pulls the whole package, so ts-jest transforms its entire module graph the first time
  // anything reaches it. As the `await import('./index')` this used to be, that transform ran inside
  // the test body and ward's slow-test gate read it as a slow TEST: 13.1s on a cold cache against
  // 5ms warm, the same work either way. A static import is transformed when jest requires this
  // file, before any test starts, so the cost lands in the suite's wall time instead.
  //
  // IMPORT ORDER IS LOAD-BEARING. `./index.proxy` must come first: it installs the setInterval spy
  // at module scope, and start-orchestrator's passive-watcher bootstraps run at module load. Swap
  // the two lines and the real pollers start, outlive jest's per-file module reset, and write into
  // a later test file's stderr spy. The proxy's own header carries the rest.
  //
  // A timer leak-guard used to sit above this test, counting `getActiveResourcesInfo()`'s Timeouts
  // either side of the import. It is gone because it never bit: measured both ways, deleting the
  // proxy call left the count unchanged, so it passed for every tree and proved nothing about the
  // mock it was written to protect. Guarding that for real means finding what the bootstraps
  // actually register and asserting on THAT, which is a piece of work rather than a line.
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
      'questRunRiftcarverResultContract',
      'questRunWardResultContract',
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
