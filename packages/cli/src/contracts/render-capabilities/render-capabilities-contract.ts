/**
 * PURPOSE: Defines the interface for render capabilities provided to the debug session broker
 *
 * USAGE:
 * const capabilities: RenderCapabilities = {
 *   writeStdin: (text) => stdin.write(text),
 *   getFrame: () => lastFrame() ?? '',
 *   unmount: () => unmount(),
 * };
 */

import { z } from 'zod';

import type { TerminalFrame } from '../terminal-frame/terminal-frame-contract';

export const renderCapabilitiesContract = z.object({
  writeStdin: z.custom<(text: string) => boolean>(),
  getFrame: z.custom<() => TerminalFrame>(),
  unmount: z.custom<() => void>(),
});

export type RenderCapabilities = z.infer<typeof renderCapabilitiesContract>;
