/**
 * PURPOSE: Defines valid smoketest suite names that the Tooling dropdown can launch
 *
 * USAGE:
 * smoketestSuiteContract.parse('mcp');
 * // Returns: 'mcp' as SmoketestSuite
 */

import { z } from 'zod';

export const smoketestSuiteContract = z.enum(['all', 'mcp', 'signals', 'orchestration']);

export type SmoketestSuite = z.infer<typeof smoketestSuiteContract>;
