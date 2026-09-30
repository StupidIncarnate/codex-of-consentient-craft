/**
 * PURPOSE: Defines the data `installCheckBroker` returns
 *
 * USAGE:
 * installCheckResultContract.parse(value);
 * // Returns validated InstallCheckResult
 */
import { z } from '#gateway/npm/zod';

export const installCheckResultContract = z
  .object({ valid: z.boolean(), error: z.string().brand<'InstallCheckResultError'>().optional() })
  .brand<'InstallCheckResult'>();

export type InstallCheckResult = z.infer<typeof installCheckResultContract>;
