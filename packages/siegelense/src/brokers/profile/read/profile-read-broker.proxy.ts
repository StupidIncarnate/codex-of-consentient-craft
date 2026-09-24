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

import {
  AbsoluteFilePathStub,
  ContentTextStub,
  FilePathStub,
} from '@dungeonmaster/shared/contracts';
import type { ContentText, FilePath } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { DevServerE2eProcess } from '@dungeonmaster/config';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { profileStatics } from '../../../statics/profile/profile-statics';
import { laneSpecFindBrokerProxy } from '../../lane-spec/find/lane-spec-find-broker.proxy';
import { laneSpecHashBrokerProxy } from '../../lane-spec/hash/lane-spec-hash-broker.proxy';
import { locationsProfileDirsFindBrokerProxy } from '../../locations/profile-dirs-find/locations-profile-dirs-find-broker.proxy';

const HOME_DIR = '/home/user';
const HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const ROOT_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });

export const profileReadBrokerProxy = (): {
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
  // Constructed, never staged: every per-record join runs through the real passthrough, so the
  // paths a test stages reads against are the ones the broker genuinely computes.
  pathJoinAdapterProxy();
  const readdirProxy = fsReaddirAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const stderrHandle = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrHandle.calledWith([]).returns(true);

  return {
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

      readdirProxy.resolves({
        dirPath: AbsoluteFilePathStub({
          value: `${String(profilesPath)}/${profileStatics.dirs.samples}`,
        }),
        entries: sampleFileNames,
      });
      readdirProxy.resolves({
        dirPath: AbsoluteFilePathStub({
          value: `${String(profilesPath)}/${profileStatics.dirs.boots}`,
        }),
        entries: bootFileNames,
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
      readProxy.resolves({
        filePath: AbsoluteFilePathStub({
          value: `${String(profilesPath)}/${profileStatics.dirs.samples}/${fileName}`,
        }),
        content: json,
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
      readProxy.resolves({
        filePath: AbsoluteFilePathStub({
          value: `${String(profilesPath)}/${profileStatics.dirs.boots}/${fileName}`,
        }),
        content: json,
      });
    },

    stageLaneSpec: ({ processes }: { processes: readonly DevServerE2eProcess[] }): void => {
      laneSpecProxy.setupConfiguredProcesses({ processes });
    },

    getStderrMessages: (): readonly ContentText[] =>
      stderrHandle.callsMatching([]).map((call) => ContentTextStub({ value: String(call[0]) })),
  };
};
