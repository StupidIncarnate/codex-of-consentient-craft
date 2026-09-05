/**
 * PURPOSE: The subpath a consumer imports this package's brokers from, so nothing outside has to
 * reach into `src/`. Import from here rather than the root barrel when only the brokers are wanted.
 *
 * USAGE:
 * import { transcriptLoadBroker } from '@dungeonmaster/session-forensics/brokers';
 */

// Turn a bare session or sub-agent id into its transcript, searching every project directory
export * from './src/brokers/transcript/resolve/transcript-resolve-broker';
export * from './src/brokers/transcript/load/transcript-load-broker';

// What a session's sub-agents actually spent, read from files the parent transcript never mentions
export * from './src/brokers/subagent/roster-load/subagent-roster-load-broker';

// Find a quest's quest.json, checking the repo-local homes before the user-global one
export * from './src/brokers/quest/find/quest-find-broker';

// Read just the flows out of a quest's quest.json
export * from './src/brokers/quest/load/quest-load-broker';
