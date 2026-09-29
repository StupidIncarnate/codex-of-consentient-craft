/**
 * PURPOSE: Stages a profile tree on disk — the directory chain, what each of the two directories
 * lists, and the bytes behind each record named in those listings. Split into a tree method and two
 * per-record methods rather than one nested structure, so a test names one file at a time and reads
 * back exactly what it staged.
 *
 * USAGE:
 * const proxy = profileReadBrokerProxy();
 * proxy.setupProfileTree({ profilesPath, sampleFileNames: ['inst_a.json'], bootFileNames: [] });
 * proxy.stageSampleRecord({ profilesPath, fileName: 'inst_a.json', json });
 */

import { ContentTextStub } from '@dungeonmaster/shared/contracts/content-text/content-text.stub';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import type { ContentText, FilePath } from '@dungeonmaster/shared/contracts';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { ProfileObservationStub } from '../../../contracts/profile-observation/profile-observation.stub';
import { SpecHashStub } from '../../../contracts/spec-hash/spec-hash.stub';
import type { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';
import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { DevServerE2eProcess } from '@dungeonmaster/config';

import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { profileStatics } from '../../../statics/profile/profile-statics';
import { laneSpecFindBrokerProxy } from '../../lane-spec/find/lane-spec-find-broker.proxy';
import { laneSpecHashBrokerProxy } from '../../lane-spec/hash/lane-spec-hash-broker.proxy';
import { locationsProfileDirsFindBrokerProxy } from '../../locations/profile-dirs-find/locations-profile-dirs-find-broker.proxy';

const HOME_DIR = '/home/user';
const HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const ROOT_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });
const PROFILES_ROOT_VALUE = `${String(ROOT_PATH)}/${locationsStatics.siegelense.profilesDir}/`;
// laneSpecHashBroker's real sha256 digest of laneSpecFindBrokerProxy's sticky default spec (one
// headless api process, spec name `api`); the profile directory a scenario for that spec reads.
const DEFAULT_SPEC_HASH_VALUE = 'd710f23b94181fa9168a01db4dfc9a25bd0a4dd95887c301d34ca3bb51931583';
const DEFAULT_PROFILES_PATH = FilePathStub({
  value: `${PROFILES_ROOT_VALUE}${DEFAULT_SPEC_HASH_VALUE}`,
});

const RECORD_INDEX_WIDTH = 4;

type SpecProfile = ReturnType<typeof SpecProfileStub>;

