/**
 * PURPOSE: Barrel export file for all shared contract types and schemas
 *
 * USAGE:
 * import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
 * // Returns branded Zod schemas for type-safe validation
 */

// Subpath export entry for @dungeonmaster/shared/contracts

// File Path Contracts
export * from './file-path/file-path-contract';

export * from './absolute-file-path/absolute-file-path-contract';

export * from './relative-file-path/relative-file-path-contract';

export * from './repo-relative-path/repo-relative-path-contract';

export * from './path-segment/path-segment-contract';

// File Contents Contracts
export * from './file-contents/file-contents-contract';

// Identifier Contracts
export * from './identifier/identifier-contract';

// Module Path Contracts
export * from './module-path/module-path-contract';

// Error Message Contracts
export * from './error-message/error-message-contract';
export * from './blocked-reason/blocked-reason-contract';

// Extracted Metadata Contracts
export * from './extracted-metadata/extracted-metadata-contract';

// Folder Type Contracts
export * from './folder-type/folder-type-contract';

// Folder Config Contracts
export * from './folder-config/folder-config-contract';

// Content Text Contracts
export * from './content-text/content-text-contract';

// Import Path Contracts
export * from './import-path/import-path-contract';

// Folder Dependency Tree Contracts
export * from './folder-dependency-tree/folder-dependency-tree-contract';

// User Input Contracts
export * from './user-input/user-input-contract';

// Exit Code Contracts
export * from './exit-code/exit-code-contract';

// Exec Result Contracts
export * from './exec-result/exec-result-contract';

// Port Kill Listener Result Contracts
export * from './port-kill-listener-result/port-kill-listener-result-contract';

export * from './network-port/network-port-contract';

// Quest Contracts
export * from './quest-title/quest-title-contract';

export * from './quest-status/quest-status-contract';

export * from './quest-branch-name/quest-branch-name-contract';

export * from './base-branch-name/base-branch-name-contract';

export * from './file-name/file-name-contract';

export * from './quest-list-item/quest-list-item-contract';
export * from './skipped-quest-file/skipped-quest-file-contract';
export * from './quest-list-result/quest-list-result-contract';

// Quest Package Contracts
export * from './quest-package-entry/quest-package-entry-contract';

export * from './package-graph-entry/package-graph-entry-contract';

export * from './quest/quest-contract';

// Quest Source Contracts
export * from './quest-source/quest-source-contract';

// Quest Type Contracts
export * from './quest-type/quest-type-contract';

// Install Contracts
export * from './package-name/package-name-contract';

export * from './install-message/install-message-contract';

export * from './install-action/install-action-contract';

export * from './install-result/install-result-contract';

export * from './install-context/install-context-contract';

// ID Contracts (Wave 1)
export * from './quest-id/quest-id-contract';

export * from './observable-id/observable-id-contract';

export * from './operation-item-id/operation-item-id-contract';

export * from './session-id/session-id-contract';

export * from './tooling-requirement-id/tooling-requirement-id-contract';

export * from './design-decision-id/design-decision-id-contract';

export * from './flow-id/flow-id-contract';

export * from './flow-recipe-name/flow-recipe-name-contract';

export * from './flow-recipe/flow-recipe-contract';

// Flow Contracts
export * from './flow/flow-contract';

export * from './flow-type/flow-type-contract';

// Outcome Type Contracts
export * from './outcome-type/outcome-type-contract';

// Flow Graph Contracts
export * from './flow-node-id/flow-node-id-contract';

export * from './flow-node-type/flow-node-type-contract';

export * from './flow-observable/flow-observable-contract';

export * from './quest-comment-id/quest-comment-id-contract';

export * from './comment-text/comment-text-contract';

export * from './quest-comment/quest-comment-contract';

export * from './comment-batch-entry/comment-batch-entry-contract';

export * from './flow-node/flow-node-contract';

export * from './flow-edge-ref/flow-edge-ref-contract';

export * from './flow-edge-id/flow-edge-id-contract';

export * from './flow-edge/flow-edge-contract';

export * from './design-decision/design-decision-contract';

export * from './tooling-requirement/tooling-requirement-contract';

export * from './operation-item/operation-item-contract';

// Process & Orchestration Contracts
export * from './process-id/process-id-contract';

export * from './orchestration-slot/orchestration-slot-contract';

export * from './slot-index/slot-index-contract';

export * from './slot-count/slot-count-contract';

// Execution Progress Count Contracts
export * from './completed-count/completed-count-contract';

export * from './total-count/total-count-contract';

export * from './orchestration-status/orchestration-status-contract';

// Contract Metadata Contracts
export * from './contract-name/contract-name-contract';

export * from './quest-contract-kind/quest-contract-kind-contract';

