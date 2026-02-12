import type { StubArgument } from '@dungeonmaster/shared/@types';

import { wsMessageContract } from './ws-message-contract';
import type { WsMessage } from './ws-message-contract';

export const WsMessageStub = ({ ...props }: StubArgument<WsMessage> = {}): WsMessage =>
  wsMessageContract.parse({
    type: 'phase-change',
    payload: { processId: 'proc-12345', phase: 'codeweaver' },
    timestamp: '2025-01-01T00:00:00.000Z',
    ...props,
  });
