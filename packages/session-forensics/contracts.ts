/**
 * PURPOSE: Barrel export for session-forensics contracts
 *
 * USAGE:
 * import { transcriptRecordContract } from '@dungeonmaster/session-forensics/contracts';
 */

// One moment, shared by every shape here that carries a timestamp
export * from './src/contracts/iso-timestamp/iso-timestamp-contract';
export * from './src/contracts/iso-timestamp/iso-timestamp.stub';

// One parsed line of a Claude Code session JSONL, and one block of its content
export * from './src/contracts/transcript-record/transcript-record-contract';
export * from './src/contracts/transcript-record/transcript-record.stub';
export * from './src/contracts/transcript-record-content-block/transcript-record-content-block-contract';
export * from './src/contracts/transcript-record-content-block/transcript-record-content-block.stub';

// The five token counts one API response reports, never summed together
export * from './src/contracts/token-usage/token-usage-contract';
export * from './src/contracts/token-usage/token-usage.stub';

// One whole session digested, and one fixed-width window of it
export * from './src/contracts/transcript-summary/transcript-summary-contract';
export * from './src/contracts/transcript-summary/transcript-summary.stub';
export * from './src/contracts/time-bucket/time-bucket-contract';
export * from './src/contracts/time-bucket/time-bucket.stub';

// A gap between turns, the sub-agent spans that explain it, and the totals over both
export * from './src/contracts/turn-gap/turn-gap-contract';
export * from './src/contracts/turn-gap/turn-gap.stub';
export * from './src/contracts/subagent-window/subagent-window-contract';
export * from './src/contracts/subagent-window/subagent-window.stub';
export * from './src/contracts/gap-report/gap-report-contract';
export * from './src/contracts/gap-report/gap-report.stub';

// A dispatched sub-agent: what its parent chose, and what its run cost
export * from './src/contracts/subagent-meta/subagent-meta-contract';
export * from './src/contracts/subagent-meta/subagent-meta.stub';
export * from './src/contracts/subagent-roster-row/subagent-roster-row-contract';
export * from './src/contracts/subagent-roster-row/subagent-roster-row.stub';

// One signable thing flattened out of a flow graph, and one track's coverage of a flow
export * from './src/contracts/verification-unit/verification-unit-contract';
export * from './src/contracts/verification-unit/verification-unit.stub';
export * from './src/contracts/track-coverage/track-coverage-contract';
export * from './src/contracts/track-coverage/track-coverage.stub';

// A tool call reduced to the arguments worth printing in a timeline
export * from './src/contracts/tool-brief/tool-brief-contract';
export * from './src/contracts/tool-brief/tool-brief.stub';

// The four forensic views DigestRunResponder can render for a target
export * from './src/contracts/digest-command/digest-command-contract';
export * from './src/contracts/digest-command/digest-command.stub';
