import type { StubArgument } from '@dungeonmaster/shared/@types';
import { openHandleContract, type OpenHandle } from './open-handle-contract';

export const OpenHandleStub = ({ ...props }: StubArgument<OpenHandle> = {}): OpenHandle =>
  openHandleContract.parse({
    name: 'Error',
    message: 'TCPSERVERWRAP',
    stack: 'at Server.listen (src/startup/start-server.ts:12:5)',
    ...props,
  });
