/**
 * PURPOSE: Barrel export for MCP brokers consumed by other packages
 *
 * USAGE:
 * import { architectureFolderDetailBroker } from '@dungeonmaster/mcp/brokers';
 */

// Subpath export entry for @dungeonmaster/mcp/brokers

// Architecture
export * from './src/brokers/architecture/folder-detail/architecture-folder-detail-broker';
export * from './src/brokers/architecture/syntax-rules/architecture-syntax-rules-broker';
export * from './src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker';

// Discover
export * from './src/brokers/mcp/discover/mcp-discover-broker';
