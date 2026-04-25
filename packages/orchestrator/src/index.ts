// Orchestrator public API - startup functions exported here
export { StartOrchestrator } from './startup/start-orchestrator';

// Quest brokers - exported for CLI package to use directly
export { questUserAddBroker } from './brokers/quest/user-add/quest-user-add-broker';
export { questGetBroker } from './brokers/quest/get/quest-get-broker';
export { questFolderFindBroker } from './brokers/quest/folder-find/quest-folder-find-broker';
export { questFindQuestPathBroker } from './brokers/quest/find-quest-path/quest-find-quest-path-broker';
export { questListBroker } from './brokers/quest/list/quest-list-broker';
export { questLoadBroker } from './brokers/quest/load/quest-load-broker';
export { questModifyBroker } from './brokers/quest/modify/quest-modify-broker';
export { questOutboxWatchBroker } from './brokers/quest/outbox-watch/quest-outbox-watch-broker';

// Quest contracts - exported for use by other packages
export {
  addQuestInputContract,
  addQuestResultContract,
  getQuestInputContract,
  getQuestResultContract,
  modifyQuestInputContract,
  modifyQuestResultContract,
  questStageContract,
  verifyQuestCheckContract,
} from '@dungeonmaster/shared/contracts';
export type {
  AddQuestInput,
  AddQuestResult,
  GetQuestInput,
  GetQuestResult,
  ModifyQuestInput,
  ModifyQuestResult,
  QuestStage,
  VerifyQuestCheck,
} from '@dungeonmaster/shared/contracts';
export { questSectionContract } from './contracts/quest-section/quest-section-contract';
export type { QuestSection } from './contracts/quest-section/quest-section-contract';

// Agent prompt contracts - exported for MCP package
export { agentPromptResultContract } from '@dungeonmaster/shared/contracts';
export type { AgentPromptResult } from '@dungeonmaster/shared/contracts';

// Prompt statics - re-exported for CLI package
export { chaoswhispererPromptStatics } from './statics/chaoswhisperer-prompt/chaoswhisperer-prompt-statics';
export { pathseekerPromptStatics } from './statics/pathseeker-prompt/pathseeker-prompt-statics';
export { codeweaverPromptStatics } from './statics/codeweaver-prompt/codeweaver-prompt-statics';
export { lawbringerPromptStatics } from './statics/lawbringer-prompt/lawbringer-prompt-statics';
export { siegemasterPromptStatics } from './statics/siegemaster-prompt/siegemaster-prompt-statics';
export { spiritmenderPromptStatics } from './statics/spiritmender-prompt/spiritmender-prompt-statics';
export { toolDisplayConfigStatics } from './statics/tool-display-config/tool-display-config-statics';

// Stream transformers for parsing Claude stream-json output
export { sessionIdExtractorTransformer } from './transformers/session-id-extractor/session-id-extractor-transformer';
export { signalFromStreamTransformer } from './transformers/signal-from-stream/signal-from-stream-transformer';
export { streamJsonToTextTransformer } from './transformers/stream-json-to-text/stream-json-to-text-transformer';
export { streamJsonToToolUseTransformer } from './transformers/stream-json-to-tool-use/stream-json-to-tool-use-transformer';
export { toolInputToDisplayTransformer } from './transformers/tool-input-to-display/tool-input-to-display-transformer';

// State - event bus for orchestration lifecycle events
export { orchestrationEventsState } from './state/orchestration-events/orchestration-events-state';

// Orchestration processes state - exported for server shutdown hooks
export { orchestrationProcessesState } from './state/orchestration-processes/orchestration-processes-state';

// Contracts - exported for use by CLI and other packages
export { agentRoleContract } from './contracts/agent-role/agent-role-contract';
export type { AgentRole } from './contracts/agent-role/agent-role-contract';

export { agentSlotContract } from './contracts/agent-slot/agent-slot-contract';
export type { AgentSlot } from './contracts/agent-slot/agent-slot-contract';

export { isoTimestampContract } from './contracts/iso-timestamp/iso-timestamp-contract';
export type { IsoTimestamp } from './contracts/iso-timestamp/iso-timestamp-contract';

export { slotCountContract } from './contracts/slot-count/slot-count-contract';
export type { SlotCount } from './contracts/slot-count/slot-count-contract';

export { slotDataContract } from './contracts/slot-data/slot-data-contract';
export type { SlotData } from './contracts/slot-data/slot-data-contract';

export { slotIndexContract } from './contracts/slot-index/slot-index-contract';
export type { SlotIndex } from './contracts/slot-index/slot-index-contract';

export { slotManagerResultContract } from './contracts/slot-manager-result/slot-manager-result-contract';
export type { SlotManagerResult } from './contracts/slot-manager-result/slot-manager-result-contract';

export { followupDepthContract } from './contracts/followup-depth/followup-depth-contract';
export type { FollowupDepth } from './contracts/followup-depth/followup-depth-contract';

export { workItemIdContract } from './contracts/work-item-id/work-item-id-contract';
export type { WorkItemId } from './contracts/work-item-id/work-item-id-contract';

export { workTrackerContract } from './contracts/work-tracker/work-tracker-contract';
export type { WorkTracker } from './contracts/work-tracker/work-tracker-contract';

export { slotOperationsContract } from './contracts/slot-operations/slot-operations-contract';
export type { SlotOperations } from './contracts/slot-operations/slot-operations-contract';

export { streamJsonLineContract } from '@dungeonmaster/shared/contracts';
export type { StreamJsonLine } from '@dungeonmaster/shared/contracts';

export { streamSignalContract } from './contracts/stream-signal/stream-signal-contract';
export type { StreamSignal } from './contracts/stream-signal/stream-signal-contract';
