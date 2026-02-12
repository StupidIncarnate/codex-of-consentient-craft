import type { StubArgument } from '@dungeonmaster/shared/@types';

import { wsClientContract } from './ws-client-contract';
import type { WsClient } from './ws-client-contract';

export const WsClientStub = ({ ...props }: StubArgument<WsClient> = {}): WsClient =>
  wsClientContract.parse({
    send: jest.fn(),
    ...props,
  });
