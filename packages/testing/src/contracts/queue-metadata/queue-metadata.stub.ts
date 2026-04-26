import type { StubArgument } from '@dungeonmaster/shared/@types';

import { queueMetadataContract, type QueueMetadata } from './queue-metadata-contract';

export const QueueMetadataStub = ({ ...props }: StubArgument<QueueMetadata> = {}): QueueMetadata =>
  queueMetadataContract.parse({
    counter: 0,
    ...props,
  });
