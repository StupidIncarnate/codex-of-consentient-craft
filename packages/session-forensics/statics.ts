/**
 * PURPOSE: Barrel export for session-forensics statics
 *
 * USAGE:
 * import { digestDefaultStatics } from '@dungeonmaster/session-forensics/statics';
 */

// Mirror of the orchestrator's per-track sign-off eligibility table
export * from './src/statics/track-denominator/track-denominator-statics';

// Fallback numbers for digest windows, floors and excerpt lengths
export * from './src/statics/digest-default/digest-default-statics';

// The tool-call input keys worth printing in a brief, in priority order
export * from './src/statics/tool-brief-key/tool-brief-key-statics';
