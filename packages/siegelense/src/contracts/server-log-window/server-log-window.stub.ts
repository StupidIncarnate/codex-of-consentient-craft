import type { StubArgument } from '@dungeonmaster/shared/@types';

import { serverLogWindowContract } from './server-log-window-contract';
import type { ServerLogWindow } from './server-log-window-contract';

export const ServerLogWindowStub = ({
  ...props
}: StubArgument<ServerLogWindow> = {}): ServerLogWindow =>
  serverLogWindowContract.parse({
    fromByte: 0,
    toByte: 512,
    ...props,
  });