export const profileReadBrokerProxy = (): {
  // Stages the default `api` spec's profile tree with one record per run in every sample group, each
  // carrying that group's own peak and steady figures, so the folded profile reads back exactly
  // these `samples`. `profile.samples` is the only part of the profile the tree can express.
  setupSpecProfile: (params: { profile: SpecProfile }) => void;
  // A spec whose profile directory holds nothing yet, for every spec hash under the profiles root.
  setupNoProfileForAnySpec: () => void;
  setupProfileTree: (params: {
    profilesPath: FilePath;
    sampleFileNames: readonly string[];
    bootFileNames: readonly string[];
  }) => void;
  stageSampleRecord: (params: { profilesPath: FilePath; fileName: string; json: string }) => void;
  stageBootRecord: (params: { profilesPath: FilePath; fileName: string; json: string }) => void;
  stageLaneSpec: (params: { processes: readonly DevServerE2eProcess[] }) => void;
  getStderrMessages: () => readonly ContentText[];
} => {
  // laneSpecFindBrokerProxy() stages a sticky default (a single headless api process) at
  // construction, so the directory the tree hangs off is a genuine content hash of a real spec.
  // stageLaneSpec below overrides it for a scenario needing a different process shape (e.g. the
  // browsered spec's own processes: 3 case). laneSpecHashBrokerProxy is a real digest, never staged.
  const laneSpecProxy = laneSpecFindBrokerProxy();
  laneSpecHashBrokerProxy();

  const dirsProxy = locationsProfileDirsFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper, so
  // no gateway proxy to compose) — mocked directly here. Every per-record join runs through the real
  // passthrough, so the paths a test stages reads against are the ones the broker genuinely computes.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  const readdirProxy = readdirIfExistsProxy();
  const readProxy = readFileProxy();
  const stderr = stderrProxy();

  const underProfilesRoot = ({ value, suffix }: { value: unknown; suffix: string }): boolean =>
    typeof value === 'string' && value.startsWith(PROFILES_ROOT_VALUE) && value.endsWith(suffix);

  return {
    setupSpecProfile: ({ profile }: { profile: SpecProfile }): void => {
      const records = profile.samples.flatMap(({ poolSize, steadyMB, peakMB, runs }) =>
        Array.from({ length: runs }, (_unused, index) => {
          const instanceValue = `inst_${String(poolSize)}${String(index).padStart(RECORD_INDEX_WIDTH, '0')}`;
          return {
            fileName: `${instanceValue}.json`,
            instanceId: InstanceIdStub({ value: instanceValue }),
            poolSize,
            peakMB,
            steadyMB,
          };
        }),
      );
      dirsProxy.setupProfilesPath({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        profilesPath: DEFAULT_PROFILES_PATH,
      });
      readdirProxy.returns({
        path: `${String(DEFAULT_PROFILES_PATH)}/${profileStatics.dirs.samples}`,
        names: records.map(({ fileName }) => fileName),
      });
      readdirProxy.returns({
        path: `${String(DEFAULT_PROFILES_PATH)}/${profileStatics.dirs.boots}`,
        names: [],
      });
      records.forEach(({ fileName, instanceId, poolSize, peakMB, steadyMB }) => {
        readProxy.returns({
          path: `${String(DEFAULT_PROFILES_PATH)}/${profileStatics.dirs.samples}/${fileName}`,
          contents: JSON.stringify(
            ProfileObservationStub({
              instanceId,
              specHash: SpecHashStub({ value: DEFAULT_SPEC_HASH_VALUE }),
              pools: [{ poolSize, peakMB, steadySumMB: steadyMB, steadyBeats: 1 }],
            }),
          ),
        });
      });
    },

    setupNoProfileForAnySpec: (): void => {
      dirsProxy.setupProfilesPath({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        profilesPath: DEFAULT_PROFILES_PATH,
      });
      readdirProxy.returnsMatchingPath({
        path: (value) => underProfilesRoot({ value, suffix: `/${profileStatics.dirs.samples}` }),
        names: [],
      });
      readdirProxy.returnsMatchingPath({
        path: (value) => underProfilesRoot({ value, suffix: `/${profileStatics.dirs.boots}` }),
        names: [],
      });
    },

    setupProfileTree: ({
      profilesPath,
      sampleFileNames,
      bootFileNames,
    }: {
      profilesPath: FilePath;
      sampleFileNames: readonly string[];
      bootFileNames: readonly string[];
    }): void => {
      dirsProxy.setupProfilesPath({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        profilesPath,
      });

      readdirProxy.returns({
        path: `${String(profilesPath)}/${profileStatics.dirs.samples}`,
        names: [...sampleFileNames],
      });
      readdirProxy.returns({
        path: `${String(profilesPath)}/${profileStatics.dirs.boots}`,
        names: [...bootFileNames],
      });
    },

    stageSampleRecord: ({
      profilesPath,
      fileName,
      json,
    }: {
      profilesPath: FilePath;
      fileName: string;
      json: string;
    }): void => {
      readProxy.returns({
        path: `${String(profilesPath)}/${profileStatics.dirs.samples}/${fileName}`,
        contents: json,
      });
    },

    stageBootRecord: ({
      profilesPath,
      fileName,
      json,
    }: {
      profilesPath: FilePath;
      fileName: string;
      json: string;
    }): void => {
      readProxy.returns({
        path: `${String(profilesPath)}/${profileStatics.dirs.boots}/${fileName}`,
        contents: json,
      });
    },

    stageLaneSpec: ({ processes }: { processes: readonly DevServerE2eProcess[] }): void => {
      laneSpecProxy.setupConfiguredProcesses({ processes });
    },

    getStderrMessages: (): readonly ContentText[] =>
      stderr.getWrites().map((chunk) => ContentTextStub({ value: String(chunk) })),
  };
};
