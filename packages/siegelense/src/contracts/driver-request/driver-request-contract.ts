/**
 * PURPOSE: The whole frame a socket client sends the driver — `kind` says which of the three request
 * shapes `payload` decodes to, and `payload` itself stays an opaque `ContentText` (a JSON string)
 * rather than a typed union of `RunRequest` / `KillResult` / etc. A wire contract that named every
 * call's shape would make the transport depend on every tool this package ever adds; each end decodes
 * `payload` through the contract that call already owns — `runRequestContract` for `run`, nothing for
 * `ping` and `kill`, which carry no body. Anything arriving off a socket is `unknown` until THIS
 * parses it, so `driverHandleRequestBroker` reaches for `driverRequestContract.safeParse` before it
 * ever reaches for `kind` — a malformed frame answers with a real error instead of throwing on
 * whichever field happened to be missing.
 *
 * USAGE:
 * driverRequestContract.parse({
 *   kind: 'run',
 *   payload: '{"instanceId":"inst_7f3a9c21","steps":[],"stopOn":"error"}',
 * });
 * // Returns a validated DriverRequest
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { driverRequestKindContract } from '../driver-request-kind/driver-request-kind-contract';

export const driverRequestContract = z.object({
  kind: driverRequestKindContract,
  payload: contentTextContract,
});

export type DriverRequest = z.infer<typeof driverRequestContract>;
