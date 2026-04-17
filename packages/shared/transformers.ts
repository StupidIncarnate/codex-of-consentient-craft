/**
 * PURPOSE: Barrel export for shared transformers
 *
 * USAGE:
 * import { metadataExtractorTransformer } from '@dungeonmaster/shared/transformers';
 */

// Subpath export entry for @dungeonmaster/shared/transformers

// Metadata Extractor
export * from './src/transformers/metadata-extractor/metadata-extractor-transformer';

// Folder Dependency Tree
export * from './src/transformers/folder-dependency-tree/folder-dependency-tree-transformer';

// Name to URL Slug
export * from './src/transformers/name-to-url-slug/name-to-url-slug-transformer';

// Promise Pool
export * from './src/transformers/promise-pool/promise-pool-transformer';

// Prompt Template Assemble
export * from './src/transformers/prompt-template-assemble/prompt-template-assemble-transformer';

// Claude Project Path Encoder
export * from './src/transformers/claude-project-path-encoder/claude-project-path-encoder-transformer';

// Strip JSONL Suffix
export * from './src/transformers/strip-jsonl-suffix/strip-jsonl-suffix-transformer';

// Escape Mermaid Label
export * from './src/transformers/escape-mermaid-label/escape-mermaid-label-transformer';

// Flow to Mermaid
export * from './src/transformers/flow-to-mermaid/flow-to-mermaid-transformer';

// Quest to Text Display
export * from './src/transformers/quest-to-text-display/quest-to-text-display-transformer';

// Flow Graph to Text
export * from './src/transformers/flow-graph-to-text/flow-graph-to-text-transformer';

// Quest Contract Properties to Text
export * from './src/transformers/quest-contract-properties-to-text/quest-contract-properties-to-text-transformer';

// Stream Line to JSON Line
export * from './src/transformers/stream-line-to-json-line/stream-line-to-json-line-transformer';

// Collect Node Contracts
export * from './src/transformers/collect-node-contracts/collect-node-contracts-transformer';

// Render Mermaid Contract Property
export * from './src/transformers/render-mermaid-contract-property/render-mermaid-contract-property-transformer';

// Render Mermaid Contract Lines
export * from './src/transformers/render-mermaid-contract-lines/render-mermaid-contract-lines-transformer';

// Snake Keys to Camel Keys (recursive)
export * from './src/transformers/snake-keys-to-camel-keys/snake-keys-to-camel-keys-transformer';

// Inflate XML Strings (recursive)
export * from './src/transformers/inflate-xml-strings/inflate-xml-strings-transformer';

// Safe JSON Parse
export * from './src/transformers/safe-json-parse/safe-json-parse-transformer';
