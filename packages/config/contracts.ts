/**
 * PURPOSE: Barrel export file for @dungeonmaster/config's contracts, so a cross-package test or
 * stub file can pull one via `@dungeonmaster/config/contracts` — the subpath
 * `validateExternalImportLayerBroker` grants a test/stub file automatic access to, the same way
 * `@dungeonmaster/shared/contracts` already works everywhere else in this repo.
 *
 * USAGE:
 * import { DevServerE2eProcessStub } from '@dungeonmaster/config/contracts';
 * // Returns a branded DevServerE2eProcess for test setup
 */

// Subpath export entry for @dungeonmaster/config/contracts

export * from './src/contracts/dungeonmaster-config/dungeonmaster-config-contract';
export * from './src/contracts/dungeonmaster-config/dungeonmaster-config.stub';

export * from './src/contracts/dev-server-e2e-process/dev-server-e2e-process-contract';
export * from './src/contracts/dev-server-e2e-process/dev-server-e2e-process.stub';

export * from './src/contracts/file-contents/file-contents-contract';
export * from './src/contracts/file-contents/file-contents.stub';

export * from './src/contracts/file-path/file-path-contract';
export * from './src/contracts/file-path/file-path.stub';

export * from './src/contracts/folder-config/folder-config-contract';
export * from './src/contracts/folder-config/folder-config.stub';

export * from './src/contracts/framework/framework-contract';
export * from './src/contracts/framework/framework.stub';

export * from './src/contracts/framework-presets/framework-presets-contract';
export * from './src/contracts/framework-presets/framework-presets.stub';

export * from './src/contracts/routing-library/routing-library-contract';
export * from './src/contracts/routing-library/routing-library.stub';

export * from './src/contracts/schema-library/schema-library-contract';
export * from './src/contracts/schema-library/schema-library.stub';
