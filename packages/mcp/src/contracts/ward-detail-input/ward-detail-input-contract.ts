/**
 * PURPOSE: Defines the input schema for the MCP ward-detail tool that shows detailed errors for a file
 *
 * USAGE:
 * const input: WardDetailInput = wardDetailInputContract.parse({ runId: '1739625600000-a3f1', filePath: 'src/app.ts' });
 * // Returns validated WardDetailInput with runId, filePath, and optional verbose flag
 */
import { z } from 'zod';

export const wardDetailInputContract = z
  .object({
    runId: z
      .string()
      .regex(/^\d+-[a-f0-9]+$/u, 'Invalid RunId format: expected timestamp-hex pattern')
      .describe('The run ID to show details for'),
    filePath: z
      .string()
      .min(1)
      .describe('The file path to show detailed errors for')
      .brand<'WardFilePath'>(),
    verbose: z
      .boolean()
      .describe('Whether to show verbose output including full stack traces')
      .optional(),
    packagePath: z
      .string()
      .describe(
        'Optional package path relative to repo root (e.g., "packages/mcp"). Omit for repo root.',
      )
      .optional(),
  })
  .brand<'WardDetailInput'>();

export type WardDetailInput = z.infer<typeof wardDetailInputContract>;
