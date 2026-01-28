/**
 * PURPOSE: Stub factory for TerminalFrame branded type
 *
 * USAGE:
 * const frame = TerminalFrameStub();
 * // Returns: '┌─────────┐\n│ Content │\n└─────────┘'
 */

import { terminalFrameContract } from './terminal-frame-contract';
import type { TerminalFrame } from './terminal-frame-contract';

export const TerminalFrameStub = (
  { value }: { value: string } = { value: '┌─────────┐\n│ Content │\n└─────────┘' },
): TerminalFrame => terminalFrameContract.parse(value);
