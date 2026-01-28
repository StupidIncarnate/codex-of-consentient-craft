/**
 * PURPOSE: Stub factory for DebugResponse type
 *
 * USAGE:
 * const response = DebugResponseStub();
 * // Returns: { success: true, screen: {...} }
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { debugResponseContract } from './debug-response-contract';
import type { DebugResponse } from './debug-response-contract';
import { ScreenNameStub } from '../screen-name/screen-name.stub';
import { TerminalFrameStub } from '../terminal-frame/terminal-frame.stub';

export const DebugResponseStub = ({ ...props }: StubArgument<DebugResponse> = {}): DebugResponse =>
  debugResponseContract.parse({
    success: true,
    screen: {
      name: ScreenNameStub(),
      frame: TerminalFrameStub(),
      elements: [],
    },
    ...props,
  });
