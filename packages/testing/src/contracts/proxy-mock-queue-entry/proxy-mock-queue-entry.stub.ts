import type { StubArgument } from '@dungeonmaster/shared/@types';
import { proxyMockQueueEntryContract } from './proxy-mock-queue-entry-contract';
import type { ProxyMockQueueEntry } from './proxy-mock-queue-entry-contract';
import { FilePathStub } from '../file-path/file-path.stub';

export const ProxyMockQueueEntryStub = ({
  ...props
}: StubArgument<ProxyMockQueueEntry> = {}): ProxyMockQueueEntry =>
  proxyMockQueueEntryContract.parse({
    filePath: FilePathStub({ value: '/repo/packages/shared/src/a.proxy.ts' }),
    requestedNames: null,
    ...props,
  });
