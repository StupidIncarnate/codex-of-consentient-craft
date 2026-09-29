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

export * from './dungeonmaster-config/dungeonmaster-config-contract';

export * from './dev-server-e2e-process/dev-server-e2e-process-contract';

export * from './file-contents/file-contents-contract';

export * from './file-path/file-path-contract';

export * from './folder-config/folder-config-contract';

export * from './framework-presets/framework-presets-contract';

// gatewayLintConfigContract / GatewayLintConfigStub live in @dungeonmaster/shared/contracts —
// nothing outside this package imports config's copy, so this barrel re-exports neither.
