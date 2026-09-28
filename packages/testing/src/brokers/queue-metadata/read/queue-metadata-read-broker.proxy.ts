/**
 * PURPOSE: Proxy for queue-metadata-read-broker — stages the metadata file's JSON content, or the
 * fs error reading it raises, addressed by its path.
 *
 * USAGE:
 * const proxy = queueMetadataReadBrokerProxy();
 * proxy.returns({ metadataPath: '/tmp/queue/metadata.json', json: '{"counter":3}' });
 * proxy.throws({ metadataPath: '/tmp/gone/metadata.json', error: FsErrorStub({ code: 'ENOENT' }) });
 */

import { readJsonFileSyncProxy } from '#gateway/node/fs/read-json-file-sync/read-json-file-sync.proxy';

export const queueMetadataReadBrokerProxy = (): {
  returns: ({ metadataPath, json }: { metadataPath: string; json: string }) => void;
  throws: ({ metadataPath, error }: { metadataPath: string; error: NodeJS.ErrnoException }) => void;
} => {
  const readProxy = readJsonFileSyncProxy();

  return {
    returns: ({ metadataPath, json }: { metadataPath: string; json: string }): void => {
      readProxy.returns({ path: metadataPath, json });
    },
    throws: ({
      metadataPath,
      error,
    }: {
      metadataPath: string;
      error: NodeJS.ErrnoException;
    }): void => {
      readProxy.throws({ path: metadataPath, error });
    },
  };
};
