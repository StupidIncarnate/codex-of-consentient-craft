import type { StubArgument } from '@dungeonmaster/shared/@types';

import { TerminalFrameStub } from '../terminal-frame/terminal-frame.stub';
import { debugRenderResultContract } from './debug-render-result-contract';
import type { DebugRenderResult } from './debug-render-result-contract';

export const DebugRenderResultStub = ({
  ...props
}: StubArgument<DebugRenderResult> = {}): DebugRenderResult =>
  debugRenderResultContract.parse({
    lastFrame: jest.fn(() => TerminalFrameStub()),
    stdin: {
      write: jest.fn(() => true),
    },
    unmount: jest.fn(),
    ...props,
  });
