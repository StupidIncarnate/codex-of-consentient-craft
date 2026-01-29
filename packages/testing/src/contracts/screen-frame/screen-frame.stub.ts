/**
 * PURPOSE: Creates test data for ScreenFrame contract
 *
 * USAGE:
 * const frame = ScreenFrameStub(); // Returns default menu frame
 * const custom = ScreenFrameStub({ value: 'custom output' });
 */

import { screenFrameContract } from './screen-frame-contract';
import type { ScreenFrame } from './screen-frame-contract';

export const ScreenFrameStub = (
  { value }: { value: string } = { value: '┌──────────┐\n│  Menu    │\n└──────────┘' },
): ScreenFrame => screenFrameContract.parse(value);
