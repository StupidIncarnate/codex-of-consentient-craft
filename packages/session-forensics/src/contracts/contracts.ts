/**
 * PURPOSE: The subpath a consumer imports this package's contracts from, so nothing outside has to
 * reach into `src/`. Import from here rather than the root barrel when only the contracts are
 * wanted. Each contract ships beside its stub, so a test never imports the contract itself.
 *
 * USAGE:
 * import { transcriptRecordContract } from '@dungeonmaster/session-forensics/contracts';
 */

// One timestamp shape, shared by everything here that carries a time
export * from './iso-timestamp/iso-timestamp-contract';

// One parsed line of a Claude Code session JSONL, and one block of its content
export * from './transcript-record/transcript-record-contract';
export * from './transcript-record-content-block/transcript-record-content-block-contract';

// The five token counts one API response reports, never summed together
export * from './token-usage/token-usage-contract';

// A whole session folded to one summary, plus one fixed-width window of it
export * from './transcript-summary/transcript-summary-contract';
export * from './time-bucket/time-bucket-contract';

// A gap between turns, the sub-agent spans that explain it, and the totals over both
export * from './turn-gap/turn-gap-contract';
export * from './subagent-window/subagent-window-contract';
export * from './gap-report/gap-report-contract';

// A dispatched sub-agent: what its parent chose, and what its run cost
export * from './subagent-meta/subagent-meta-contract';
export * from './subagent-roster-row/subagent-roster-row-contract';

// One signable thing flattened out of a flow graph, and one reviewing role's coverage of a flow
export * from './verification-unit/verification-unit-contract';
export * from './track-coverage/track-coverage-contract';

// A tool call reduced to the arguments worth printing in a timeline
export * from './tool-brief/tool-brief-contract';

// The forensic views DigestRunResponder can render for a target
export * from './digest-command/digest-command-contract';

// The `--minutes`/`--floor-seconds` CLI flags, each a validated positive integer
export * from './bucket-minutes/bucket-minutes-contract';
export * from './gap-floor-seconds/gap-floor-seconds-contract';

// One row of the `quest` command's per-work-item index
export * from './work-item-index-row/work-item-index-row-contract';
