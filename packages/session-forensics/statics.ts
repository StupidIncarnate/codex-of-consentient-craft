/**
 * PURPOSE: The subpath a consumer imports this package's statics from, so nothing outside has to
 * reach into `src/`. Import from here rather than the root barrel when only the statics are wanted.
 *
 * USAGE:
 * import { digestDefaultStatics } from '@dungeonmaster/session-forensics/statics';
 */

// A copy of the orchestrator's table of which reviewing role owes a sign-off on what
export * from './src/statics/track-denominator/track-denominator-statics';

// Fallback numbers for digest windows, floors and excerpt lengths
export * from './src/statics/digest-default/digest-default-statics';

// The tool-call input keys worth printing in a brief, in priority order
export * from './src/statics/tool-brief-key/tool-brief-key-statics';
