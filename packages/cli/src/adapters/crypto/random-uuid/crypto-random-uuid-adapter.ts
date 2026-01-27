/**
 * PURPOSE: Generates a random UUID using Node.js crypto module
 *
 * USAGE:
 * const uuid = cryptoRandomUuidAdapter();
 * // Returns: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
 */

import { randomUUID } from 'crypto';

import type { Uuid } from '../../../contracts/uuid/uuid-contract';
import { uuidContract } from '../../../contracts/uuid/uuid-contract';

export const cryptoRandomUuidAdapter = (): Uuid => uuidContract.parse(randomUUID());
