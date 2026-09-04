#!/usr/bin/env node

/**
 * PURPOSE: Thin CLI entry point that delegates to the StartSessionForensics startup
 *
 * USAGE:
 * node session-forensics-entry.js summary <sessionId>    // One session's totals
 * node session-forensics-entry.js buckets <sessionId>    // Its spend over time
 * node session-forensics-entry.js gaps <sessionId>       // Blocked versus truly idle
 * node session-forensics-entry.js coverage <questId>     // Sign-off coverage per flow
 */

import { StartSessionForensics } from '../src/startup/start-session-forensics';

StartSessionForensics();
