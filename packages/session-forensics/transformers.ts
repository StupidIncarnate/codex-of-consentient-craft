/**
 * PURPOSE: Barrel export for session-forensics transformers
 *
 * USAGE:
 * import { recordsToSummaryTransformer } from '@dungeonmaster/session-forensics/transformers';
 */

// Raw JSONL text to records, dropping a half-written trailing line by design
export * from './src/transformers/jsonl-to-records/jsonl-to-records-transformer';

// One record's usage, content blocks, and prose
export * from './src/transformers/record-to-token-usage/record-to-token-usage-transformer';
export * from './src/transformers/record-to-content-blocks/record-to-content-blocks-transformer';
export * from './src/transformers/record-to-flat-text/record-to-flat-text-transformer';

// A tool call reduced to the arguments worth printing
export * from './src/transformers/tool-use-to-brief/tool-use-to-brief-transformer';

// A whole session: its totals, its spend over time, and where it was blocked rather than idle
export * from './src/transformers/records-to-summary/records-to-summary-transformer';
export * from './src/transformers/records-to-buckets/records-to-buckets-transformer';
export * from './src/transformers/records-to-gaps/records-to-gaps-transformer';

// A quest's flow graph flattened to units, then crossed with the three sign-off tracks
export * from './src/transformers/quest-to-units/quest-to-units-transformer';
export * from './src/transformers/quest-to-coverage/quest-to-coverage-transformer';

// The four renderers that turn a digest shape into the ContentText a CLI command prints
export * from './src/transformers/summary-to-text/summary-to-text-transformer';
export * from './src/transformers/buckets-to-text/buckets-to-text-transformer';
export * from './src/transformers/gap-report-to-text/gap-report-to-text-transformer';
export * from './src/transformers/coverage-to-text/coverage-to-text-transformer';
