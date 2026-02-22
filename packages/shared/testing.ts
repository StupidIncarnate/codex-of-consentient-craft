/**
 * PURPOSE: Barrel export for test utilities (proxies)
 *
 * USAGE:
 * import { architectureOverviewBrokerProxy } from '@dungeonmaster/shared/testing';
 */

// Subpath export entry for @dungeonmaster/shared/testing

// Adapter Proxies
export * from './src/adapters/fs/access/fs-access-adapter.proxy';
export * from './src/adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
export * from './src/adapters/fs/mkdir/fs-mkdir-adapter.proxy';
export * from './src/adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.proxy';
export * from './src/adapters/path/dirname/path-dirname-adapter.proxy';
export * from './src/adapters/path/join/path-join-adapter.proxy';
export * from './src/adapters/os/homedir/os-homedir-adapter.proxy';
export * from './src/adapters/runtime/dynamic-import/runtime-dynamic-import-adapter.proxy';
export * from './src/adapters/child-process/spawn-capture/child-process-spawn-capture-adapter.proxy';
export * from './src/adapters/child-process/spawn-stream/child-process-spawn-stream-adapter.proxy';

// Broker Proxies
export * from './src/brokers/architecture/overview/architecture-overview-broker.proxy';
export * from './src/brokers/install/check/install-check-broker.proxy';
export * from './src/brokers/project-root/find/project-root-find-broker.proxy';
export * from './src/brokers/quests-folder/find/quests-folder-find-broker.proxy';
export * from './src/brokers/quests-folder/ensure/quests-folder-ensure-broker.proxy';

// Dungeonmaster Home Broker Proxies
export * from './src/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
export * from './src/brokers/dungeonmaster-home/ensure/dungeonmaster-home-ensure-broker.proxy';
