/**
 * PURPOSE: Stages one boot record's write. Its CONSTRUCTOR stages nothing — every setup happens in a
 * semantic method — because `instanceStartBrokerProxy` composes this proxy purely to satisfy
 * `enforce-proxy-child-creation`, and a constructor queuing one-shot path resolutions there would
 * steal entries staged for the dozen unrelated resolvers that file's own boot path drives.
 *
 * USAGE:
 * const proxy = profileBootRecordBrokerProxy();
 * proxy.setupBootRecordWrite({ homeDir, homePath, rootPath, profilesPath, instanceId, nowMs });
 * proxy.getWrittenRecord({ profilesPath, instanceId });
 */

import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import type { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { profileStatics } from '../../../statics/profile/profile-statics';
import { locationsProfileDirsFindBrokerProxy } from '../../locations/profile-dirs-find/locations-profile-dirs-find-broker.proxy';

type InstanceId = ReturnType<typeof InstanceIdStub>;

export const profileBootRecordBrokerProxy = (): {
  setupBootRecordWrite: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    profilesPath: FilePath;
    instanceId: InstanceId;
    nowMs: number;
  }) => void;
  getWrittenRecord: (params: { profilesPath: FilePath; instanceId: InstanceId }) => unknown;
} => {
  const dirsProxy = locationsProfileDirsFindBrokerProxy();
  // Constructed, never staged: the record-path join runs through the real passthrough.
  pathJoinAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const dateHandle = registerSpyOn({ object: Date, method: 'now' });

  return {
    setupBootRecordWrite: ({
      homeDir,
      homePath,
      rootPath,
      profilesPath,
      instanceId,
      nowMs,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      profilesPath: FilePath;
      instanceId: InstanceId;
      nowMs: number;
    }): void => {
      dirsProxy.setupProfilesPath({ homeDir, homePath, rootPath, profilesPath });

      const bootsDirValue = `${String(profilesPath)}/${profileStatics.dirs.boots}`;
      mkdirProxy.succeeds({ filepath: FilePathStub({ value: bootsDirValue }) });
      writeProxy.succeeds({
        filePath: AbsoluteFilePathStub({
          value: `${bootsDirValue}/${instanceId}${profileStatics.extensions.record}`,
        }),
      });
      dateHandle.calledWith([]).returns(nowMs);
    },

    getWrittenRecord: ({
      profilesPath,
      instanceId,
    }: {
      profilesPath: FilePath;
      instanceId: InstanceId;
    }): unknown =>
      writeProxy.getWrittenFor({
        filePath: AbsoluteFilePathStub({
          value: `${String(profilesPath)}/${profileStatics.dirs.boots}/${instanceId}${profileStatics.extensions.record}`,
        }),
      }),
  };
};
