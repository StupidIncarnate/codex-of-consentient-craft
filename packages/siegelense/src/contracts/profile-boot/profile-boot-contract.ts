/**
 * PURPOSE: One INSTANCE's on-disk boot record inside `profiles/<specHash>/boots/` — how long `start`
 * actually waited between spawning the driver and that driver answering `ping`. Reach for this over
 * `ProfileObservation`: the memory record is written by the DRIVER across its whole life, this one is
 * written once by the client half of `start`, which is the only side that sees the boot begin. Two
 * files rather than two keys in one document is what keeps two OS processes from read-modify-writing
 * the same path.
 *
 * `bootMs` is the one figure siegelense-tooling.md line 1483 says is genuinely measured, and line
 * 1515 is why it lives beside the memory numbers rather than travelling with them: peak RSS is mostly
 * a property of the spec, boot milliseconds are a property of the disk and the CPU that ran it.
 *
 * USAGE:
 * profileBootContract.parse({
 *   instanceId: 'inst_7f3a9c21',
 *   specHash: 'a3f9c2e1',
 *   bootMs: 20000,
 *   recordedAtMs: 1700000000000,
 * });
 * // Returns a validated ProfileBoot
 */

import { z } from 'zod';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { instanceIdContract } from '../instance-id/instance-id-contract';
import { specHashContract } from '../spec-hash/spec-hash-contract';

export const profileBootContract = z.object({
  instanceId: instanceIdContract,
  specHash: specHashContract,
  bootMs: epochMsContract,
  recordedAtMs: epochMsContract,
});

export type ProfileBoot = z.infer<typeof profileBootContract>;
