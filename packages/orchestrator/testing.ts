/**
 * PURPOSE: Barrel export for test utilities (proxies and stubs)
 *
 * USAGE:
 * import { questListBrokerProxy, StreamJsonLineStub } from '@dungeonmaster/orchestrator/testing';
 */

// Subpath export entry for @dungeonmaster/orchestrator/testing

// Broker Proxies
export * from './src/brokers/quest/list/quest-list-broker.proxy';
export * from './src/brokers/quest/load/quest-load-broker.proxy';

// Contract Stubs
export { AddQuestResultStub } from './src/contracts/add-quest-result/add-quest-result.stub';
export { GetQuestResultStub } from './src/contracts/get-quest-result/get-quest-result.stub';
export { ModifyQuestResultStub } from './src/contracts/modify-quest-result/modify-quest-result.stub';
export { AgentRoleStub } from './src/contracts/agent-role/agent-role.stub';
export { AgentSlotStub } from './src/contracts/agent-slot/agent-slot.stub';
export { IsoTimestampStub } from './src/contracts/iso-timestamp/iso-timestamp.stub';
export { SlotCountStub } from './src/contracts/slot-count/slot-count.stub';
export { SlotDataStub } from './src/contracts/slot-data/slot-data.stub';
export { SlotIndexStub } from './src/contracts/slot-index/slot-index.stub';
export { SlotManagerResultStub } from './src/contracts/slot-manager-result/slot-manager-result.stub';
export { SlotOperationsStub } from './src/contracts/slot-operations/slot-operations.stub';
export { StreamJsonLineStub } from '@dungeonmaster/shared/contracts';
export { StreamSignalStub } from './src/contracts/stream-signal/stream-signal.stub';
export { TimeoutMsStub } from '@dungeonmaster/shared/contracts';
export { WorkItemIdStub } from './src/contracts/work-item-id/work-item-id.stub';
export { WorkTrackerStub } from './src/contracts/work-tracker/work-tracker.stub';
export { FollowupDepthStub } from './src/contracts/followup-depth/followup-depth.stub';
