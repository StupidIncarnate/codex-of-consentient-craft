/**
 * PURPOSE: Barrel export file for all shared contract types and schemas
 *
 * USAGE:
 * import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
 * // Returns branded Zod schemas for type-safe validation
 */

// Subpath export entry for @dungeonmaster/shared/contracts

// File Path Contracts
export * from './src/contracts/file-path/file-path-contract';
export * from './src/contracts/file-path/file-path.stub';

export * from './src/contracts/absolute-file-path/absolute-file-path-contract';
export * from './src/contracts/absolute-file-path/absolute-file-path.stub';

export * from './src/contracts/relative-file-path/relative-file-path-contract';
export * from './src/contracts/relative-file-path/relative-file-path.stub';

// File Contents Contracts
export * from './src/contracts/file-contents/file-contents-contract';
export * from './src/contracts/file-contents/file-contents.stub';

// Identifier Contracts
export * from './src/contracts/identifier/identifier-contract';
export * from './src/contracts/identifier/identifier.stub';

// Module Path Contracts
export * from './src/contracts/module-path/module-path-contract';
export * from './src/contracts/module-path/module-path.stub';

// Error Message Contracts
export * from './src/contracts/error-message/error-message-contract';
export * from './src/contracts/error-message/error-message.stub';

// Extracted Metadata Contracts
export * from './src/contracts/extracted-metadata/extracted-metadata-contract';
export * from './src/contracts/extracted-metadata/extracted-metadata.stub';

// Folder Type Contracts
export * from './src/contracts/folder-type/folder-type-contract';
export * from './src/contracts/folder-type/folder-type.stub';

// Folder Config Contracts
export * from './src/contracts/folder-config/folder-config-contract';
export * from './src/contracts/folder-config/folder-config.stub';

// Content Text Contracts
export * from './src/contracts/content-text/content-text-contract';
export * from './src/contracts/content-text/content-text.stub';

// Import Path Contracts
export * from './src/contracts/import-path/import-path-contract';
export * from './src/contracts/import-path/import-path.stub';

// Folder Dependency Tree Contracts
export * from './src/contracts/folder-dependency-tree/folder-dependency-tree-contract';
export * from './src/contracts/folder-dependency-tree/folder-dependency-tree.stub';

// User Input Contracts
export * from './src/contracts/user-input/user-input-contract';
export * from './src/contracts/user-input/user-input.stub';

// Exit Code Contracts
export * from './src/contracts/exit-code/exit-code-contract';
export * from './src/contracts/exit-code/exit-code.stub';

// Quest Contracts
export * from './src/contracts/quest-status/quest-status-contract';
export * from './src/contracts/quest-status/quest-status.stub';

export * from './src/contracts/step-status/step-status-contract';
export * from './src/contracts/step-status/step-status.stub';

export * from './src/contracts/file-name/file-name-contract';
export * from './src/contracts/file-name/file-name.stub';

export * from './src/contracts/execution-log-entry/execution-log-entry-contract';
export * from './src/contracts/execution-log-entry/execution-log-entry.stub';

export * from './src/contracts/quest-list-item/quest-list-item-contract';
export * from './src/contracts/quest-list-item/quest-list-item.stub';

export * from './src/contracts/quest/quest-contract';
export * from './src/contracts/quest/quest.stub';

// Install Contracts
export * from './src/contracts/package-name/package-name-contract';
export * from './src/contracts/package-name/package-name.stub';

export * from './src/contracts/install-message/install-message-contract';
export * from './src/contracts/install-message/install-message.stub';

export * from './src/contracts/install-action/install-action-contract';
export * from './src/contracts/install-action/install-action.stub';

export * from './src/contracts/install-result/install-result-contract';
export * from './src/contracts/install-result/install-result.stub';

export * from './src/contracts/install-context/install-context-contract';
export * from './src/contracts/install-context/install-context.stub';

// ID Contracts (Wave 1)
export * from './src/contracts/quest-id/quest-id-contract';
export * from './src/contracts/quest-id/quest-id.stub';

export * from './src/contracts/context-id/context-id-contract';
export * from './src/contracts/context-id/context-id.stub';

