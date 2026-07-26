/**
 * PURPOSE: Proxy for fs-queue-metadata-read-adapter
 *
 * USAGE:
 * const proxy = fsQueueMetadataReadAdapterProxy();
 * proxy.returns({ metadataPath: '/path', metadata: QueueMetadataStub({ counter: 3 }) });
 */

import { readFileSync } from 'fs';
import type { QueueMetadata } from '../../../contracts/queue-metadata/queue-metadata-contract';
import { registerMock } from '../../../register-mock';

export const fsQueueMetadataReadAdapterProxy = (): {
  returns: ({ metadataPath, metadata }: { metadataPath: string; metadata: QueueMetadata }) => void;
  throws: ({ metadataPath, error }: { metadataPath: string; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFileSync });

  mock.calledWith([]).returns(JSON.stringify({ counter: 0 }));

  return {
    returns: ({
      metadataPath,
      metadata,
    }: {
      metadataPath: string;
      metadata: QueueMetadata;
    }): void => {
      mock.calledWith([metadataPath]).returns(JSON.stringify(metadata));
    },
    throws: ({ metadataPath, error }: { metadataPath: string; error: Error }): void => {
      mock.calledWith([metadataPath]).throws(error);
    },
  };
};
