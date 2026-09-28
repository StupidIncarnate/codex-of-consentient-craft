/**
 * PURPOSE: Proxy for wardRowsLayerBroker. Stages both `join` calls the layer makes — the ward
 * blob's path and the riftcarver log's path — by the exact tuple the layer builds each from, since
 * `registerMock` on `join` throws on any call it was not told to expect.
 *
 * USAGE:
 * const proxy = wardRowsLayerBrokerProxy();
 * proxy.setupBlobReadable({ questPath, wardResultId, detailJson });
 * const rows = await wardRowsLayerBroker({ questPath, quest });
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  FilePath,
  RiftcarverResultStub,
  WardResultStub,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import { join } from '#gateway/node/path';

type WardResultId = ReturnType<typeof WardResultStub>['id'];
type RiftcarverResultId = ReturnType<typeof RiftcarverResultStub>['id'];

const JSON_EXTENSION = '.json';
const LOG_EXTENSION = '.log';

export const wardRowsLayerBrokerProxy = (): {
  setupBlobReadable: (params: {
    questPath: AbsoluteFilePath;
    wardResultId: WardResultId;
    detailJson: string;
  }) => void;
  setupBlobMissing: (params: { questPath: AbsoluteFilePath; wardResultId: WardResultId }) => void;
  setupCarveLog: (params: { questPath: AbsoluteFilePath; carveId: RiftcarverResultId }) => void;
  blobPathFor: (params: { questPath: AbsoluteFilePath; wardResultId: WardResultId }) => FilePath;
  logPathFor: (params: { questPath: AbsoluteFilePath; carveId: RiftcarverResultId }) => FilePath;
} => {
  const joinHandle: MockHandle = registerMock({ fn: join });
  const readFileHandle = readFileIfExistsProxy();

  const blobPathFor = ({
    questPath,
    wardResultId,
  }: {
    questPath: AbsoluteFilePath;
    wardResultId: WardResultId;
  }): FilePath =>
    filePathContract.parse(
      `${String(questPath)}/${locationsStatics.quest.wardResultsDir}/${String(wardResultId)}${JSON_EXTENSION}`,
    );

  const logPathFor = ({
    questPath,
    carveId,
  }: {
    questPath: AbsoluteFilePath;
    carveId: RiftcarverResultId;
  }): FilePath =>
    filePathContract.parse(
      `${String(questPath)}/${locationsStatics.quest.riftcarverResultsDir}/${String(carveId)}${LOG_EXTENSION}`,
    );

  return {
    blobPathFor,
    logPathFor,

    setupBlobReadable: ({ questPath, wardResultId, detailJson }): void => {
      const blobPath = blobPathFor({ questPath, wardResultId });
      joinHandle
        .calledWith([
          questPath,
          locationsStatics.quest.wardResultsDir,
          `${String(wardResultId)}${JSON_EXTENSION}`,
        ])
        .returns(blobPath);
      readFileHandle.returns({ path: blobPath, contents: detailJson });
    },

    setupBlobMissing: ({ questPath, wardResultId }): void => {
      const blobPath = blobPathFor({ questPath, wardResultId });
      joinHandle
        .calledWith([
          questPath,
          locationsStatics.quest.wardResultsDir,
          `${String(wardResultId)}${JSON_EXTENSION}`,
        ])
        .returns(blobPath);
      readFileHandle.missing({ path: blobPath });
    },

    setupCarveLog: ({ questPath, carveId }): void => {
      const logPath = logPathFor({ questPath, carveId });
      joinHandle
        .calledWith([
          questPath,
          locationsStatics.quest.riftcarverResultsDir,
          `${String(carveId)}${LOG_EXTENSION}`,
        ])
        .returns(logPath);
    },
  };
};