export * from './quest-contract-status/quest-contract-status-contract';

export * from './quest-contract-property/quest-contract-property-contract';

export * from './quest-contract-entry-id/quest-contract-entry-id-contract';

export * from './quest-contract-entry/quest-contract-entry-contract';

// Orchestration Event Contracts
export * from './orchestration-event-type/orchestration-event-type-contract';

// WebSocket Message Contracts
export * from './ws-message/ws-message-contract';

// URL Slug Contracts
export * from './url-slug/url-slug-contract';

// Guild Contracts
export * from './guild-id/guild-id-contract';

export * from './guild-name/guild-name-contract';

export * from './guild-path/guild-path-contract';

export * from './guild/guild-contract';

export * from './guild-list-item/guild-list-item-contract';

export * from './guild-config/guild-config-contract';

export * from './directory-entry/directory-entry-contract';

// Session List Item Contracts
export * from './session-list-item/session-list-item-contract';

// CSS & Display Contracts
export * from './hex-color/hex-color-contract';

export * from './css-pixels/css-pixels-contract';

export * from './line-count/line-count-contract';

// File Count Contracts
export * from './file-count/file-count-contract';

// Array Index Contracts
export * from './array-index/array-index-contract';

// Step Chunk Size Contracts

// JSONL Stream Line Contracts
export * from './system-init-stream-line/system-init-stream-line-contract';

export * from './result-stream-line/result-stream-line-contract';

export * from './summary-stream-line/summary-stream-line-contract';

export * from './user-text-stream-line/user-text-stream-line-contract';

export * from './assistant-stream-line/assistant-stream-line-contract';

export * from './user-tool-result-stream-line/user-tool-result-stream-line-contract';

// Work Item Contracts
export * from './quest-work-item-id/quest-work-item-id-contract';

export * from './work-item-status/work-item-status-contract';

export * from './work-item-role/work-item-role-contract';

export * from './work-item-payload-key/work-item-payload-key-contract';

export * from './spawner-type/spawner-type-contract';

export * from './related-data-item/related-data-item-contract';

export * from './ward-result/ward-result-contract';
export * from './ward-detail/ward-detail-contract';

export * from './riftcarver-result/riftcarver-result-contract';

export * from './quest-session/quest-session-contract';

export * from './step-name/step-name-contract';

export * from './piece-id/piece-id-contract';

export * from './work-item/work-item-contract';

export * from './stream-signal-kind/stream-signal-kind-contract';

// Claude Queue Response Contracts
export * from './claude-queue-response/claude-queue-response-contract';

// Stream JSON Line Contracts
export * from './stream-json-line/stream-json-line-contract';

// Timeout Ms Contracts
export * from './timeout-ms/timeout-ms-contract';

// Ward Queue Response Contracts
export * from './ward-queue-response/ward-queue-response-contract';

// Ward Run ID Contracts
export * from './ward-run-id/ward-run-id-contract';

// Agent ID Contracts
export * from './agent-id/agent-id-contract';
export * from './mcp-caller-context/mcp-caller-context-contract';

// Adapter Result Contracts
export * from './adapter-result/adapter-result-contract';

// Glob Pattern Contracts
export * from './glob-pattern/glob-pattern-contract';

// Item With Id Contracts
export * from './item-with-id/item-with-id-contract';

// Agent Prompt Result Contracts
export * from './agent-prompt-result/agent-prompt-result-contract';

// Add Quest Result Contracts
export * from './add-quest-result/add-quest-result-contract';

// Add Quest Input Contracts
export * from './add-quest-input/add-quest-input-contract';

// Verify Quest Check Contracts
export * from './verify-quest-check/verify-quest-check-contract';

// Get Quest Result Contracts
export * from './get-quest-result/get-quest-result-contract';

// Modify Quest Result Contracts
export * from './modify-quest-result/modify-quest-result-contract';

// Work Item For Upsert Contracts
export * from './work-item-for-upsert/work-item-for-upsert-contract';

// Quest Stage Contracts
export * from './quest-stage/quest-stage-contract';

// Get Quest Input Contracts
export * from './get-quest-input/get-quest-input-contract';

// Modify Quest Input Contracts
export * from './modify-quest-input/modify-quest-input-contract';

// QA Checklist Contracts (the deterministic enumeration of a flow into atomic verification units.
// Coverage is settled by an observation on the work item assigned to a unit
// (`workItem.observations[]`), which `get-qa-checklist` and the quest summary both recompute)
export * from './qa-checklist-kind/qa-checklist-kind-contract';

export * from './qa-off-map-family/qa-off-map-family-contract';

export * from './qa-checklist-item-id/qa-checklist-item-id-contract';

export * from './qa-checklist-item/qa-checklist-item-contract';

