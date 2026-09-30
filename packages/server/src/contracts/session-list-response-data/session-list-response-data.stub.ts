import { SessionListItemStub } from '@dungeonmaster/shared/contracts/session-list-item/session-list-item.stub';
import { sessionListResponseDataContract } from './session-list-response-data-contract';
import type { SessionListResponseData } from './session-list-response-data-contract';

export const SessionListResponseDataStub = (): SessionListResponseData =>
  sessionListResponseDataContract.parse([SessionListItemStub()]);
