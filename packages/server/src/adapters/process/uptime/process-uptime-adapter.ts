/**
 * PURPOSE: Nothing in the repo reads process.uptime() before this — the floor to a whole second
 * happens HERE, at the process boundary, rather than in the /health responder or the badge widget,
 * so every consumer of HealthSnapshot sees the same integer and the contract's `.int()` check never
 * sees the fractional value Node actually reports.
 *
 * USAGE:
 * processUptimeAdapter();
 * // Returns UptimeSeconds — Math.floor(process.uptime()), e.g. 745
 */

import { healthSnapshotContract } from '@dungeonmaster/shared/contracts';
import type { HealthSnapshot } from '@dungeonmaster/shared/contracts';

export const processUptimeAdapter = (): HealthSnapshot['uptimeSeconds'] =>
  healthSnapshotContract.shape.uptimeSeconds.parse(Math.floor(process.uptime()));
