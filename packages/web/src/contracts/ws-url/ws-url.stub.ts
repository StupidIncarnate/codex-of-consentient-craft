import { wsUrlContract } from './ws-url-contract';
import type { WsUrl } from './ws-url-contract';

export const WsUrlStub = ({ value = 'ws://localhost:3001/ws' }: { value?: string } = {}): WsUrl =>
  wsUrlContract.parse(value);
