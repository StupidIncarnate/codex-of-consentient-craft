/**
 * PURPOSE: Defines the input schema for the MCP ward-list tool that shows errors by file from a ward run
 *
 * USAGE:
 * const input: WardListInput = wardListInputContract.parse({ runId: '1739625600000-a3f1' });
 * // Returns validated WardListInput with optional runId
 */
import { z } from 'zod';

export const wardListInputContract = z
  .object({
    runId: z
      .string()
      .regex(/^\d+-[a-f0-9]+$/u, 'Invalid RunId format: expected timestamp-hex pattern')
      .describe('The run ID to list errors for. If omitted, uses the most recent run.')
      .optional(),
  })
  .brand<'WardListInput'>();

export type WardListInput = z.infer<typeof wardListInputContract>;
