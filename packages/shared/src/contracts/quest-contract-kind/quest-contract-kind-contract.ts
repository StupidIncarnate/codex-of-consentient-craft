/**
 * PURPOSE: Contract kind: "data" for Zod schema types, "endpoint" for API boundaries, "event" for EventEmitter/WebSocket schemas
 *
 * USAGE:
 * questContractKindContract.parse('data');
 * // Returns: 'data' as QuestContractKind
 */

import { z } from 'zod';

export const questContractKindContract = z
  .enum(['data', 'endpoint', 'event'])
  .describe(
    'Contract kind: "data" for Zod schema types, "endpoint" for API boundaries (method/path/request/response), "event" for EventEmitter/WebSocket schemas',
  );

export type QuestContractKind = z.infer<typeof questContractKindContract>;
