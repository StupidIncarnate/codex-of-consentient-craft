import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ServerLogByteCountStub } from '../server-log-byte-count/server-log-byte-count.stub';
import { serverLogWindowContract } from './server-log-window-contract';
import type { ServerLogWindow } from './server-log-window-contract';

export const ServerLogWindowStub = ({
  ...props
}: StubArgument<ServerLogWindow> = {}): ServerLogWindow =>
  serverLogWindowContract.parse({
    fromByte: ServerLogByteCountStub({ value: 0 }),
    toByte: ServerLogByteCountStub({ value: 512 }),
    ...props,
  });
