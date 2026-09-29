/**
 * PURPOSE: The subpath a consumer imports this package's transformers from, so nothing outside has
 * to reach into `src/`. Import from here rather than the root barrel when only the transformers are
 * wanted.
 *
 * USAGE:
 * import { recordsToSummaryTransformer } from '@dungeonmaster/session-forensics/transformers';
 */

// Raw JSONL text to records; a half-written trailing line is dropped on purpose
export * from './jsonl-to-records/jsonl-to-records-transformer';

// One record's usage, content blocks, and prose
export * from './record-to-token-usage/record-to-token-usage-transformer';
export * from './record-to-content-blocks/record-to-content-blocks-transformer';
export * from './record-to-flat-text/record-to-flat-text-transformer';

// A tool call reduced to the arguments worth printing
export * from './tool-use-to-brief/tool-use-to-brief-transformer';

// A whole session: its totals, its spend over time, and where it was blocked rather than idle
export * from './records-to-summary/records-to-summary-transformer';
export * from './records-to-buckets/records-to-buckets-transformer';
export * from './records-to-gaps/records-to-gaps-transformer';

// A quest's flow graph flattened to signable units, then crossed with the three reviewing roles
export * from './quest-to-units/quest-to-units-transformer';
export * from './quest-to-coverage/quest-to-coverage-transformer';

// The renderers that turn a digest shape into the ContentText a CLI command prints
export * from './summary-to-text/summary-to-text-transformer';
export * from './buckets-to-text/buckets-to-text-transformer';
export * from './gap-report-to-text/gap-report-to-text-transformer';
export * from './coverage-to-text/coverage-to-text-transformer';
export * from './quest-index-to-text/quest-index-to-text-transformer';

// Joins one work item to its operation/ward/riftcarver context for the `quest` command's index
export * from './work-item-to-index-row/work-item-to-index-row-transformer';
