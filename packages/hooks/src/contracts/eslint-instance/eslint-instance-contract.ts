/**
 * PURPOSE: Zod schema for ESLint instance with minimal required properties
 *
 * USAGE:
 * const instance = eslintInstanceContract.parse({ calculateConfigForFile: async () => ({}) });
 * // Returns validated EslintInstance object
 */
import { z } from 'zod';

export const eslintInstanceContract = z.object({
  calculateConfigForFile: z.function().optional(),
});

export type EslintInstance = z.infer<typeof eslintInstanceContract> & {
  calculateConfigForFile?: (filePath: string) => Promise<unknown>;
};
