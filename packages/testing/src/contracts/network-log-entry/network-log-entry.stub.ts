import type { StubArgument } from '@dungeonmaster/shared/@types';
import { networkLogEntryContract, type NetworkLogEntry } from './network-log-entry-contract';

export const NetworkLogEntryStub = ({
  ...props
}: StubArgument<NetworkLogEntry> = {}): NetworkLogEntry =>
  networkLogEntryContract.parse({
    method: 'GET',
    url: '/api/guilds',
    source: 'mock',
    ...props,
  });
