/**
 * PURPOSE: The subpath a consumer imports this package's brokers from, so nothing outside has to
 * reach into `src/`. Import from here rather than the root barrel when only the brokers are wanted.
 *
 * USAGE:
 * import { transcriptLoadBroker } from '@dungeonmaster/session-forensics/brokers';
 */

// Turn a bare session or sub-agent id into its transcript, searching every project directory
export * from './transcript/resolve/transcript-resolve-broker';
export * from './transcript/load/transcript-load-broker';

// What a session's sub-agents actually spent, read from files the parent transcript never mentions
export * from './subagent/roster-load/subagent-roster-load-broker';

// Find a quest's quest.json, checking the repo-local homes before the user-global one
export * from './quest/find/quest-find-broker';

// Read just the flows out of a quest's quest.json
export * from './quest/load/quest-load-broker';

// Read the operations/wardResults/riftcarverResults/userRequest a work-item index join needs
export * from './quest/index-load/quest-index-load-broker';
