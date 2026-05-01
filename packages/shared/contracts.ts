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

export * from './src/contracts/repo-relative-path/repo-relative-path-contract';
export * from './src/contracts/repo-relative-path/repo-relative-path.stub';

export * from './src/contracts/path-segment/path-segment-contract';
export * from './src/contracts/path-segment/path-segment.stub';

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

// Folder Type Groups Contracts
export * from './src/contracts/folder-type-groups/folder-type-groups-contract';
export * from './src/contracts/folder-type-groups/folder-type-groups.stub';

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

export * from './src/contracts/network-port/network-port-contract';
export * from './src/contracts/network-port/network-port.stub';

// Quest Contracts
export * from './src/contracts/quest-status/quest-status-contract';
export * from './src/contracts/quest-status/quest-status.stub';

export * from './src/contracts/file-name/file-name-contract';
export * from './src/contracts/file-name/file-name.stub';

export * from './src/contracts/quest-list-item/quest-list-item-contract';
export * from './src/contracts/quest-list-item/quest-list-item.stub';

export * from './src/contracts/quest/quest-contract';
export * from './src/contracts/quest/quest.stub';

// Quest Source Contracts
export * from './src/contracts/quest-source/quest-source-contract';
export * from './src/contracts/quest-source/quest-source.stub';

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

export * from './src/contracts/observable-id/observable-id-contract';
export * from './src/contracts/observable-id/observable-id.stub';

export * from './src/contracts/step-id/step-id-contract';
export * from './src/contracts/step-id/step-id.stub';

export * from './src/contracts/session-id/session-id-contract';
export * from './src/contracts/session-id/session-id.stub';

export * from './src/contracts/tooling-requirement-id/tooling-requirement-id-contract';
export * from './src/contracts/tooling-requirement-id/tooling-requirement-id.stub';

export * from './src/contracts/design-decision-id/design-decision-id-contract';
export * from './src/contracts/design-decision-id/design-decision-id.stub';

export * from './src/contracts/flow-id/flow-id-contract';
export * from './src/contracts/flow-id/flow-id.stub';

// Flow Contracts
export * from './src/contracts/flow/flow-contract';
export * from './src/contracts/flow/flow.stub';

export * from './src/contracts/flow-type/flow-type-contract';
export * from './src/contracts/flow-type/flow-type.stub';

// Outcome Type Contracts
export * from './src/contracts/outcome-type/outcome-type-contract';
export * from './src/contracts/outcome-type/outcome-type.stub';

// Flow Graph Contracts
export * from './src/contracts/flow-node-id/flow-node-id-contract';
export * from './src/contracts/flow-node-id/flow-node-id.stub';

export * from './src/contracts/flow-node-type/flow-node-type-contract';
export * from './src/contracts/flow-node-type/flow-node-type.stub';

export * from './src/contracts/flow-observable/flow-observable-contract';
export * from './src/contracts/flow-observable/flow-observable.stub';

export * from './src/contracts/flow-node/flow-node-contract';
export * from './src/contracts/flow-node/flow-node.stub';

export * from './src/contracts/flow-edge-ref/flow-edge-ref-contract';
export * from './src/contracts/flow-edge-ref/flow-edge-ref.stub';

export * from './src/contracts/flow-edge-id/flow-edge-id-contract';
export * from './src/contracts/flow-edge-id/flow-edge-id.stub';

export * from './src/contracts/flow-edge/flow-edge-contract';
export * from './src/contracts/flow-edge/flow-edge.stub';

export * from './src/contracts/design-decision/design-decision-contract';
export * from './src/contracts/design-decision/design-decision.stub';

export * from './src/contracts/tooling-requirement/tooling-requirement-contract';
export * from './src/contracts/tooling-requirement/tooling-requirement.stub';

export * from './src/contracts/step-assertion/step-assertion-contract';
export * from './src/contracts/step-assertion/step-assertion.stub';

export * from './src/contracts/step-file-reference/step-file-reference-contract';
export * from './src/contracts/step-file-reference/step-file-reference.stub';

