import type { StubArgument } from '@dungeonmaster/shared/@types';

import { renderCapabilitiesContract } from './render-capabilities-contract';
import type { RenderCapabilities } from './render-capabilities-contract';
import { TerminalFrameStub } from '../terminal-frame/terminal-frame.stub';

export const RenderCapabilitiesStub = ({
  ...props
}: StubArgument<RenderCapabilities> = {}): RenderCapabilities =>
  renderCapabilitiesContract.parse({
    writeStdin: (): boolean => true,
    getFrame: () => TerminalFrameStub(),
    unmount: (): void => {
      // No-op
    },
    ...props,
  });