export * from './qa-walk-path/qa-walk-path-contract';

export * from './qa-checklist/qa-checklist-contract';

// Standards-Review Ledger Contracts (the per-unit review ledger a reviewer writes — every
// changed file crossed with each applicable concern, keyed so coverage is computed not remembered)
export * from './blight-concern/blight-concern-contract';

export * from './blight-disposition/blight-disposition-contract';

export * from './blight-checklist-item-id/blight-checklist-item-id-contract';

export * from './blight-checklist-item/blight-checklist-item-contract';

export * from './blight-checklist/blight-checklist-contract';

export * from './quest-blight-ledger-entry/quest-blight-ledger-entry-contract';

// Verification Track Contracts (the three tracks that measure a unit independently — Codeweaver in
// the unit tests beside the code, Flowrider at the flow/test layer, Siegemaster off the running
// system — each writing its own mark onto workItem.observations[], with provenance carried on a
// separate axis so a track is never charged for units it could not have reached)
export * from './verification-track/verification-track-contract';

export * from './observable-origin/observable-origin-contract';

export * from './flow-off-map-signoff/flow-off-map-signoff-contract';

// Unit Observation Contracts (the generic mark — met/cant-meet/unmet — that a session records
// against one unit, on the work item that was assigned it)
export * from './unit-id/unit-id-contract';

export * from './unit-mark/unit-mark-contract';

export * from './unit-observation-fields/unit-observation-fields-contract';

export * from './unit-observation/unit-observation-contract';

// Quest Note Contracts (the durable side channel on quest.planningNotes.questNotes — open
// questions, tooling failures, out-of-scope observations, walk resets and walked-path records,
// none of which close a unit)
export * from './quest-note-id/quest-note-id-contract';

export * from './siege-instance-id/siege-instance-id-contract';

export * from './siege-run-id/siege-run-id-contract';

export * from './quest-note-kind/quest-note-kind-contract';

export * from './quest-note/quest-note-contract';

// Quest Summary Contracts (what actually happened on a quest: per-flow/per-track mark counts,
// the observables added after approval, every unit carrying debt — `cant-meet` (settled without
// being proven) or `unmet` (left open) — and the side-channel notes grouped by kind. Shared
// rather than orchestrator-local because the web renders the same shape the orchestrator computes)
export * from './quest-summary-track-counts/quest-summary-track-counts-contract';

export * from './quest-summary-flow/quest-summary-flow-contract';

export * from './quest-summary-observable/quest-summary-observable-contract';

export * from './quest-summary-debt/quest-summary-debt-contract';

export * from './quest-summary-note-group/quest-summary-note-group-contract';

export * from './quest-summary/quest-summary-contract';

// Quest Projection Contracts — the likely remainder of a quest's execution, walked forward through
// agentFlowStatics from its real scopes and work items (T2-0, R7)
export * from './quest-projection/quest-projection-contract';

// Chat Entry Contracts
export * from './chat-entry/chat-entry-contract';

// Ask User Question Contracts
export * from './ask-user-question/ask-user-question-contract';

// Ask User Question Response Contracts
export * from './ask-user-question-response/ask-user-question-response-contract';

// Display Header Contracts
export * from './display-header/display-header-contract';

// Quest Status Metadata Contracts

// Work Item Status Metadata Contracts

// Smoketest Suite Contracts
export * from './smoketest-suite/smoketest-suite-contract';

// Smoketest Case Result Contracts
export * from './smoketest-case-result/smoketest-case-result-contract';

// Smoketest Run ID Contracts
export * from './smoketest-run-id/smoketest-run-id-contract';

// Quest Queue Entry Contracts
export * from './quest-queue-entry/quest-queue-entry-contract';

// Dispatch State Contracts (Node dispatcher play/pause + MCP loop heartbeat)
export * from './dispatch-hold/dispatch-hold-contract';
export * from './dispatch-state/dispatch-state-contract';

// Orchestration Mode Contract (declared claude | node from .dungeonmaster.json)
export * from './orchestration-mode/orchestration-mode-contract';

// Typed CWD Brand Contracts (Layer 3 — Stroustrup locations)
export * from './repo-root-cwd/repo-root-cwd-contract';

export * from './project-root-cwd/project-root-cwd-contract';

export * from './guild-path-cwd/guild-path-cwd-contract';

export * from './dungeonmaster-home-cwd/dungeonmaster-home-cwd-contract';

// Normalized Line Contracts
export * from './normalized-line/normalized-line-contract';

// Project Config Contracts
export * from './project-config/project-config-contract';

// Claude Content Block Contracts
export * from './text-block-param/text-block-param-contract';

export * from './image-block-param/image-block-param-contract';

export * from './document-block-param/document-block-param-contract';

