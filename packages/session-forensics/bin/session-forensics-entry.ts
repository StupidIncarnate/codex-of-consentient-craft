#!/usr/bin/env node

/**
 * PURPOSE: The executable this package installs as `dungeonmaster-session-forensics`. It exists
 * only so a shell has something to run; `StartSessionForensics` does all of the work. Reach for
 * that startup directly from TypeScript, and for this file only from a command line.
 *
 * USAGE:
 * node session-forensics-entry.js summary <sessionId>                          // One session's totals
 * node session-forensics-entry.js buckets <sessionId> [--minutes <n>]          // Its spend over time, in n-minute windows (default 15)
 * node session-forensics-entry.js gaps <sessionId> [--floor-seconds <n>]       // Blocked versus truly idle, gaps of n+ seconds (default 120)
 * node session-forensics-entry.js coverage <questId>                          // Sign-off coverage per flow
 * node session-forensics-entry.js quest <questId>                             // Per-work-item index: role, status, session, wall clock, operation, flows/packages, transcript size, sub-agents, ward/riftcarver
 */

import { StartSessionForensics } from '../src/startup/start-session-forensics';

StartSessionForensics();