export * from './src/contracts/observable-id/observable-id-contract';
export * from './src/contracts/observable-id/observable-id.stub';

export * from './src/contracts/step-id/step-id-contract';
export * from './src/contracts/step-id/step-id.stub';

export * from './src/contracts/session-id/session-id-contract';
export * from './src/contracts/session-id/session-id.stub';

export * from './src/contracts/tooling-requirement-id/tooling-requirement-id-contract';
export * from './src/contracts/tooling-requirement-id/tooling-requirement-id.stub';

export * from './src/contracts/requirement-id/requirement-id-contract';
export * from './src/contracts/requirement-id/requirement-id.stub';

export * from './src/contracts/design-decision-id/design-decision-id-contract';
export * from './src/contracts/design-decision-id/design-decision-id.stub';

// Context & Observable Contracts (Wave 1)
export * from './src/contracts/context-locator/context-locator-contract';
export * from './src/contracts/context-locator/context-locator.stub';

export * from './src/contracts/outcome-type/outcome-type-contract';
export * from './src/contracts/outcome-type/outcome-type.stub';

export * from './src/contracts/context/context-contract';
export * from './src/contracts/context/context.stub';

export * from './src/contracts/observable/observable-contract';
export * from './src/contracts/observable/observable.stub';

export * from './src/contracts/requirement/requirement-contract';
export * from './src/contracts/requirement/requirement.stub';

export * from './src/contracts/design-decision/design-decision-contract';
export * from './src/contracts/design-decision/design-decision.stub';

export * from './src/contracts/tooling-requirement/tooling-requirement-contract';
export * from './src/contracts/tooling-requirement/tooling-requirement.stub';

export * from './src/contracts/dependency-step/dependency-step-contract';
export * from './src/contracts/dependency-step/dependency-step.stub';

// Process & Orchestration Contracts
export * from './src/contracts/process-id/process-id-contract';
export * from './src/contracts/process-id/process-id.stub';

export * from './src/contracts/orchestration-slot/orchestration-slot-contract';
export * from './src/contracts/orchestration-slot/orchestration-slot.stub';

export * from './src/contracts/orchestration-status/orchestration-status-contract';
export * from './src/contracts/orchestration-status/orchestration-status.stub';

// Contract Metadata Contracts
export * from './src/contracts/contract-name/contract-name-contract';
export * from './src/contracts/contract-name/contract-name.stub';

export * from './src/contracts/quest-contract-kind/quest-contract-kind-contract';
export * from './src/contracts/quest-contract-kind/quest-contract-kind.stub';

export * from './src/contracts/quest-contract-status/quest-contract-status-contract';
export * from './src/contracts/quest-contract-status/quest-contract-status.stub';

export * from './src/contracts/quest-contract-property/quest-contract-property-contract';
export * from './src/contracts/quest-contract-property/quest-contract-property.stub';

export * from './src/contracts/quest-contract-entry/quest-contract-entry-contract';
export * from './src/contracts/quest-contract-entry/quest-contract-entry.stub';

// Orchestration Event Contracts
export * from './src/contracts/orchestration-event-type/orchestration-event-type-contract';
export * from './src/contracts/orchestration-event-type/orchestration-event-type.stub';

// WebSocket Message Contracts
export * from './src/contracts/ws-message/ws-message-contract';
export * from './src/contracts/ws-message/ws-message.stub';

// Project Contracts
export * from './src/contracts/project-id/project-id-contract';
export * from './src/contracts/project-id/project-id.stub';

export * from './src/contracts/project-name/project-name-contract';
export * from './src/contracts/project-name/project-name.stub';

export * from './src/contracts/project-path/project-path-contract';
export * from './src/contracts/project-path/project-path.stub';

export * from './src/contracts/project/project-contract';
export * from './src/contracts/project/project.stub';

export * from './src/contracts/project-list-item/project-list-item-contract';
export * from './src/contracts/project-list-item/project-list-item.stub';

export * from './src/contracts/project-config/project-config-contract';
export * from './src/contracts/project-config/project-config.stub';

export * from './src/contracts/directory-entry/directory-entry-contract';
export * from './src/contracts/directory-entry/directory-entry.stub';