export * from './search-result-block-param/search-result-block-param-contract';

export * from './tool-reference-block-param/tool-reference-block-param-contract';

export * from './tool-use-block-param/tool-use-block-param-contract';

export * from './tool-result-block-param/tool-result-block-param-contract';

export * from './thinking-block-param/thinking-block-param-contract';

export * from './redacted-thinking-block-param/redacted-thinking-block-param-contract';

export * from './assistant-content-block-param/assistant-content-block-param-contract';

// Package JSON Contracts
export * from './package-json/package-json-contract';

// Package Type Contracts
export * from './package-type/package-type-contract';

// State Writes Result Contracts
export * from './state-writes-result/state-writes-result-contract';

// File Write Call Contracts
export * from './file-write-call/file-write-call-contract';

// Widget Edges Contracts
export * from './widget-edges/widget-edges-contract';

// Widget Node Contracts
export * from './widget-node/widget-node-contract';

// Widget Tree Result Contracts
export * from './widget-tree-result/widget-tree-result-contract';

// Http Edge Contracts
export * from './http-edge/http-edge-contract';

// WS Edge Contracts
export * from './ws-edge/ws-edge-contract';

// File Bus Edge Contracts
export * from './file-bus-edge/file-bus-edge-contract';

// Direct Call Edge Contracts

// Import Edge Contracts
export * from './import-edge/import-edge-contract';

// Route Metadata Contracts
export * from './route-metadata/route-metadata-contract';

// Widget Context Contracts
export * from './widget-context/widget-context-contract';

// Fs Watch Tail Call Contracts
export * from './tail-file-call/tail-file-call-contract';

// Server Route Call Site Contracts
export * from './server-route-call-site/server-route-call-site-contract';

// Web Fetch Call Site Contracts
export * from './web-fetch-call-site/web-fetch-call-site-contract';

// Bin Entry Contracts

// Responder Annotation Contracts
export * from './responder-annotation/responder-annotation-contract';

export * from './responder-annotation-map/responder-annotation-map-contract';

// Rate Limit Contracts
export * from './rate-limit-window/rate-limit-window-contract';

export * from './rate-limits-snapshot/rate-limits-snapshot-contract';

export * from './rate-limits-history-line/rate-limits-history-line-contract';

// Work Item Floor Ordering Contracts (shared by the web floor view and the orchestrator dispatcher)
export * from './topological-depth/topological-depth-contract';
export * from './config-index/config-index-contract';
export * from './floor-name/floor-name-contract';
export * from './quest-section/quest-section-contract';

// Operation Plan Contracts (planner sub-agent output — read back off the quest by the
// orchestrator session that dispatched the planner, without holding the plan in context)
export * from './operation-plan-piece-id/operation-plan-piece-id-contract';

export * from './operation-plan-piece/operation-plan-piece-contract';

export * from './operation-plan-id/operation-plan-id-contract';

export * from './operation-plan/operation-plan-contract';

// Pasted-image upload contracts — one attachment as it rides inside the JSON request body
// beside the message text, and the media-type enum both the paste check and the body
// validation parse through.
export * from './pasted-image-media-type/pasted-image-media-type-contract';
export * from './pasted-image-upload/pasted-image-upload-contract';
export * from './weighted-tokens/weighted-tokens-contract';
export * from './bucket-start-key/bucket-start-key-contract';
export * from './usage-bucket/usage-bucket-contract';
export * from './usage-ledger/usage-ledger-contract';

// Routed Graph Contracts (the shape both the family graph and each step graph satisfy, walked by
// graphReachabilityViolationsTransformer)
export * from './routed-graph-node-key/routed-graph-node-key-contract';
export * from './routed-graph-outcome-word/routed-graph-outcome-word-contract';
export * from './routed-graph/routed-graph-contract';

// Gateway Lint Config Contracts (the `gateway` key of `.dungeonmaster.json` — parsed once by
// `configDungeonmasterBroker`'s caller and passed into the three gateway lint rules as a rule option)
export * from './gateway-lint-config/gateway-lint-config-contract';

// Gateway Imports Map Contracts (a package.json `imports` field's `#gateway/<folder>/*` shape —
// every scaffolder that writes this field, and the merge step that reconciles it into an existing
// package.json, share this one validated shape)
export * from './gateway-imports-map/gateway-imports-map-contract';
export * from './owner-index/owner-index-contract';
export * from './owner-index-field/owner-index-field-contract';
export * from './owner-index-owner/owner-index-owner-contract';
export * from './owner-index-standalone-brand/owner-index-standalone-brand-contract';
export * from './owner-index-package/owner-index-package-contract';
export * from './owner-index-match/owner-index-match-contract';
export * from './owner-index-usage/owner-index-usage-contract';
