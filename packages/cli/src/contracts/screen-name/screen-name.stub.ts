/**
 * PURPOSE: Stub factory for ScreenName branded type
 *
 * USAGE:
 * const name = ScreenNameStub();
 * // Returns: 'MainScreen'
 */

import { screenNameContract } from './screen-name-contract';
import type { ScreenName } from './screen-name-contract';

export const ScreenNameStub = (
  { value }: { value: string } = { value: 'MainScreen' },
): ScreenName => screenNameContract.parse(value);
