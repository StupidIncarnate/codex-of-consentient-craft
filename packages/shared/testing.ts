/**
 * PURPOSE: Barrel export for test utilities (proxies)
 *
 * USAGE:
 * import { architectureOverviewBrokerProxy } from '@dungeonmaster/shared/testing';
 */

// Subpath export entry for @dungeonmaster/shared/testing

// Broker Proxies
export * from './src/brokers/architecture/overview/architecture-overview-broker.proxy';
export * from './src/brokers/architecture/project-map/architecture-project-map-broker.proxy';
export * from './src/brokers/architecture/package-inventory/architecture-package-inventory-broker.proxy';
export * from './src/brokers/architecture/gateway-inventory/architecture-gateway-inventory-broker.proxy';
export * from './src/brokers/architecture/package-type-detect/architecture-package-type-detect-broker.proxy';
export * from './src/brokers/architecture/package-e2e-eligible-detect/architecture-package-e2e-eligible-detect-broker.proxy';
export * from './src/brokers/architecture/boot-tree/architecture-boot-tree-broker.proxy';
export * from './src/brokers/install/check/install-check-broker.proxy';
export * from './src/brokers/config-root/find/config-root-find-broker.proxy';
export * from './src/brokers/project-root/find/project-root-find-broker.proxy';
export * from './src/brokers/quests-folder/find/quests-folder-find-broker.proxy';
export * from './src/brokers/quests-folder/ensure/quests-folder-ensure-broker.proxy';

// Dungeonmaster Home Broker Proxies
export * from './src/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
export * from './src/brokers/dungeonmaster-home/ensure/dungeonmaster-home-ensure-broker.proxy';

// Port Broker Proxies
export * from './src/brokers/port/resolve/port-resolve-broker.proxy';
export * from './src/brokers/port/config-walk/port-config-walk-broker.proxy';
export * from './src/brokers/port/kill-listeners/port-kill-listeners-broker.proxy';

// Claude Line Normalize Broker Proxy (single funnel)
export * from './src/brokers/claude-line/normalize/claude-line-normalize-broker.proxy';

// Cwd Resolve Broker Proxy (typed-cwd brand resolver)
export * from './src/brokers/cwd/resolve/cwd-resolve-broker.proxy';

// Locations Broker Proxies
export * from './src/brokers/locations/quest-folder-path-find/locations-quest-folder-path-find-broker.proxy';
export * from './src/brokers/locations/quest-images-path-find/locations-quest-images-path-find-broker.proxy';
export * from './src/brokers/locations/ward-results-path-find/locations-ward-results-path-find-broker.proxy';
export * from './src/brokers/locations/planned-work-path-find/locations-planned-work-path-find-broker.proxy';
export * from './src/brokers/locations/claude-session-file-path-find/locations-claude-session-file-path-find-broker.proxy';
export * from './src/brokers/locations/claude-sessions-dir-find/locations-claude-sessions-dir-find-broker.proxy';
export * from './src/brokers/locations/rate-limits-snapshot-path-find/locations-rate-limits-snapshot-path-find-broker.proxy';
export * from './src/brokers/locations/rate-limits-snapshot-tmp-path-find/locations-rate-limits-snapshot-tmp-path-find-broker.proxy';
export * from './src/brokers/locations/rate-limits-history-path-find/locations-rate-limits-history-path-find-broker.proxy';
export * from './src/brokers/locations/dispatch-state-path-find/locations-dispatch-state-path-find-broker.proxy';
export * from './src/brokers/locations/dispatch-state-tmp-path-find/locations-dispatch-state-tmp-path-find-broker.proxy';
export * from './src/brokers/locations/worktree-path-find/locations-worktree-path-find-broker.proxy';
export * from './src/brokers/locations/node-modules-path-find/locations-node-modules-path-find-broker.proxy';
export * from './src/brokers/locations/claude-projects-root-find/locations-claude-projects-root-find-broker.proxy';
export * from './src/brokers/locations/usage-ledger-path-find/locations-usage-ledger-path-find-broker.proxy';
export * from './src/brokers/locations/usage-ledger-tmp-path-find/locations-usage-ledger-tmp-path-find-broker.proxy';
export * from './src/brokers/contract-index/build/contract-index-build-broker.proxy';
