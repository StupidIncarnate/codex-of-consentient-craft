/**
 * PURPOSE: Defines the branded union type for CLI application screen names
 *
 * USAGE:
 * const screen: CliAppScreen = cliAppScreenContract.parse('menu');
 * // Returns validated CliAppScreen branded string
 */

import { z } from 'zod';

export const cliAppScreenContract = z
  .enum(['menu', 'add', 'help', 'list', 'init', 'run', 'answer'] as const)
  .brand<'CliAppScreen'>();

export type CliAppScreen = z.infer<typeof cliAppScreenContract>;
