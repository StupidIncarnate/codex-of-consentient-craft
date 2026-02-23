/**
 * PURPOSE: Wraps crypto.randomUUID() for generating unique identifiers
 *
 * USAGE:
 * const uuid = cryptoRandomUuidAdapter();
 * // Returns a random UUID v4 string
 */

import crypto from 'crypto';

import { processIdContract } from '../../../contracts/process-id/process-id-contract';
import type { ProcessId } from '../../../contracts/process-id/process-id-contract';

export const cryptoRandomUuidAdapter = (): ProcessId =>
  processIdContract.parse(crypto.randomUUID());
