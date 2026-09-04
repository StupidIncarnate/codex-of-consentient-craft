#!/usr/bin/env node

/**
 * PURPOSE: The executable this package installs as `dungeonmaster-session-forensics`. It exists
 * only so a shell has something to run; `StartSessionForensics` does all of the work. Reach for
 * that startup directly from TypeScript, and for this file only from a command line.
 *
 * USAGE:
 * node session-forensics-entry.js summary <sessionId>    // One session's totals
 * node session-forensics-entry.js buckets <sessionId>    // Its spend over time
 * node session-forensics-entry.js gaps <sessionId>       // Blocked versus truly idle
 * node session-forensics-entry.js coverage <questId>     // Sign-off coverage per flow
 */

import { StartSessionForensics } from '../src/startup/start-session-forensics';

StartSessionForensics();
