import type { StubArgument } from '@dungeonmaster/shared/@types';
import { proxyMockQueueEntryContract } from './proxy-mock-queue-entry-contract';
import type { ProxyMockQueueEntry } from './proxy-mock-queue-entry-contract';

export const ProxyMockQueueEntryStub = ({
  ...props
}: StubArgument<ProxyMockQueueEntry> = {}): ProxyMockQueueEntry =>
  proxyMockQueueEntryContract.parse({
    filePath: '/repo/packages/shared/src/a.proxy.ts',
    requestedNames: null,
    ...props,
  });
