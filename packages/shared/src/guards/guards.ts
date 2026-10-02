/**
 * PURPOSE: Barrel export file for all shared type guard functions
 *
 * USAGE:
 * import { isKeyOfGuard } from '@dungeonmaster/shared/guards';
 * // Returns type guard functions for runtime type checking
 */

// Subpath export entry for @dungeonmaster/shared/guards

export * from './is-key-of/is-key-of-guard';
export * from './has-quest-gate-content/has-quest-gate-content-guard';
export * from './is-non-test-file/is-non-test-file-guard';

// Quest Status Guards
export * from './is-pre-execution-quest-status/is-pre-execution-quest-status-guard';
export * from './is-any-agent-running-quest-status/is-any-agent-running-quest-status-guard';
export * from './is-actively-executing-quest-status/is-actively-executing-quest-status-guard';
export * from './is-user-paused-quest-status/is-user-paused-quest-status-guard';
export * from './is-quest-blocked-quest-status/is-quest-blocked-quest-status-guard';
export * from './is-terminal-quest-status/is-terminal-quest-status-guard';
export * from './is-completed-successfully-quest-status/is-completed-successfully-quest-status-guard';
export * from './is-abandoned-quest-status/is-abandoned-quest-status-guard';
export * from './is-abandonable-quest-status/is-abandonable-quest-status-guard';
export * from './is-quest-pauseable-quest-status/is-quest-pauseable-quest-status-guard';
export * from './is-quest-resumable-quest-status/is-quest-resumable-quest-status-guard';
export * from './is-startable-quest-status/is-startable-quest-status-guard';
export * from './is-recoverable-quest-status/is-recoverable-quest-status-guard';
export * from './is-auto-resumable-quest-status/is-auto-resumable-quest-status-guard';
export * from './is-gate-approved-quest-status/is-gate-approved-quest-status-guard';
export * from './should-render-execution-panel-quest-status/should-render-execution-panel-quest-status-guard';
export * from './should-show-begin-quest-modal-quest-status/should-show-begin-quest-modal-quest-status-guard';
export * from './is-before-spec-approved-quest-status/is-before-spec-approved-quest-status-guard';
export * from './is-followup-chatable-quest-status/is-followup-chatable-quest-status-guard';
export * from './is-mergeable-quest-status/is-mergeable-quest-status-guard';
export * from './should-render-status-banner-quest-status/should-render-status-banner-quest-status-guard';

// Quest Chat Session Guards
export * from './is-chat-work-item-role/is-chat-work-item-role-guard';
export * from './is-post-quest-chat-work-item-role/is-post-quest-chat-work-item-role-guard';

// Work Item Spawner Guards
export * from './is-command-work-item-role/is-command-work-item-role-guard';

// Work Item Dependency Graph Guards
export * from './has-incomplete-quest-work/has-incomplete-quest-work-guard';

// Work Item Status Guards
export * from './is-terminal-work-item-status/is-terminal-work-item-status-guard';
export * from './satisfies-dependency-work-item-status/satisfies-dependency-work-item-status-guard';
export * from './is-active-work-item-status/is-active-work-item-status-guard';
export * from './is-pending-work-item-status/is-pending-work-item-status-guard';
export * from './is-complete-work-item-status/is-complete-work-item-status-guard';
export * from './is-skipped-work-item-status/is-skipped-work-item-status-guard';
export * from './is-failure-work-item-status/is-failure-work-item-status-guard';

// Boot-tree Guards
export * from './is-ws-subscriber-name/is-ws-subscriber-name-guard';
export * from './is-file-in-folder-type/is-file-in-folder-type-guard';

// Widget Tree Guards
export * from './matches-widget-file-name/matches-widget-file-name-guard';

// Package Type Detection Guards
export * from './flow-creates-hono-or-express-app/flow-creates-hono-or-express-app-guard';
export * from './has-modelcontextprotocol-dependency/has-modelcontextprotocol-dependency-guard';
export * from './has-widgets-folder/has-widgets-folder-guard';
export * from './react-in-deps/react-in-deps-guard';
export * from './has-ink-dependency/has-ink-dependency-guard';
export * from './has-hono-or-express-dependency/has-hono-or-express-dependency-guard';
export * from './startup-references-argv/startup-references-argv-guard';
export * from './flow-returns-tool-registration/flow-returns-tool-registration-guard';
export * from './startup-exports-async-namespace/startup-exports-async-namespace-guard';
export * from './is-package-e2e-eligible/is-package-e2e-eligible-guard';
export * from './is-type-only-import-clause/is-type-only-import-clause-guard';
