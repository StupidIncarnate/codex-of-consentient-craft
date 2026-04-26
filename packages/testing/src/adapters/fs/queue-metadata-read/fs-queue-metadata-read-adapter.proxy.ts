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
  returns: ({ metadata }: { metadataPath: string; metadata: QueueMetadata }) => void;
  throws: ({ error }: { metadataPath: string; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFileSync });

  mock.mockReturnValue(JSON.stringify({ counter: 0 }));

  return {
    returns: ({ metadata }: { metadataPath: string; metadata: QueueMetadata }): void => {
      mock.mockReturnValueOnce(JSON.stringify(metadata));
    },
    throws: ({ error }: { metadataPath: string; error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
