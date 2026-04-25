/**
 * PURPOSE: Barrel export file for all shared type guard functions
 *
 * USAGE:
 * import { isKeyOfGuard } from '@dungeonmaster/shared/guards';
 * // Returns type guard functions for runtime type checking
 */

// Subpath export entry for @dungeonmaster/shared/guards

export * from './src/guards/is-key-of/is-key-of-guard';
export * from './src/guards/has-quest-gate-content/has-quest-gate-content-guard';

// Quest Status Guards
export * from './src/guards/is-pre-execution-quest-status/is-pre-execution-quest-status-guard';
export * from './src/guards/is-pathseeker-running-quest-status/is-pathseeker-running-quest-status-guard';
export * from './src/guards/is-any-agent-running-quest-status/is-any-agent-running-quest-status-guard';
export * from './src/guards/is-actively-executing-quest-status/is-actively-executing-quest-status-guard';
export * from './src/guards/is-user-paused-quest-status/is-user-paused-quest-status-guard';
export * from './src/guards/is-quest-blocked-quest-status/is-quest-blocked-quest-status-guard';
export * from './src/guards/is-terminal-quest-status/is-terminal-quest-status-guard';
export * from './src/guards/is-completed-successfully-quest-status/is-completed-successfully-quest-status-guard';
export * from './src/guards/is-abandonable-quest-status/is-abandonable-quest-status-guard';
export * from './src/guards/is-quest-pauseable-quest-status/is-quest-pauseable-quest-status-guard';
export * from './src/guards/is-quest-resumable-quest-status/is-quest-resumable-quest-status-guard';
export * from './src/guards/is-startable-quest-status/is-startable-quest-status-guard';
export * from './src/guards/is-recoverable-quest-status/is-recoverable-quest-status-guard';
export * from './src/guards/is-auto-resumable-quest-status/is-auto-resumable-quest-status-guard';
export * from './src/guards/is-gate-approved-quest-status/is-gate-approved-quest-status-guard';
export * from './src/guards/is-design-phase-quest-status/is-design-phase-quest-status-guard';
export * from './src/guards/should-render-execution-panel-quest-status/should-render-execution-panel-quest-status-guard';
export * from './src/guards/should-show-begin-quest-modal-quest-status/should-show-begin-quest-modal-quest-status-guard';

// Work Item Status Guards
export * from './src/guards/is-terminal-work-item-status/is-terminal-work-item-status-guard';
export * from './src/guards/satisfies-dependency-work-item-status/satisfies-dependency-work-item-status-guard';
export * from './src/guards/is-active-work-item-status/is-active-work-item-status-guard';
export * from './src/guards/is-pending-work-item-status/is-pending-work-item-status-guard';
export * from './src/guards/is-complete-work-item-status/is-complete-work-item-status-guard';
export * from './src/guards/is-skipped-work-item-status/is-skipped-work-item-status-guard';
export * from './src/guards/is-failure-work-item-status/is-failure-work-item-status-guard';

// Folder Type Groups Guards
export * from './src/guards/is-valid-folder-type-groups/is-valid-folder-type-groups-guard';
