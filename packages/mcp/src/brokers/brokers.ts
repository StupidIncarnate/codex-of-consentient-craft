/**
 * PURPOSE: Barrel export for MCP brokers consumed by other packages
 *
 * USAGE:
 * import { architectureFolderDetailBroker } from '@dungeonmaster/mcp/brokers';
 */

// Subpath export entry for @dungeonmaster/mcp/brokers

// Architecture
export * from './architecture/folder-detail/architecture-folder-detail-broker';
export * from './architecture/testing-patterns/architecture-testing-patterns-broker';

// Discover
export * from './mcp/discover/mcp-discover-broker';
