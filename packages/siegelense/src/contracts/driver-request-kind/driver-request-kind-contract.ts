/**
 * PURPOSE: The three request shapes a driver's socket answers. `ping` costs the driver nothing and
 * answers `ok` the instant its listener is up — the probe `instance-start-broker`'s boot poll needs,
 * one that never touches Playwright or the lane's own processes, so a slow boot and an unreachable
 * driver read differently. `run` and `kill` are the two calls that do real work. Reach for this over a
 * bare `z.enum` written inline on `driverRequestContract` — the three kinds are also what
 * `driverHandleRequestBroker` switches on, and a shared brand keeps that switch and this schema from
 * drifting apart.
 *
 * USAGE:
 * driverRequestKindContract.parse('ping');
 * // Returns: 'ping' as DriverRequestKind
 */

import { z } from 'zod';

export const driverRequestKindContract = z
  .enum(['ping', 'run', 'kill'])
  .brand<'DriverRequestKind'>();

export type DriverRequestKind = z.infer<typeof driverRequestKindContract>;
