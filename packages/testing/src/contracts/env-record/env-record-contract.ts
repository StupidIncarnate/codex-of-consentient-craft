/**
 * PURPOSE: Defines environment variable record type for process spawning
 *
 * USAGE:
 * const env = envRecordContract.parse({ PATH: '/usr/bin', HOME: '/home/user' });
 * // Returns validated EnvRecord branded type
 */

import { z } from 'zod';

export const envRecordContract = z.record(z.string(), z.string().optional()).brand<'EnvRecord'>();

export type EnvRecord = z.infer<typeof envRecordContract>;