export * from './src/contracts/step-focus-action-kind/step-focus-action-kind-contract';
export * from './src/contracts/step-focus-action-kind/step-focus-action-kind.stub';

export * from './src/contracts/step-focus-action/step-focus-action-contract';
export * from './src/contracts/step-focus-action/step-focus-action.stub';

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

export * from './src/contracts/quest-contract-entry-id/quest-contract-entry-id-contract';
export * from './src/contracts/quest-contract-entry-id/quest-contract-entry-id.stub';

export * from './src/contracts/quest-contract-entry/quest-contract-entry-contract';
export * from './src/contracts/quest-contract-entry/quest-contract-entry.stub';

// Orchestration Event Contracts
export * from './src/contracts/orchestration-event-type/orchestration-event-type-contract';
export * from './src/contracts/orchestration-event-type/orchestration-event-type.stub';

// WebSocket Message Contracts
export * from './src/contracts/ws-message/ws-message-contract';
export * from './src/contracts/ws-message/ws-message.stub';

// URL Slug Contracts
export * from './src/contracts/url-slug/url-slug-contract';
export * from './src/contracts/url-slug/url-slug.stub';

// Guild Contracts
export * from './src/contracts/guild-id/guild-id-contract';
export * from './src/contracts/guild-id/guild-id.stub';

export * from './src/contracts/guild-name/guild-name-contract';
export * from './src/contracts/guild-name/guild-name.stub';

export * from './src/contracts/guild-path/guild-path-contract';
export * from './src/contracts/guild-path/guild-path.stub';

export * from './src/contracts/guild/guild-contract';
export * from './src/contracts/guild/guild.stub';

export * from './src/contracts/guild-list-item/guild-list-item-contract';
export * from './src/contracts/guild-list-item/guild-list-item.stub';

export * from './src/contracts/guild-config/guild-config-contract';
export * from './src/contracts/guild-config/guild-config.stub';

export * from './src/contracts/directory-entry/directory-entry-contract';
export * from './src/contracts/directory-entry/directory-entry.stub';

// Session List Item Contracts
export * from './src/contracts/session-list-item/session-list-item-contract';
export * from './src/contracts/session-list-item/session-list-item.stub';

// CSS & Display Contracts
export * from './src/contracts/hex-color/hex-color-contract';
export * from './src/contracts/hex-color/hex-color.stub';

export * from './src/contracts/css-font-family/css-font-family-contract';
export * from './src/contracts/css-font-family/css-font-family.stub';

export * from './src/contracts/css-pixels/css-pixels-contract';
export * from './src/contracts/css-pixels/css-pixels.stub';

export * from './src/contracts/line-count/line-count-contract';
export * from './src/contracts/line-count/line-count.stub';

// File Count Contracts
export * from './src/contracts/file-count/file-count-contract';
export * from './src/contracts/file-count/file-count.stub';

// Array Index Contracts
export * from './src/contracts/array-index/array-index-contract';
export * from './src/contracts/array-index/array-index.stub';

// JSONL Stream Line Contracts
export * from './src/contracts/system-init-stream-line/system-init-stream-line-contract';
export * from './src/contracts/system-init-stream-line/system-init-stream-line.stub';

export * from './src/contracts/result-stream-line/result-stream-line-contract';
export * from './src/contracts/result-stream-line/result-stream-line.stub';

export * from './src/contracts/summary-stream-line/summary-stream-line-contract';
export * from './src/contracts/summary-stream-line/summary-stream-line.stub';

export * from './src/contracts/user-text-stream-line/user-text-stream-line-contract';
export * from './src/contracts/user-text-stream-line/user-text-stream-line.stub';

export * from './src/contracts/assistant-stream-line/assistant-stream-line-contract';
export * from './src/contracts/assistant-stream-line/assistant-stream-line.stub';

export * from './src/contracts/user-tool-result-stream-line/user-tool-result-stream-line-contract';
export * from './src/contracts/user-tool-result-stream-line/user-tool-result-stream-line.stub';

