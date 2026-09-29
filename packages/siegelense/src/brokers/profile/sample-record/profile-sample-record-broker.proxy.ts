/**
 * PURPOSE: Stages one beat's whole path — the registry read the pool size is counted from, the
 * profiles directory chain, and the record file's own existence, read and write — behind two
 * scenario methods a test calls in the SAME order the broker reaches them. `setupFirstBeat` is a
 * record that is not there yet; `setupLaterBeat` is one already on disk, whose JSON the test supplies
 * so the merge can be graded against a real prior state. The home/root triple is fixed here because
 * `registryReadBrokerProxy` hard-codes the same one, and a second value would make the two chains
 * resolve different registries.
 *
 * USAGE:
 * const proxy = profileSampleRecordBrokerProxy();
 * proxy.setupFirstBeat({ profilesPath, instanceId, registry });
 * proxy.getWrittenRecord({ profilesPath, instanceId });
 */

import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { join } from '#gateway/node/path';
import {
  AbsoluteFilePathStub,
  ContentTextStub,
  FilePathStub,
} from '@dungeonmaster/shared/contracts';
import type { ContentText, FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';

import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import type { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';
import { profileStatics } from '../../../statics/profile/profile-statics';
import { laneSpecFindBrokerProxy } from '../../lane-spec/find/lane-spec-find-broker.proxy';
import { laneSpecHashBrokerProxy } from '../../lane-spec/hash/lane-spec-hash-broker.proxy';
import { locationsProfileDirsFindBrokerProxy } from '../../locations/profile-dirs-find/locations-profile-dirs-find-broker.proxy';
import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';

type InstanceId = ReturnType<typeof InstanceIdStub>;
type Registry = ReturnType<typeof RegistryStub>;

const HOME_DIR = '/home/user';
const HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const ROOT_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });

export const profileSampleRecordBrokerProxy = (): {
  setupFirstBeat: (params: {
    profilesPath: FilePath;
    instanceId: InstanceId;
    registry: Registry;
  }) => void;
  setupLaterBeat: (params: {
    profilesPath: FilePath;
    instanceId: InstanceId;
    registry: Registry;
    existingRecordJson: string;
  }) => void;
  getWrittenRecord: (params: { profilesPath: FilePath; instanceId: InstanceId }) => unknown;
  getStderrMessages: () => readonly ContentText[];
} => {
  // Both are empty proxies — the spec lookup is a statics read and the hash is a real digest the
  // tests want computed for real. Constructed to satisfy enforce-proxy-child-creation.
  laneSpecFindBrokerProxy();
  laneSpecHashBrokerProxy();

  const registryProxy = registryReadBrokerProxy();
  const dirsProxy = locationsProfileDirsFindBrokerProxy();
  // join carries no gateway proxy of its own (#gateway/node/path is a raw passthrough), so a
  // real-passthrough default is registered directly here — the record-path join is never
  // explicitly staged, only ever computed for real.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const existsProxy = existsSyncProxy();
  const readProxy = readFileProxy();
  const mkdirProxy = ensureDirProxy();
  const writeProxy = writeFileProxy();
  const stderr = stderrProxy();

  const samplesDirFor = ({ profilesPath }: { profilesPath: FilePath }): FilePath =>
    FilePathStub({ value: `${String(profilesPath)}/${profileStatics.dirs.samples}` });

  const recordPathFor = ({
    profilesPath,
    instanceId,
  }: {
    profilesPath: FilePath;
    instanceId: InstanceId;
  }): FilePath =>
    FilePathStub({
      value: `${String(samplesDirFor({ profilesPath }))}/${instanceId}${profileStatics.extensions.record}`,
    });

  const stageChain = ({
    profilesPath,
    instanceId,
    registry,
  }: {
    profilesPath: FilePath;
    instanceId: InstanceId;
    registry: Registry;
  }): void => {
    // Call order: the registry read resolves its own path chain first, then the profiles chain.
    // The gateway `join` mock's real-passthrough default is shared by both, so staging them the
    // other way round would hand the registry's resolution the profiles path.
    registryProxy.setupPresentRegistry({ content: JSON.stringify(registry) });
    dirsProxy.setupProfilesPath({
      homeDir: HOME_DIR,
      homePath: HOME_PATH,
      rootPath: ROOT_PATH,
      profilesPath,
    });

    mkdirProxy.succeeds({ path: samplesDirFor({ profilesPath }) });
    writeProxy.succeeds({
      path: AbsoluteFilePathStub({
        value: String(recordPathFor({ profilesPath, instanceId })),
      }),
    });
  };

  return {
    setupFirstBeat: ({ profilesPath, instanceId, registry }): void => {
      stageChain({ profilesPath, instanceId, registry });
      existsProxy.returns({
        path: recordPathFor({ profilesPath, instanceId }),
        exists: false,
      });
    },

    setupLaterBeat: ({ profilesPath, instanceId, registry, existingRecordJson }): void => {
      stageChain({ profilesPath, instanceId, registry });
      existsProxy.returns({
        path: recordPathFor({ profilesPath, instanceId }),
        exists: true,
      });
      readProxy.returns({
        path: String(recordPathFor({ profilesPath, instanceId })),
        contents: existingRecordJson,
      });
    },

    getWrittenRecord: ({ profilesPath, instanceId }): unknown =>
      writeProxy.writtenContentsFor({
        path: AbsoluteFilePathStub({
          value: String(recordPathFor({ profilesPath, instanceId })),
        }),
      }),

    getStderrMessages: (): readonly ContentText[] =>
      stderr.getWrites().map((chunk) => ContentTextStub({ value: String(chunk) })),
  };
};
