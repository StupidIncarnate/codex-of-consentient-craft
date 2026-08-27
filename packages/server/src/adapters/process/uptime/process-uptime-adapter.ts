/**
 * PURPOSE: The single point in packages/server that reads process.uptime() — a non-deterministic
 * value, so nothing above this adapter can mock it directly. Both the seed route and the heartbeat
 * read the server's uptime through here rather than calling process.uptime() themselves, so a test
 * can drive the reading through the proxy instead of real wall-clock time.
 *
 * USAGE:
 * processUptimeAdapter();
 * // Returns the branded uptimeSeconds field of HealthStatusPayload
 */

import { healthStatusPayloadContract } from '@dungeonmaster/shared/contracts';
import type { HealthStatusPayload } from '@dungeonmaster/shared/contracts';

export const processUptimeAdapter = (): HealthStatusPayload['uptimeSeconds'] =>
  healthStatusPayloadContract.shape.uptimeSeconds.parse(Math.floor(process.uptime()));
