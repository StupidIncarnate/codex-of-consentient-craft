/**
 * PURPOSE: Barrel export for shared transformers
 *
 * USAGE:
 * import { metadataExtractorTransformer } from '@dungeonmaster/shared/transformers';
 */

// Subpath export entry for @dungeonmaster/shared/transformers

// Metadata Extractor
export * from './metadata-extractor/metadata-extractor-transformer';

// Folder Dependency Tree
export * from './folder-dependency-tree/folder-dependency-tree-transformer';

// Name to URL Slug
export * from './name-to-url-slug/name-to-url-slug-transformer';

// Folder Name to Guild Name
export * from './folder-name-to-guild-name/folder-name-to-guild-name-transformer';

// Promise Pool
export * from './promise-pool/promise-pool-transformer';

// Prompt Template Assemble
export * from './prompt-template-assemble/prompt-template-assemble-transformer';

// Claude Project Path Encoder
export * from './claude-project-path-encoder/claude-project-path-encoder-transformer';

// Claude Path Slug Encoder
export * from './claude-path-slug-encoder/claude-path-slug-encoder-transformer';

// Strip JSONL Suffix
export * from './strip-jsonl-suffix/strip-jsonl-suffix-transformer';

// Quest to Text Display
export * from './quest-to-text-display/quest-to-text-display-transformer';

// Flow Graph to Text
export * from './flow-graph-to-text/flow-graph-to-text-transformer';

// Flow Sign-off Evidence to Text

// Quest Summary to Text (the get-quest-summary MCP tool body)
export * from './quest-summary-to-text/quest-summary-to-text-transformer';

// Quest Contract Properties to Text
export * from './quest-contract-properties-to-text/quest-contract-properties-to-text-transformer';

// Stream Line to JSON Line
export * from './stream-line-to-json-line/stream-line-to-json-line-transformer';

// Collect Node Contracts
export * from './collect-node-contracts/collect-node-contracts-transformer';

// Snake Keys to Camel Keys (recursive)
export * from './snake-keys-to-camel-keys/snake-keys-to-camel-keys-transformer';

// Inflate XML Strings (recursive)
export * from './inflate-xml-strings/inflate-xml-strings-transformer';

// Safe JSON Parse
export * from './safe-json-parse/safe-json-parse-transformer';
export * from './safe-xml-parse/safe-xml-parse-transformer';

// Next Approval Quest Status
export * from './next-approval-quest-status/next-approval-quest-status-transformer';

// Previous Review Quest Status
export * from './previous-review-quest-status/previous-review-quest-status-transformer';

// Display Header Quest Status
export * from './display-header-quest-status/display-header-quest-status-transformer';

// Layer File Parent Resolve
export * from './layer-file-parent-resolve/layer-file-parent-resolve-transformer';

// Import Statements Extract
export * from './import-statements-extract/import-statements-extract-transformer';

// Relative Import Resolve
export * from './relative-import-resolve/relative-import-resolve-transformer';

// File Path To Display Name
export * from './file-path-to-display-name/file-path-to-display-name-transformer';

// File Path To Symbol Name
export * from './file-path-to-symbol-name/file-path-to-symbol-name-transformer';

// Flow Name From File Path
export * from './flow-name-from-file-path/flow-name-from-file-path-transformer';

// Widget File Name Extract
export * from './widget-file-name-extract/widget-file-name-extract-transformer';

// Work Item Floor Ordering (shared by the web floor view and the orchestrator dispatcher)
export * from './compute-work-item-depths/compute-work-item-depths-transformer';
export * from './role-to-config-index/role-to-config-index-transformer';
export * from './ward-aware-config-index/ward-aware-config-index-transformer';
export * from './work-items-in-dispatch-order/work-items-in-dispatch-order-transformer';

