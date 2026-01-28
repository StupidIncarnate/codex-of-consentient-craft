/**
 * PURPOSE: Defines the interface for ink render results used in debug mode
 *
 * USAGE:
 * const renderResult: DebugRenderResult = inkTestingLibraryRenderAdapter({element});
 * renderResult.lastFrame(); // Get current frame
 * renderResult.stdin.write('text'); // Write to stdin
 * renderResult.unmount(); // Cleanup
 */

import { z } from 'zod';

import type { TerminalFrame } from '../terminal-frame/terminal-frame-contract';

interface DebugRenderResultShape {
  lastFrame: () => TerminalFrame | undefined;
  stdin: {
    write: (data: TerminalFrame) => boolean;
  };
  unmount: () => void;
}

export const debugRenderResultContract = z.custom<DebugRenderResultShape>();

export type DebugRenderResult = z.infer<typeof debugRenderResultContract>;
