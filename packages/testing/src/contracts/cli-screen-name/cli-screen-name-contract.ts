/**
 * PURPOSE: Validates CLI screen identifiers for E2E testing
 *
 * USAGE:
 * const screen = cliScreenNameContract.parse('menu');
 * // Returns validated CliScreenName branded type
 */

import { z } from 'zod';

export const cliScreenNameContract = z
  .enum(['menu', 'add', 'list', 'help', 'run', 'answer', 'init'])
  .brand<'CliScreenName'>();

export type CliScreenName = z.infer<typeof cliScreenNameContract>;
