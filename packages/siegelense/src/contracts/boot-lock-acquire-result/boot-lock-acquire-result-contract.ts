/**
 * PURPOSE: Defines the data `bootLockAcquireBroker` returns
 *
 * USAGE:
 * bootLockAcquireResultContract.parse(value);
 * // Returns validated BootLockAcquireResult
 */
import { z } from '#gateway/npm/zod';
import { bootLockContract } from '../boot-lock/boot-lock-contract';

export const bootLockAcquireResultContract = z
  .object({ lock: bootLockContract, tookOverStale: z.boolean() })
  .brand<'BootLockAcquireResult'>();

export type BootLockAcquireResult = z.infer<typeof bootLockAcquireResultContract>;
