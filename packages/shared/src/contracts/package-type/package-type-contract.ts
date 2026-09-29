/**
 * PURPOSE: Defines the branded enum of detected package architecture types
 *
 * USAGE:
 * packageTypeContract.parse('http-backend');
 * // Returns: 'http-backend' as PackageType
 */

import { z } from '#gateway/npm/zod';

export const packageTypeContract = z.enum([
  'http-backend',
  'mcp-server',
  'frontend-react',
  'frontend-ink',
  'hook-handlers',
  'eslint-plugin',
  'cli-tool',
  'programmatic-service',
  'library',
]);

export type PackageType = z.infer<typeof packageTypeContract>;
