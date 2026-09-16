/**
 * PURPOSE: The lane spec's CONTENT hash, never its name. A profile is keyed by this value, so
 * adding a process to the spec changes the hash, the keyed profile goes stale, and measurement
 * restarts by construction instead of by someone remembering to invalidate it. Reach for this over
 * specNameContract when the question is "is this the same spec content a profile was measured
 * against" — two specs can share a name across two commits and mean different things, and only the
 * hash catches that.
 *
 * USAGE:
 * specHashContract.parse('a3f9c2e1');
 * // Returns: 'a3f9c2e1' as SpecHash
 */

import { z } from 'zod';

export const specHashContract = z
  .string()
  .regex(/^[0-9a-f]{8,64}$/u)
  .brand<'SpecHash'>();

export type SpecHash = z.infer<typeof specHashContract>;