// Work Item Contracts
export * from './src/contracts/quest-work-item-id/quest-work-item-id-contract';
export * from './src/contracts/quest-work-item-id/quest-work-item-id.stub';

export * from './src/contracts/work-item-status/work-item-status-contract';
export * from './src/contracts/work-item-status/work-item-status.stub';

export * from './src/contracts/work-item-role/work-item-role-contract';
export * from './src/contracts/work-item-role/work-item-role.stub';

export * from './src/contracts/spawner-type/spawner-type-contract';
export * from './src/contracts/spawner-type/spawner-type.stub';

export * from './src/contracts/related-data-item/related-data-item-contract';
export * from './src/contracts/related-data-item/related-data-item.stub';

export * from './src/contracts/ward-result/ward-result-contract';
export * from './src/contracts/ward-result/ward-result.stub';

export * from './src/contracts/work-item/work-item-contract';
export * from './src/contracts/work-item/work-item.stub';

export * from './src/contracts/stream-signal-kind/stream-signal-kind-contract';
export * from './src/contracts/stream-signal-kind/stream-signal-kind.stub';

// Claude Queue Response Contracts
export * from './src/contracts/claude-queue-response/claude-queue-response-contract';
export * from './src/contracts/claude-queue-response/claude-queue-response.stub';

// Stream JSON Line Contracts
export * from './src/contracts/stream-json-line/stream-json-line-contract';
export * from './src/contracts/stream-json-line/stream-json-line.stub';

// Timeout Ms Contracts
export * from './src/contracts/timeout-ms/timeout-ms-contract';
export * from './src/contracts/timeout-ms/timeout-ms.stub';

// Ward Queue Response Contracts
export * from './src/contracts/ward-queue-response/ward-queue-response-contract';
export * from './src/contracts/ward-queue-response/ward-queue-response.stub';

// Ward Run ID Contracts
export * from './src/contracts/ward-run-id/ward-run-id-contract';
export * from './src/contracts/ward-run-id/ward-run-id.stub';

// Agent ID Contracts
export * from './src/contracts/agent-id/agent-id-contract';
export * from './src/contracts/agent-id/agent-id.stub';

// Adapter Result Contracts
export * from './src/contracts/adapter-result/adapter-result-contract';
export * from './src/contracts/adapter-result/adapter-result.stub';

// Glob Pattern Contracts
export * from './src/contracts/glob-pattern/glob-pattern-contract';
export * from './src/contracts/glob-pattern/glob-pattern.stub';

// Item With Id Contracts
export * from './src/contracts/item-with-id/item-with-id-contract';
export * from './src/contracts/item-with-id/item-with-id.stub';

// Agent Prompt Result Contracts
export * from './src/contracts/agent-prompt-result/agent-prompt-result-contract';
export * from './src/contracts/agent-prompt-result/agent-prompt-result.stub';

// Add Quest Result Contracts
export * from './src/contracts/add-quest-result/add-quest-result-contract';
export * from './src/contracts/add-quest-result/add-quest-result.stub';

// Add Quest Input Contracts
export * from './src/contracts/add-quest-input/add-quest-input-contract';
export * from './src/contracts/add-quest-input/add-quest-input.stub';

// Verify Quest Check Contracts
export * from './src/contracts/verify-quest-check/verify-quest-check-contract';
export * from './src/contracts/verify-quest-check/verify-quest-check.stub';

// Get Quest Result Contracts
export * from './src/contracts/get-quest-result/get-quest-result-contract';
export * from './src/contracts/get-quest-result/get-quest-result.stub';

// Modify Quest Result Contracts
export * from './src/contracts/modify-quest-result/modify-quest-result-contract';
export * from './src/contracts/modify-quest-result/modify-quest-result.stub';

// Work Item For Upsert Contracts
export * from './src/contracts/work-item-for-upsert/work-item-for-upsert-contract';
export * from './src/contracts/work-item-for-upsert/work-item-for-upsert.stub';

// Quest Stage Contracts
export * from './src/contracts/quest-stage/quest-stage-contract';
export * from './src/contracts/quest-stage/quest-stage.stub';

