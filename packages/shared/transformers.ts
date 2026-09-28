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

// Folder Name to Guild Name
export * from './src/transformers/folder-name-to-guild-name/folder-name-to-guild-name-transformer';

// Promise Pool
export * from './src/transformers/promise-pool/promise-pool-transformer';

// Prompt Template Assemble
export * from './src/transformers/prompt-template-assemble/prompt-template-assemble-transformer';

// Claude Project Path Encoder
export * from './src/transformers/claude-project-path-encoder/claude-project-path-encoder-transformer';

// Claude Path Slug Encoder
export * from './src/transformers/claude-path-slug-encoder/claude-path-slug-encoder-transformer';

// Strip JSONL Suffix
export * from './src/transformers/strip-jsonl-suffix/strip-jsonl-suffix-transformer';

// Quest to Text Display
export * from './src/transformers/quest-to-text-display/quest-to-text-display-transformer';

// Flow Graph to Text
export * from './src/transformers/flow-graph-to-text/flow-graph-to-text-transformer';

// Flow Sign-off Evidence to Text

// Quest Summary to Text (the get-quest-summary MCP tool body)
export * from './src/transformers/quest-summary-to-text/quest-summary-to-text-transformer';

// Quest Contract Properties to Text
export * from './src/transformers/quest-contract-properties-to-text/quest-contract-properties-to-text-transformer';

// Stream Line to JSON Line
export * from './src/transformers/stream-line-to-json-line/stream-line-to-json-line-transformer';

// Collect Node Contracts
export * from './src/transformers/collect-node-contracts/collect-node-contracts-transformer';

// Snake Keys to Camel Keys (recursive)
export * from './src/transformers/snake-keys-to-camel-keys/snake-keys-to-camel-keys-transformer';

// Inflate XML Strings (recursive)
export * from './src/transformers/inflate-xml-strings/inflate-xml-strings-transformer';

// Safe JSON Parse
export * from './src/transformers/safe-json-parse/safe-json-parse-transformer';
export * from './src/transformers/safe-xml-parse/safe-xml-parse-transformer';

// Next Approval Quest Status
export * from './src/transformers/next-approval-quest-status/next-approval-quest-status-transformer';

// Previous Review Quest Status
export * from './src/transformers/previous-review-quest-status/previous-review-quest-status-transformer';

// Display Header Quest Status
export * from './src/transformers/display-header-quest-status/display-header-quest-status-transformer';

// Layer File Parent Resolve
export * from './src/transformers/layer-file-parent-resolve/layer-file-parent-resolve-transformer';

// Import Statements Extract
export * from './src/transformers/import-statements-extract/import-statements-extract-transformer';

// Relative Import Resolve
export * from './src/transformers/relative-import-resolve/relative-import-resolve-transformer';

// File Path To Display Name
export * from './src/transformers/file-path-to-display-name/file-path-to-display-name-transformer';

// File Path To Symbol Name
export * from './src/transformers/file-path-to-symbol-name/file-path-to-symbol-name-transformer';

// Flow Name From File Path
export * from './src/transformers/flow-name-from-file-path/flow-name-from-file-path-transformer';

// Widget File Name Extract
export * from './src/transformers/widget-file-name-extract/widget-file-name-extract-transformer';

// Work Item Floor Ordering (shared by the web floor view and the orchestrator dispatcher)
export * from './src/transformers/compute-work-item-depths/compute-work-item-depths-transformer';
export * from './src/transformers/role-to-config-index/role-to-config-index-transformer';
export * from './src/transformers/ward-aware-config-index/ward-aware-config-index-transformer';
export * from './src/transformers/work-items-in-dispatch-order/work-items-in-dispatch-order-transformer';

// Package Dependency Graph (the orchestrator's quest-time package dependency tree — see
// packages/*/CLAUDE.md for consumers)
export * from './src/transformers/dependency-graph-find-cycle-path/dependency-graph-find-cycle-path-transformer';
export * from './src/transformers/dependency-graph-topological-order/dependency-graph-topological-order-transformer';
export * from './src/transformers/package-json-dependency-names/package-json-dependency-names-transformer';
export * from './src/transformers/dependency-graph-adjacency-build/dependency-graph-adjacency-build-transformer';
export * from './src/transformers/dependency-graph-closure-walk/dependency-graph-closure-walk-transformer';

// Package Kinds (the browser-reachability rules, and how a quest entry's stamped kind set is read)
export * from './src/transformers/package-browser-type/package-browser-type-transformer';
export * from './src/transformers/quest-package-entry-kinds/quest-package-entry-kinds-transformer';

// Path -> owning package, by longest declared `location` prefix. Shared by the contract-source
// coverage gate and the derived codeweaver ledger, which must agree on where a path lands or a
// contract refused by the gate would be one the generator silently dropped.
export * from './src/transformers/package-for-path/package-for-path-transformer';

// One PIECE of a quest contract -> its owning package (the contract's own file, or one property's).
// Lives beside package-for-path because the save-time coverage gate, the derived codeweaver ledger
// and the per-package flow slice all route contracts through this ONE answer.
export * from './src/transformers/quest-contract-source-owner/quest-contract-source-owner-transformer';

// packagesAffected -> the one-line summary every agent-facing block shares
export * from './src/transformers/quest-package-entries-to-text/quest-package-entries-to-text-transformer';

// A single flow, rendered whole, for the role that owns it (get-quest's flowId/packageName slice)
export * from './src/transformers/quest-flow-slice/quest-flow-slice-transformer';

// One SESSION -> the cwd it ran in, off the quest's own ledger. Shared by the replay read and the
// live-tail read so the two cannot disagree about where a transcript lives.
export * from './src/transformers/quest-session-cwd/quest-session-cwd-transformer';

// The graph walk both the lint rule and server boot call — a config a route cannot reach, or that
// reaches no terminal, is a quest that silently stalls rather than one that errors.
export * from './src/transformers/graph-reachability-violations/graph-reachability-violations-transformer';

// Gateway import mapping — a raw import specifier's scope-prefixed gateway path, and the root
// package.json name it derives the scope from. A caller-facing lint rule and a migration script
// both depend on this staying mechanical.
export * from './src/transformers/package-scope-from-name/package-scope-from-name-transformer';
export * from './src/transformers/gateway-path-from-import-source/gateway-path-from-import-source-transformer';

// Workspace scope, tolerant of a missing/empty root name and a caller-supplied fallback — `cli`'s
// create-package/init gateway setup and eslint-plugin's enforce-proxy-child-creation both derive
// THIS workspace's own scope through this one transformer.
export * from './src/transformers/workspace-scope-from-root-name/workspace-scope-from-root-name-transformer';

// The four-entry package.json `imports` map every workspace package needs to resolve
// `#gateway/<folder>/*` — every scaffolder that writes this field (cli's create-package, init's
// gateway step, siegelense's hydration-recipes scaffold) calls this one builder, so no scaffolder
// has to wait for a LATER install step to find and merge it in.
export * from './src/transformers/gateway-imports-field/gateway-imports-field-transformer';

// JSON File Contents — the one place every install-time JSON writer (package.json,
// .dungeonmaster.json, .mcp.json, .claude/settings.json, .agents/*.json) gets its on-disk
// formatting (2-space indent, trailing newline) from, so they cannot drift apart.
export * from './src/transformers/json-file-contents/json-file-contents-transformer';

// Pre-Edit Rule Names Extract
export * from './src/transformers/pre-edit-rule-names-extract/pre-edit-rule-names-extract-transformer';
