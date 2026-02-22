/**
 * PURPOSE: Barrel export for test utilities (proxies) from the MCP package
 *
 * USAGE:
 * import { architectureFolderDetailBrokerProxy } from '@dungeonmaster/mcp/testing';
 */

// Subpath export entry for @dungeonmaster/mcp/testing

// Architecture Broker Proxies
export * from './src/brokers/architecture/folder-detail/architecture-folder-detail-broker.proxy';
export * from './src/brokers/architecture/syntax-rules/architecture-syntax-rules-broker.proxy';
export * from './src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.proxy';

// MCP Broker Proxies
export * from './src/brokers/mcp/discover/mcp-discover-broker.proxy';
