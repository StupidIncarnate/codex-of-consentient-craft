/**
 * PURPOSE: Barrel export for all statics from @dungeonmaster/shared
 *
 * USAGE:
 * import { folderConfigStatics } from '@dungeonmaster/shared/statics';
 * // Access folder configuration statics
 */

// Export all statics
export * from './src/statics/file-extensions/file-extensions-statics';
export * from './src/statics/folder-config/folder-config-statics';
export * from './src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics';
export * from './src/statics/quests-folder/quests-folder-statics';
export * from './src/statics/dungeonmaster-home/dungeonmaster-home-statics';
export * from './src/statics/environment/environment-statics';
export * from './src/statics/quest-gate-content-requirements/quest-gate-content-requirements-statics';
export * from './src/statics/text-display-symbols/text-display-symbols-statics';
export * from './src/statics/outcome-type-descriptions/outcome-type-descriptions-statics';
export * from './src/statics/project-map/project-map-statics';
export * from './src/statics/session-snippet/session-snippet-statics';
export * from './src/statics/quest-status-metadata/quest-status-metadata-statics';
export * from './src/statics/quest-status-transitions/quest-status-transitions-statics';
export * from './src/statics/work-item-status-metadata/work-item-status-metadata-statics';
export * from './src/statics/mcp-tools/mcp-tools-statics';
export * from './src/statics/mcp-tool-result/mcp-tool-result-statics';
export * from './src/statics/agent-git-permissions/agent-git-permissions-statics';
export * from './src/statics/agent-browser-permissions/agent-browser-permissions-statics';
export * from './src/statics/locations/locations-statics';
export * from './src/statics/widget-tree/widget-tree-statics';
export * from './src/statics/project-map-headline-frontend-react/project-map-headline-frontend-react-statics';
export * from './src/statics/rate-limit/rate-limit-statics';
export * from './src/statics/banned-jest-matchers/banned-jest-matchers-statics';
export * from './src/statics/guild-name-small-words/guild-name-small-words-statics';
export * from './src/statics/quest-type-registry/quest-type-registry-statics';
export * from './src/statics/work-item-role/work-item-role-statics';

// QA checklist vocabulary — where each observable type is actually confirmed, and what each
// off-map probe family concretely means. Consumed by qaChecklistBuildTransformer so the tool
// states both deterministically instead of leaving every walker to re-derive them.
export * from './src/statics/qa-check-surface/qa-check-surface-statics';
export * from './src/statics/qa-off-map-probe/qa-off-map-probe-statics';
export * from './src/statics/qa-checklist-limits/qa-checklist-limits-statics';

// Quest summary render bounds — how many entries per section questSummaryToTextTransformer shows
// before it truncates with a stated count.
export * from './src/statics/quest-summary-limits/quest-summary-limits-statics';

// Execution dungeon floor config — the canonical role/floor pipeline order shared by the web floor
// view and the orchestrator dispatcher.
export * from './src/statics/execution-floor-config/execution-floor-config-statics';
export * from './src/statics/ward-exit-code/ward-exit-code-statics';
export * from './src/statics/quest-stage-mapping/quest-stage-mapping-statics';

// Base branch candidates — the local branch names Start probes when resolving the base branch a
// quest forks from, consumed by baseBranchNameContract to build its enum.
export * from './src/statics/base-branch/base-branch-statics';

// Package KIND build tiers — the primary sort key for the derived codeweaver ledger, ahead of the
// manifest-derived packageGraph depth, which is inverted across an HTTP seam (this repo's server
// depends on web to serve its bundle, so Kahn ranks the browser package ahead of the backend it
// calls).
export * from './src/statics/package-build-order/package-build-order-statics';

// The two verification track lists — the sign-off FIELDS a unit carries and the DENOMINATORS
// measured over them — consumed by signoffTrackContract and signoffDenominatorTrackContract to
// build their enums, and by every test that enumerates either list.
export * from './src/statics/signoff-tracks/signoff-tracks-statics';
