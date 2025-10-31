/**
 * PURPOSE: Barrel export file for all shared contract types and schemas
 *
 * USAGE:
 * import { absoluteFilePathContract, type AbsoluteFilePath } from '@questmaestro/shared/contracts';
 * // Returns branded Zod schemas for type-safe validation
 */

// Subpath export entry for @questmaestro/shared/contracts

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
