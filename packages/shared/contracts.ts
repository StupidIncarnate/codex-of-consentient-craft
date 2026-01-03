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

export * from './src/contracts/phase-status/phase-status-contract';
export * from './src/contracts/phase-status/phase-status.stub';

export * from './src/contracts/phase-type/phase-type-contract';
export * from './src/contracts/phase-type/phase-type.stub';

export * from './src/contracts/task-status/task-status-contract';
export * from './src/contracts/task-status/task-status.stub';

export * from './src/contracts/task-type/task-type-contract';
export * from './src/contracts/task-type/task-type.stub';

export * from './src/contracts/task-progress/task-progress-contract';
export * from './src/contracts/task-progress/task-progress.stub';

export * from './src/contracts/file-name/file-name-contract';
export * from './src/contracts/file-name/file-name.stub';

export * from './src/contracts/execution-log-entry/execution-log-entry-contract';
export * from './src/contracts/execution-log-entry/execution-log-entry.stub';

export * from './src/contracts/quest-phase/quest-phase-contract';
export * from './src/contracts/quest-phase/quest-phase.stub';

export * from './src/contracts/quest-task/quest-task-contract';
export * from './src/contracts/quest-task/quest-task.stub';

export * from './src/contracts/quest-phases/quest-phases-contract';
export * from './src/contracts/quest-phases/quest-phases.stub';

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