// Get Quest Input Contracts
export * from './src/contracts/get-quest-input/get-quest-input-contract';
export * from './src/contracts/get-quest-input/get-quest-input.stub';

// Modify Quest Input Contracts
export * from './src/contracts/modify-quest-input/modify-quest-input-contract';
export * from './src/contracts/modify-quest-input/modify-quest-input.stub';

// Planning Notes Contracts (PathSeeker phased statuses)
export * from './src/contracts/planning-scope-classification/planning-scope-classification-contract';
export * from './src/contracts/planning-scope-classification/planning-scope-classification.stub';

export * from './src/contracts/planning-surface-report/planning-surface-report-contract';
export * from './src/contracts/planning-surface-report/planning-surface-report.stub';

export * from './src/contracts/planning-blight-report/planning-blight-report-contract';
export * from './src/contracts/planning-blight-report/planning-blight-report.stub';

export * from './src/contracts/planning-synthesis/planning-synthesis-contract';
export * from './src/contracts/planning-synthesis/planning-synthesis.stub';

export * from './src/contracts/planning-walk-findings/planning-walk-findings-contract';
export * from './src/contracts/planning-walk-findings/planning-walk-findings.stub';

export * from './src/contracts/planning-review-report/planning-review-report-contract';
export * from './src/contracts/planning-review-report/planning-review-report.stub';

// Chat Entry Contracts
export * from './src/contracts/chat-entry/chat-entry-contract';
export * from './src/contracts/chat-entry/chat-entry.stub';

// Ask User Question Contracts
export * from './src/contracts/ask-user-question/ask-user-question-contract';
export * from './src/contracts/ask-user-question/ask-user-question.stub';

// Display Header Contracts
export * from './src/contracts/display-header/display-header-contract';
export * from './src/contracts/display-header/display-header.stub';

// Quest Status Metadata Contracts
export * from './src/contracts/quest-status-metadata/quest-status-metadata-contract';
export * from './src/contracts/quest-status-metadata/quest-status-metadata.stub';

// Work Item Status Metadata Contracts
export * from './src/contracts/work-item-status-metadata/work-item-status-metadata-contract';
export * from './src/contracts/work-item-status-metadata/work-item-status-metadata.stub';

// Smoketest Suite Contracts
export * from './src/contracts/smoketest-suite/smoketest-suite-contract';
export * from './src/contracts/smoketest-suite/smoketest-suite.stub';

// Smoketest Case Result Contracts
export * from './src/contracts/smoketest-case-result/smoketest-case-result-contract';
export * from './src/contracts/smoketest-case-result/smoketest-case-result.stub';

// Smoketest Run ID Contracts
export * from './src/contracts/smoketest-run-id/smoketest-run-id-contract';
export * from './src/contracts/smoketest-run-id/smoketest-run-id.stub';

// Quest Queue Entry Contracts
export * from './src/contracts/quest-queue-entry/quest-queue-entry-contract';
export * from './src/contracts/quest-queue-entry/quest-queue-entry.stub';

// Typed CWD Brand Contracts (Layer 3 — Stroustrup locations)
export * from './src/contracts/repo-root-cwd/repo-root-cwd-contract';
export * from './src/contracts/repo-root-cwd/repo-root-cwd.stub';

export * from './src/contracts/project-root-cwd/project-root-cwd-contract';
export * from './src/contracts/project-root-cwd/project-root-cwd.stub';

export * from './src/contracts/guild-path-cwd/guild-path-cwd-contract';
export * from './src/contracts/guild-path-cwd/guild-path-cwd.stub';

export * from './src/contracts/dungeonmaster-home-cwd/dungeonmaster-home-cwd-contract';
export * from './src/contracts/dungeonmaster-home-cwd/dungeonmaster-home-cwd.stub';

// Normalized Line Contracts
export * from './src/contracts/normalized-line/normalized-line-contract';
export * from './src/contracts/normalized-line/normalized-line.stub';

// Project Config Contracts
export * from './src/contracts/project-config/project-config-contract';
export * from './src/contracts/project-config/project-config.stub';

