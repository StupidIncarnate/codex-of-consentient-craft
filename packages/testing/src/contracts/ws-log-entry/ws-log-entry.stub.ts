import type { StubArgument } from '@dungeonmaster/shared/@types';
import { wsLogEntryContract, type WsLogEntry } from './ws-log-entry-contract';

export const WsLogEntryStub = ({ ...props }: StubArgument<WsLogEntry> = {}): WsLogEntry =>
  wsLogEntryContract.parse({
    direction: 'received',
    data: '{"type":"quest-modified","payload":{"id":"abc","status":"in_progress"}}',
    elapsedMs: 12,
    ...props,
  });
