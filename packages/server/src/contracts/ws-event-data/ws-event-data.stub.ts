import type { StubArgument } from '@dungeonmaster/shared/@types';
import { wsEventDataContract } from './ws-event-data-contract';
import type { WsEventData } from './ws-event-data-contract';

export const WsEventDataStub = ({ ...props }: StubArgument<WsEventData> = {}): WsEventData =>
  wsEventDataContract.parse({ data: '', ...props });
