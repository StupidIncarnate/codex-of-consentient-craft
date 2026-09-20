/**
 * PURPOSE: Barrel export for orchestrator brokers, reached DIRECTLY by file rather than through
 * `startup/start-orchestrator.ts`. The main `.` barrel re-exports `StartOrchestrator` from that
 * file, and importing ANY name from `.` therefore evaluates it — which runs six bootstraps at
 * module scope (a rate-limits file watcher, a 30s stale-process watchdog, …) meant for a
 * long-running server. A short-lived command that only needs a broker's pure logic pulls those
 * watchers in too and then never exits, since they hold the Node event loop open forever. Reach
 * for this subpath instead of `.` whenever the caller has no use for `StartOrchestrator`'s live
 * service surface.
 *
 * USAGE:
 * import { guildListBroker } from '@dungeonmaster/orchestrator/brokers';
 */

// Subpath export entry for @dungeonmaster/orchestrator/brokers

// Guild
export { guildAddBroker } from './src/brokers/guild/add/guild-add-broker';
export { guildListBroker } from './src/brokers/guild/list/guild-list-broker';
export { guildRemoveBroker } from './src/brokers/guild/remove/guild-remove-broker';

// Quest
export { questDeleteBroker } from './src/brokers/quest/delete/quest-delete-broker';
export { questGetBroker } from './src/brokers/quest/get/quest-get-broker';
export { questListBroker } from './src/brokers/quest/list/quest-list-broker';
export { questModifyBroker } from './src/brokers/quest/modify/quest-modify-broker';