// Package Dependency Graph (the orchestrator's quest-time package dependency tree — see
// packages/*/CLAUDE.md for consumers)
export * from './dependency-graph-find-cycle-path/dependency-graph-find-cycle-path-transformer';
export * from './dependency-graph-topological-order/dependency-graph-topological-order-transformer';
export * from './package-json-dependency-names/package-json-dependency-names-transformer';
export * from './dependency-graph-adjacency-build/dependency-graph-adjacency-build-transformer';
export * from './dependency-graph-closure-walk/dependency-graph-closure-walk-transformer';

// Package Kinds (the browser-reachability rules, and how a quest entry's stamped kind set is read)
export * from './package-browser-type/package-browser-type-transformer';
export * from './quest-package-entry-kinds/quest-package-entry-kinds-transformer';

// Path -> owning package, by longest declared `location` prefix. Shared by the contract-source
// coverage gate and the derived codeweaver ledger, which must agree on where a path lands or a
// contract refused by the gate would be one the generator silently dropped.
export * from './package-for-path/package-for-path-transformer';

// One PIECE of a quest contract -> its owning package (the contract's own file, or one property's).
// Lives beside package-for-path because the save-time coverage gate, the derived codeweaver ledger
// and the per-package flow slice all route contracts through this ONE answer.
export * from './quest-contract-source-owner/quest-contract-source-owner-transformer';

// packagesAffected -> the one-line summary every agent-facing block shares
export * from './quest-package-entries-to-text/quest-package-entries-to-text-transformer';

// A single flow, rendered whole, for the role that owns it (get-quest's flowId/packageName slice)
export * from './quest-flow-slice/quest-flow-slice-transformer';

// One SESSION -> the cwd it ran in, off the quest's own ledger. Shared by the replay read and the
// live-tail read so the two cannot disagree about where a transcript lives.
export * from './quest-session-cwd/quest-session-cwd-transformer';

// The graph walk both the lint rule and server boot call — a config a route cannot reach, or that
// reaches no terminal, is a quest that silently stalls rather than one that errors.
export * from './graph-reachability-violations/graph-reachability-violations-transformer';

// Gateway import mapping — a raw import specifier's scope-prefixed gateway path, and the root
// package.json name it derives the scope from. A caller-facing lint rule and a migration script
// both depend on this staying mechanical.
export * from './package-scope-from-name/package-scope-from-name-transformer';
export * from './gateway-path-from-import-source/gateway-path-from-import-source-transformer';

// Workspace scope, tolerant of a missing/empty root name and a caller-supplied fallback — `cli`'s
// create-package/init gateway setup and eslint-plugin's enforce-proxy-child-creation both derive
// THIS workspace's own scope through this one transformer.
export * from './workspace-scope-from-root-name/workspace-scope-from-root-name-transformer';

// The four-entry package.json `imports` map every workspace package needs to resolve
// `#gateway/<folder>/*` — every scaffolder that writes this field (cli's create-package, init's
// gateway step, siegelense's hydration-recipes scaffold) calls this one builder, so no scaffolder
// has to wait for a LATER install step to find and merge it in.
export * from './gateway-imports-field/gateway-imports-field-transformer';

// JSON File Contents — the one place every install-time JSON writer (package.json,
// .dungeonmaster.json, .mcp.json, .claude/settings.json, .agents/*.json) gets its on-disk
// formatting (2-space indent, trailing newline) from, so they cannot drift apart.
export * from './json-file-contents/json-file-contents-transformer';

// Pre-Edit Rule Names Extract
export * from './pre-edit-rule-names-extract/pre-edit-rule-names-extract-transformer';
export * from './repo-root-from-source-path/repo-root-from-source-path-transformer';
export * from './camel-words-split/camel-words-split-transformer';
export * from './owner-index-from-sources/owner-index-from-sources-transformer';
export * from './owner-index-owners-reachable/owner-index-owners-reachable-transformer';
export * from './owner-index-name-match/owner-index-name-match-transformer';
export * from './owner-index-brand-declarers/owner-index-brand-declarers-transformer';
export * from './owner-index-field-usages/owner-index-field-usages-transformer';
