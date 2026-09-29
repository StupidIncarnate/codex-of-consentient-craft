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

import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
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
  // mkdir only — for a caller that stages the write and Date.now() through its own means (a
  // shared writeHandle predicate, a call-count-tuned dateNowHandle queue) and only needs the
  // boots directory itself created, without setupBootRecordWrite's own sticky Date.now() default
  // colliding with that queue.
  setupBootsDirCreated: (params: { profilesPath: FilePath }) => void;
  getWrittenRecord: (params: { profilesPath: FilePath; instanceId: InstanceId }) => unknown;
} => {
  // Constructed, never staged: the record-path join runs through the real passthrough default
  // dirsProxy's own composition chain already registers on '#gateway/node/path's `join`.
  const dirsProxy = locationsProfileDirsFindBrokerProxy();
  const mkdirProxy = ensureDirProxy();
  const writeProxy = writeFileProxy();
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
      mkdirProxy.succeeds({ path: bootsDirValue });
      writeProxy.succeeds({
        path: AbsoluteFilePathStub({
          value: `${bootsDirValue}/${instanceId}${profileStatics.extensions.record}`,
        }),
      });
      dateHandle.calledWith([]).returns(nowMs);
    },

    setupBootsDirCreated: ({ profilesPath }: { profilesPath: FilePath }): void => {
      mkdirProxy.succeeds({
        path: `${String(profilesPath)}/${profileStatics.dirs.boots}`,
      });
    },

    getWrittenRecord: ({
      profilesPath,
      instanceId,
    }: {
      profilesPath: FilePath;
      instanceId: InstanceId;
    }): unknown =>
      writeProxy.writtenContentsFor({
        path: AbsoluteFilePathStub({
          value: `${String(profilesPath)}/${profileStatics.dirs.boots}/${instanceId}${profileStatics.extensions.record}`,
        }),
      }),
  };
};
