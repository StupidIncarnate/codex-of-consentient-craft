import { readdirSync, Dirent } from 'fs';

import {
  dungeonmasterHomeFindBrokerProxy,
  fsExistsSyncAdapterProxy,
  fsReaddirWithTypesAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FileContents, FileName, FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import { matchCandidatesLayerBrokerProxy } from './match-candidates-layer-broker.proxy';

// The guild shape below is written out at each use site rather than named once: a `type` alias here
// is rewritten to an `interface` by lint --fix, and `ban-adhoc-types` then rejects the interface in
// a brokers/ file. A `probe` on a guild says what the broker's PROBE phase finds there; omit it and
// the probe is staged to miss, which sends the lookup on to the scan — the shape every test written
// against the scan already expects.

const createMockDirent = ({
  name,
  parentPath,
}: {
  name: FileName;
  parentPath: FilePath;
}): Dirent => {
  const dirent = Object.assign(Object.create(Dirent.prototype) as Dirent, {
    name,
    parentPath,
    isDirectory: jest.fn().mockReturnValue(true),
  });
  return dirent;
};

// The broker builds EVERY guild's probe path before it builds any scan path, because the probe is
// one `map` over all guild directories followed by a `find`. pathJoin staging is a call-ordered
// queue, so this pass must run over all guilds before setupScanEntries runs over any of them —
// interleaving the two hands the scan a probe path and every dependent test fails at once.
const setupProbeEntries = ({
  guilds,
  pathJoinProxy,
  existsSyncProxy,
  layerProxy,
}: {
  guilds: {
    dirName: FileName;
    questsDirPath: FilePath;
    probe?: {
      questFolderPath: FilePath;
      questFilePath: FilePath;
      exists: boolean;
      contents?: FileContents;
    };
    questFolders: {
      folderName: FileName;
      questFilePath: FilePath;
      questFolderPath: FilePath;
      contents: FileContents;
    }[];
  }[];
  pathJoinProxy: ReturnType<typeof pathJoinAdapterProxy>;
  existsSyncProxy: ReturnType<typeof fsExistsSyncAdapterProxy>;
  layerProxy: ReturnType<typeof matchCandidatesLayerBrokerProxy>;
}): void => {
  for (const guild of guilds) {
    const probe = guild.probe ?? {
      // A path no staging claims. Addressed as absent EXPLICITLY rather than left to the exists
      // proxy's zero-argument default, so a sibling proxy staging its own catch-all cannot answer
      // this call instead.
      questFolderPath: `${String(guild.questsDirPath)}/__probe_miss__` as FilePath,
      questFilePath: `${String(guild.questsDirPath)}/__probe_miss__/quest.json` as FilePath,
      exists: false,
      contents: undefined,
    };

    pathJoinProxy.returns({ result: probe.questFolderPath });
    pathJoinProxy.returns({ result: probe.questFilePath });
    existsSyncProxy.returns({ filePath: probe.questFilePath, result: probe.exists });

    if (probe.contents !== undefined) {
      layerProxy.setupCandidateFileOnce({
        questFilePath: probe.questFilePath,
        contents: probe.contents,
      });
    }
  }
};

const setupScanEntries = ({
  guilds,
  readdirReturns,
  pathJoinProxy,
  layerProxy,
}: {
  guilds: {
    dirName: FileName;
    questsDirPath: FilePath;
    questFolders: {
      folderName: FileName;
      questFilePath: FilePath;
      questFolderPath: FilePath;
      contents: FileContents;
    }[];
  }[];
  readdirReturns: (params: { dirPath: FilePath; entries: Dirent[] }) => void;
  pathJoinProxy: ReturnType<typeof pathJoinAdapterProxy>;
  layerProxy: ReturnType<typeof matchCandidatesLayerBrokerProxy>;
}): void => {
  for (const guild of guilds) {
    pathJoinProxy.returns({ result: guild.questsDirPath });

    const questFolderDirents = guild.questFolders.map(({ folderName }) =>
      createMockDirent({ name: folderName, parentPath: guild.questsDirPath }),
    );
    readdirReturns({ dirPath: guild.questsDirPath, entries: questFolderDirents });

    for (const questFolder of guild.questFolders) {
      pathJoinProxy.returns({ result: questFolder.questFilePath });
      pathJoinProxy.returns({ result: questFolder.questFolderPath });
      // Two reads land on this exact path per "get quest" cycle: the scan's own candidate-match
      // check, then the caller's separate questLoadBroker read of the same file. Staging two
      // addressed one-shots (instead of a sticky one) means a SECOND setupQuestFound call for this
      // same path (a later generation of the same quest file) queues its own pair after this one,
      // rather than shadowing it for reads that haven't happened yet.
      layerProxy.setupCandidateFileOnce({
        questFilePath: questFolder.questFilePath,
        contents: questFolder.contents,
      });
      layerProxy.setupCandidateFileOnce({
        questFilePath: questFolder.questFilePath,
        contents: questFolder.contents,
      });
    }
  }
};

export const questFindQuestPathBrokerProxy = (): {
  setupQuestFound: (params: {
    homeDir: string;
    homePath: FilePath;
    guildsDir: FilePath;
    stageProbe?: boolean;
    guilds: {
      dirName: FileName;
      questsDirPath: FilePath;
      probe?: {
        questFolderPath: FilePath;
        questFilePath: FilePath;
        exists: boolean;
        contents?: FileContents;
      };
      questFolders: {
        folderName: FileName;
        questFilePath: FilePath;
        questFolderPath: FilePath;
        contents: FileContents;
      }[];
    }[];
  }) => void;
  setupNoGuilds: (params: { homeDir: string; homePath: FilePath; guildsDir: FilePath }) => void;
  setupQuestNotFound: (params: {
    homeDir: string;
    homePath: FilePath;
    guildsDir: FilePath;
    stageProbe?: boolean;
    guilds: {
      dirName: FileName;
      questsDirPath: FilePath;
      probe?: {
        questFolderPath: FilePath;
        questFilePath: FilePath;
        exists: boolean;
        contents?: FileContents;
      };
      questFolders: {
        folderName: FileName;
        questFilePath: FilePath;
        questFolderPath: FilePath;
        contents: FileContents;
      }[];
    }[];
  }) => void;
  setupQuestsReadError: (params: {
    homeDir: string;
    homePath: FilePath;
    guildsDir: FilePath;
    guildDirName: FileName;
    questsDirPath: FilePath;
  }) => void;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation and to keep its zero-arg catch-all
  // (`calledWith([]).returns([])`) as the fallback for any dirPath this proxy never
  // addresses below. All the staging this proxy actually cares about goes through
  // readdirHandle directly (see the comment above it) — never through this proxy's own
  // `.returns()`/`.throws()`, which cannot describe the second `{ withFileTypes: true }`
  // argument that discriminates this broker's call from fsReaddirAdapterProxy's.
  fsReaddirWithTypesAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const existsSyncProxy = fsExistsSyncAdapterProxy();
  // The quest FILE reads happen inside matchCandidatesLayerBroker, so its proxy — not
  // fsReadFileAdapterProxy — is what stages their contents. Both phases read through it.
  const layerProxy = matchCandidatesLayerBrokerProxy();

  // readdirSync is a SHARED npm function — fsReaddirAdapterProxy (orchestrator's own
  // plain-filename listing, used by questListBroker) also mocks it, addressed by [dirPath]
  // alone. Prefix matching lets a 1-arg description answer ANY call whose first argument is
  // that dirPath, no matter how many more real arguments follow — so without a second-
  // argument address here, two proxies staging the SAME dirPath (e.g. this broker's own
  // guild-scoped questsDirPath colliding with a caller's default-stub guildId used
  // elsewhere) let whichever staged MOST RECENTLY answer BOTH shapes, corrupting the other.
  // questFindQuestPathBroker always calls this as readdirSync(dirPath, { withFileTypes: true })
  // — describing that second argument makes this staging (2 matched args) strictly more
  // specific than fsReaddirAdapterProxy's 1-arg staging for a with-types call, AND makes it
  // structurally unable to match a plain 1-arg call (an arg-count mismatch is an automatic
  // non-match) — each proxy answers only its own call, independent of registration order.
  const readdirHandle: MockHandle = registerMock({ fn: readdirSync });
  const readdirReturns = ({ dirPath, entries }: { dirPath: FilePath; entries: Dirent[] }): void => {
    readdirHandle.calledWith([dirPath, { withFileTypes: true }]).returns(entries as never);
  };
  const readdirThrows = ({ dirPath, error }: { dirPath: FilePath; error: Error }): void => {
    readdirHandle.calledWith([dirPath, { withFileTypes: true }]).throws(error);
  };

  return {
    setupQuestFound: ({
      homeDir,
      homePath,
      guildsDir,
      guilds,
      stageProbe = true,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildsDir: FilePath;
      stageProbe?: boolean;
      guilds: {
        dirName: FileName;
        questsDirPath: FilePath;
        probe?: {
          questFolderPath: FilePath;
          questFilePath: FilePath;
          exists: boolean;
          contents?: FileContents;
        };
        questFolders: {
          folderName: FileName;
          questFilePath: FilePath;
          questFolderPath: FilePath;
          contents: FileContents;
        }[];
      }[];
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: guildsDir });
      readdirReturns({
        dirPath: guildsDir,
        entries: guilds.map(({ dirName }) =>
          createMockDirent({ name: dirName, parentPath: guildsDir }),
        ),
      });
      if (stageProbe) {
        setupProbeEntries({ guilds, pathJoinProxy, existsSyncProxy, layerProxy });
      }
      setupScanEntries({ guilds, readdirReturns, pathJoinProxy, layerProxy });
    },

    setupNoGuilds: ({
      homeDir,
      homePath,
      guildsDir,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildsDir: FilePath;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: guildsDir });
      readdirReturns({ dirPath: guildsDir, entries: [] });
    },

    setupQuestNotFound: ({
      homeDir,
      homePath,
      guildsDir,
      guilds,
      stageProbe = true,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildsDir: FilePath;
      stageProbe?: boolean;
      guilds: {
        dirName: FileName;
        questsDirPath: FilePath;
        probe?: {
          questFolderPath: FilePath;
          questFilePath: FilePath;
          exists: boolean;
          contents?: FileContents;
        };
        questFolders: {
          folderName: FileName;
          questFilePath: FilePath;
          questFolderPath: FilePath;
          contents: FileContents;
        }[];
      }[];
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: guildsDir });
      readdirReturns({
        dirPath: guildsDir,
        entries: guilds.map(({ dirName }) =>
          createMockDirent({ name: dirName, parentPath: guildsDir }),
        ),
      });
      if (stageProbe) {
        setupProbeEntries({ guilds, pathJoinProxy, existsSyncProxy, layerProxy });
      }
      setupScanEntries({ guilds, readdirReturns, pathJoinProxy, layerProxy });
    },

    setupQuestsReadError: ({
      homeDir,
      homePath,
      guildsDir,
      guildDirName,
      questsDirPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildsDir: FilePath;
      guildDirName: FileName;
      questsDirPath: FilePath;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: guildsDir });

      const guildDirents = [createMockDirent({ name: guildDirName, parentPath: guildsDir })];
      readdirReturns({ dirPath: guildsDir, entries: guildDirents });

      setupProbeEntries({
        guilds: [{ dirName: guildDirName, questsDirPath, questFolders: [] }],
        pathJoinProxy,
        existsSyncProxy,
        layerProxy,
      });

      // The real broker joins guildsDir + guildDirName + questsDir into a SECOND, DISTINCT
      // directory before reading it — reusing guildsDir here would collide the two readdir
      // stagings on the same dirPath key and the guild-listing call above would throw too.
      pathJoinProxy.returns({ result: questsDirPath });
      readdirThrows({
        dirPath: questsDirPath,
        error: new Error('ENOENT: no such file or directory'),
      });
    },
  };
};
