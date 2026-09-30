/**
 * PURPOSE: The whole driver lifecycle, wired for `StartSiegelenseDriver` — reads the registry row,
 * resolves its spec, boots the lane, stamps the row, releases `boot.lock`, then serves until an idle
 * deadline or a `kill` tears the lane down. All of that lives in SiegelenseDriverResponder, the SAME
 * responder `SiegelenseFlow`'s `driver` route reaches, so this flow is one line: flows may import
 * responders/ but not brokers/ or state/ directly (see `get-architecture`'s layer table), and this
 * is the entry `startup/start-siegelense-driver.ts` is allowed to import (`startup/` may import
 * `flows/` but not `responders/`).
 *
 * USAGE:
 * await DriverFlow({ instanceId: InstanceIdStub() });
 * // Boots the registry row's lane and blocks for the driver's whole life
 */

import { SiegelenseDriverResponder } from '../../responders/siegelense/driver/siegelense-driver-responder';
import type { SiegeInstance } from '@dungeonmaster/shared/contracts';

export const DriverFlow = async ({ instanceId }: { instanceId: SiegeInstance['id'] }): Promise<void> =>
  SiegelenseDriverResponder({ instanceId });
