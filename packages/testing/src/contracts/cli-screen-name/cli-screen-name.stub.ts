/**
 * PURPOSE: Creates test data for CliScreenName contract
 *
 * USAGE:
 * const screen = CliScreenNameStub(); // Returns 'menu'
 * const addScreen = CliScreenNameStub({ value: 'add' });
 */

import { cliScreenNameContract } from './cli-screen-name-contract';
import type { CliScreenName } from './cli-screen-name-contract';

export const CliScreenNameStub = (
  { value }: { value: string } = { value: 'menu' },
): CliScreenName => cliScreenNameContract.parse(value);
