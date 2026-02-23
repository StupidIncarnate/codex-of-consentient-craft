/**
 * PURPOSE: Defines the input schema for the MCP ward-raw tool that shows raw tool output from a ward run
 *
 * USAGE:
 * const input: WardRawInput = wardRawInputContract.parse({ runId: '1739625600000-a3f1', checkType: 'lint' });
 * // Returns validated WardRawInput with runId and checkType
 */
import { z } from 'zod';

export const wardRawInputContract = z
  .object({
    runId: z
      .string()
      .regex(/^\d+-[a-f0-9]+$/u, 'Invalid RunId format: expected timestamp-hex pattern')
      .describe('The run ID to show raw output for'),
    checkType: z
      .enum(['lint', 'typecheck', 'unit', 'e2e'])
      .describe('The check type to show raw output for'),
    packagePath: z
      .string()
      .describe(
        'Optional package path relative to repo root (e.g., "packages/mcp"). Omit for repo root.',
      )
      .optional(),
  })
  .brand<'WardRawInput'>();

export type WardRawInput = z.infer<typeof wardRawInputContract>;