// Claude Content Block Contracts
export * from './src/contracts/text-block-param/text-block-param-contract';
export * from './src/contracts/text-block-param/text-block-param.stub';

export * from './src/contracts/image-block-param/image-block-param-contract';
export * from './src/contracts/image-block-param/image-block-param.stub';

export * from './src/contracts/document-block-param/document-block-param-contract';
export * from './src/contracts/document-block-param/document-block-param.stub';

export * from './src/contracts/search-result-block-param/search-result-block-param-contract';
export * from './src/contracts/search-result-block-param/search-result-block-param.stub';

export * from './src/contracts/tool-reference-block-param/tool-reference-block-param-contract';
export * from './src/contracts/tool-reference-block-param/tool-reference-block-param.stub';

export * from './src/contracts/tool-use-block-param/tool-use-block-param-contract';
export * from './src/contracts/tool-use-block-param/tool-use-block-param.stub';

export * from './src/contracts/tool-result-block-param/tool-result-block-param-contract';
export * from './src/contracts/tool-result-block-param/tool-result-block-param.stub';

export * from './src/contracts/thinking-block-param/thinking-block-param-contract';
export * from './src/contracts/thinking-block-param/thinking-block-param.stub';

export * from './src/contracts/redacted-thinking-block-param/redacted-thinking-block-param-contract';
export * from './src/contracts/redacted-thinking-block-param/redacted-thinking-block-param.stub';

export * from './src/contracts/tool-result-content-block-param/tool-result-content-block-param-contract';
export * from './src/contracts/tool-result-content-block-param/tool-result-content-block-param.stub';

export * from './src/contracts/assistant-content-block-param/assistant-content-block-param-contract';
export * from './src/contracts/assistant-content-block-param/assistant-content-block-param.stub';

// Package JSON Contracts
export * from './src/contracts/package-json/package-json-contract';
export * from './src/contracts/package-json/package-json.stub';

// Package Type Contracts
export * from './src/contracts/package-type/package-type-contract';
export * from './src/contracts/package-type/package-type.stub';

// State Writes Result Contracts
export * from './src/contracts/state-writes-result/state-writes-result-contract';
export * from './src/contracts/state-writes-result/state-writes-result.stub';

// File Write Call Contracts
export * from './src/contracts/file-write-call/file-write-call-contract';
export * from './src/contracts/file-write-call/file-write-call.stub';

// Widget Edges Contracts
export * from './src/contracts/widget-edges/widget-edges-contract';
export * from './src/contracts/widget-edges/widget-edges.stub';

// Widget Node Contracts
export * from './src/contracts/widget-node/widget-node-contract';
export * from './src/contracts/widget-node/widget-node.stub';

// Widget Tree Result Contracts
export * from './src/contracts/widget-tree-result/widget-tree-result-contract';
export * from './src/contracts/widget-tree-result/widget-tree-result.stub';

// Http Edge Contracts
export * from './src/contracts/http-edge/http-edge-contract';
export * from './src/contracts/http-edge/http-edge.stub';

// WS Edge Contracts
export * from './src/contracts/ws-edge/ws-edge-contract';
export * from './src/contracts/ws-edge/ws-edge.stub';

// File Bus Edge Contracts
export * from './src/contracts/file-bus-edge/file-bus-edge-contract';
export * from './src/contracts/file-bus-edge/file-bus-edge.stub';

// Fs Watch Tail Call Contracts
export * from './src/contracts/fs-watch-tail-call/fs-watch-tail-call-contract';
export * from './src/contracts/fs-watch-tail-call/fs-watch-tail-call.stub';

// Server Route Call Site Contracts
export * from './src/contracts/server-route-call-site/server-route-call-site-contract';
export * from './src/contracts/server-route-call-site/server-route-call-site.stub';

// Web Fetch Call Site Contracts
export * from './src/contracts/web-fetch-call-site/web-fetch-call-site-contract';
export * from './src/contracts/web-fetch-call-site/web-fetch-call-site.stub';
