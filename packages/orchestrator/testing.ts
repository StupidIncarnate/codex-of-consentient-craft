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
export { AgentRoleStub } from './src/contracts/agent-role/agent-role.stub';
export { AgentSlotStub } from './src/contracts/agent-slot/agent-slot.stub';
export { IsoTimestampStub } from './src/contracts/iso-timestamp/iso-timestamp.stub';
export { SlotCountStub } from './src/contracts/slot-count/slot-count.stub';
export { SlotDataStub } from './src/contracts/slot-data/slot-data.stub';
export { SlotIndexStub } from './src/contracts/slot-index/slot-index.stub';
export {
  SlotManagerResultStub,
  SlotManagerResultUserInputNeededStub,
} from './src/contracts/slot-manager-result/slot-manager-result.stub';
export { SlotOperationsStub } from './src/contracts/slot-operations/slot-operations.stub';
export { StreamJsonLineStub } from './src/contracts/stream-json-line/stream-json-line.stub';
export { StreamSignalStub } from './src/contracts/stream-signal/stream-signal.stub';
export { TimeoutMsStub } from './src/contracts/timeout-ms/timeout-ms.stub';
