/**
 * PURPOSE: Zod schema for ESLint instance with minimal required properties
 *
 * USAGE:
 * const instance = eslintInstanceContract.parse({ calculateConfigForFile: async () => ({}) });
 * // Returns validated EslintInstance object
 */
import { z } from '#gateway/npm/zod';

// `calculateConfigForFile` and `isPathIgnored` are functions — a Zod object schema cannot check
// callability, so both stay out of the parse and are attached only through the type intersection
// below. `.loose()` keeps `z.infer` of the empty shape from narrowing to `Record<string, never>`
// (zod v4), which the intersection below could never satisfy.
export const eslintInstanceContract = z.object({}).loose();

export type EslintInstance = z.infer<typeof eslintInstanceContract> & {
  calculateConfigForFile?: (filePath: string) => Promise<unknown>;
  isPathIgnored?: (filePath: string) => Promise<boolean>;
};
