/**
 * PURPOSE: Barrel export for test utilities (proxies and stubs)
 *
 * USAGE:
 * import { questListBrokerProxy, StreamJsonLineStub } from '@dungeonmaster/orchestrator/testing';
 */

// Subpath export entry for @dungeonmaster/orchestrator/testing

// Broker Proxies
export * from './src/brokers/guild/add/guild-add-broker.proxy';
export * from './src/brokers/guild/list/guild-list-broker.proxy';
export * from './src/brokers/guild/remove/guild-remove-broker.proxy';
export * from './src/brokers/quest/delete/quest-delete-broker.proxy';
export * from './src/brokers/quest/get/quest-get-broker.proxy';
export * from './src/brokers/quest/human-verdict-record/quest-human-verdict-record-broker.proxy';
export * from './src/brokers/quest/list/quest-list-broker.proxy';
export * from './src/brokers/quest/load/quest-load-broker.proxy';
export * from './src/brokers/quest/modify/quest-modify-broker.proxy';
export * from './src/brokers/graph-reachability/check/graph-reachability-check-broker.proxy';

// Contract Stubs
export {
  AddQuestResultStub,
  GetQuestResultStub,
  ModifyQuestResultStub,
  QuestSummaryStub,
} from '@dungeonmaster/shared/contracts';
export { AgentRoleStub } from './src/contracts/agent-role/agent-role.stub';
export { IsoTimestampStub } from './src/contracts/iso-timestamp/iso-timestamp.stub';
export { SlotCountStub } from '@dungeonmaster/shared/contracts';
export { SlotIndexStub } from '@dungeonmaster/shared/contracts';
export { SlotManagerResultStub } from './src/contracts/slot-manager-result/slot-manager-result.stub';
export { StreamJsonLineStub } from '@dungeonmaster/shared/contracts';
export { StreamSignalStub } from './src/contracts/stream-signal/stream-signal.stub';
export { TimeoutMsStub } from '@dungeonmaster/shared/contracts';
export { WorkItemIdStub } from './src/contracts/work-item-id/work-item-id.stub';
export { FollowupDepthStub } from './src/contracts/followup-depth/followup-depth.stub';
export { NextStepStub } from './src/contracts/next-step/next-step.stub';
export { QuestGetServerConfigResultStub } from './src/contracts/quest-get-server-config-result/quest-get-server-config-result.stub';
// The `get-quest-work` return. Exported because the MCP package's own tests have to build one:
// its layer responder decides between raw markdown and JSON on which half of the result is null,
// and that branch cannot be exercised without a real view.
export { QuestWorkViewStub } from './src/contracts/quest-work-view/quest-work-view.stub';
export { SpawnInstructionStub } from './src/contracts/spawn-instruction/spawn-instruction.stub';
export { DispatchPlayResponseStub } from './src/contracts/dispatch-play-response/dispatch-play-response.stub';
