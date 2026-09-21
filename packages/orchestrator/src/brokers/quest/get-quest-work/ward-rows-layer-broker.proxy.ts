/**
 * PURPOSE: Proxy for wardRowsLayerBroker. Stages the blob read, keyed on the REAL joined path —
 * `pathJoinAdapterProxy`'s unstaged default is a genuine `path.join`, so the layer builds its own
 * addresses and a scenario answering for the ward blob cannot also answer the carve log's join.
 *
 * USAGE:
 * const proxy = wardRowsLayerBrokerProxy();
 * proxy.setupBlobReadable({ questPath, wardResultId, detailJson });
 * const rows = await wardRowsLayerBroker({ questPath, quest });
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FilePath, WardResultStub } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

type WardResultId = ReturnType<typeof WardResultStub>['id'];

const WARD_RESULTS_DIR = 'ward-results';

export const wardRowsLayerBrokerProxy = (): {
  setupBlobReadable: (params: {
    questPath: AbsoluteFilePath;
    wardResultId: WardResultId;
    detailJson: string;
  }) => void;
  setupBlobMissing: (params: { questPath: AbsoluteFilePath; wardResultId: WardResultId }) => void;
  blobPathFor: (params: { questPath: AbsoluteFilePath; wardResultId: WardResultId }) => FilePath;
} => {
  // Created, never staged: the unstaged default is a real `path.join`, which is what lets the two
  // fs mocks below be addressed by the path the layer actually builds.
  pathJoinAdapterProxy();
  const isAccessibleProxy = fsIsAccessibleAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  const blobPathFor = ({
    questPath,
    wardResultId,
  }: {
    questPath: AbsoluteFilePath;
    wardResultId: WardResultId;
  }): FilePath =>
    filePathContract.parse(`${String(questPath)}/${WARD_RESULTS_DIR}/${String(wardResultId)}.json`);

  return {
    blobPathFor,

    setupBlobReadable: ({ questPath, wardResultId, detailJson }): void => {
      const blobPath = blobPathFor({ questPath, wardResultId });
      isAccessibleProxy.resolves({ filePath: blobPath });
      readFileProxy.resolves({ filePath: blobPath, content: detailJson });
    },

    setupBlobMissing: ({ questPath, wardResultId }): void => {
      isAccessibleProxy.rejects({
        filePath: blobPathFor({ questPath, wardResultId }),
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },
  };
};
