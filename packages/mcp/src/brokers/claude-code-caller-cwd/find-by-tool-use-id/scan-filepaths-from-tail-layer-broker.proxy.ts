/**
 * PURPOSE: Test setup helper for scanFilepathsFromTailLayerBroker — stages file reads addressed
 * by their PathSegment.
 *
 * USAGE:
 * const proxy = scanFilepathsFromTailLayerBrokerProxy();
 * proxy.setupFile({ filepath: '/a.jsonl', contents: LINE_WITH_MATCH });
 */

import { FileContentsStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const scanFilepathsFromTailLayerBrokerProxy = (): {
  setupFile: (params: { filepath: string; contents: string }) => void;
} => {
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupFile: ({ filepath, contents }: { filepath: string; contents: string }): void => {
      readFileProxy.returnsFor({
        filepath: PathSegmentStub({ value: filepath }),
        contents: FileContentsStub({ value: contents }),
      });
    },
  };
};
