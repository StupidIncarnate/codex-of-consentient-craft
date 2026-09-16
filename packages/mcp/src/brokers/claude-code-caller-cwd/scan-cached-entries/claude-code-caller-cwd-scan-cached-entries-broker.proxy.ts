/**
 * PURPOSE: Test setup helper for claudeCodeCallerCwdScanCachedEntriesBroker — stages a cached
 * file's current on-disk size and full contents, so the broker's own offset-vs-size comparison
 * and delta slice run for real against staged data.
 *
 * USAGE:
 * const proxy = claudeCodeCallerCwdScanCachedEntriesBrokerProxy();
 * proxy.setupFile({ filepath: '/a.jsonl', contents: 'line1\nline2' });
 */

import { FileContentsStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';

export const claudeCodeCallerCwdScanCachedEntriesBrokerProxy = (): {
  setupFile: (params: { filepath: string; contents: string }) => void;
} => {
  const statProxy = fsStatAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupFile: ({ filepath, contents }: { filepath: string; contents: string }): void => {
      const filepathStub = PathSegmentStub({ value: filepath });
      statProxy.returns({ filepath: filepathStub, stats: { size: contents.length } });
      readFileProxy.returnsFor({
        filepath: filepathStub,
        contents: FileContentsStub({ value: contents }),
      });
    },
  };
};
