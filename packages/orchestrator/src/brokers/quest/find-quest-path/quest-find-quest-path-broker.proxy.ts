import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { join } from '#gateway/node/path';

import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/testing';
import {
  FileContentsStub,
  fileNameContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  FileContents,
  FileName,
  FilePath,
  GuildId,
  QuestId,
} from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics, locationsStatics } from '@dungeonmaster/shared/statics';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import { matchCandidatesLayerBrokerProxy } from './match-candidates-layer-broker.proxy';
import { questFindQuestPathBroker } from './quest-find-quest-path-broker';

registerModuleMock({ module: './quest-find-quest-path-broker' });

// A `type` alias for the guild shape here is rewritten to an `interface` by lint --fix, and
// `ban-adhoc-types` then rejects the interface in a brokers/ file. Every use site below spells the
// shape out inline instead. A `probe` on a guild says what the broker's PROBE phase finds there;
// omit it and the probe is staged to miss, which sends the lookup on to the scan — the shape every
// test written against the scan already expects.

// A questId is passed to the real broker only at CALL time — never known to this proxy ahead of
// it — and the probe's last join segment is `String(questId)`. Matched by predicate rather than by
// value; the first three segments (guildsDir, this guild's dirName, the questsDir static) are
// always known and pin the address down to exactly this guild's probe join, never the scan's own
// 3-arg `questsDirPath` join for the same guild (an arg-count mismatch auto-fails that cross-match).
const isQuestIdSegment = (value: unknown): boolean => typeof value === 'string';

// The broker builds every guild's probe path before it builds any scan path (one `map` over all
// guild directories, then a `find`), but exact-tuple addressing no longer cares about that order —
// each guild's probe join is pinned to its own (guildsDir, dirName, questsDir, questId) tuple, and
// each guild's scan join to its own (guildsDir, dirName, questsDir) tuple. The two never collide:
// the probe's 4-arg call auto-fails to match the scan's 3-arg description and vice versa.
//
// STICKY, EXACT-PATH ADDRESSING (not an order-scoped queue): a later `setupQuestFound`-style call
// registering the SAME guild path wins over an earlier one — see the callers that compose this
// proxy (e.g. `followup-chat-start-responder.proxy.ts`) for why a bundled, never-queried fixture
// must always be staged BEFORE the real one it must not shadow.
const setupProbeEntries = ({
  guilds,
  guildsDir,
  joinHandle,
  existsProxy,
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
  guildsDir: FilePath;
  joinHandle: MockHandle;
  existsProxy: ReturnType<typeof existsSyncProxy>;
  layerProxy: ReturnType<typeof matchCandidatesLayerBrokerProxy>;
}): void => {
  for (const guild of guilds) {
    const probe = guild.probe ?? {
      // A path no staging claims. Addressed as absent EXPLICITLY rather than left unanswered, so a
      // sibling proxy staging its own catch-all cannot answer this call instead.
      questFolderPath: `${String(guild.questsDirPath)}/__probe_miss__` as FilePath,
      questFilePath: `${String(guild.questsDirPath)}/__probe_miss__/quest.json` as FilePath,
      exists: false,
      contents: undefined,
    };

    joinHandle
      .calledWith([
        guildsDir,
        guild.dirName,
        dungeonmasterHomeStatics.paths.questsDir,
        isQuestIdSegment,
      ])
      .returns(probe.questFolderPath);
    joinHandle
      .calledWith([probe.questFolderPath, locationsStatics.quest.questFile])
      .returns(probe.questFilePath);
    existsProxy.returns({ path: probe.questFilePath, exists: probe.exists });

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
  guildsDir,
  joinHandle,
  readdirProxy,
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
  guildsDir: FilePath;
  joinHandle: MockHandle;
  readdirProxy: ReturnType<typeof readdirEntriesSyncProxy>;
  layerProxy: ReturnType<typeof matchCandidatesLayerBrokerProxy>;
}): void => {
  for (const guild of guilds) {
    joinHandle
      .calledWith([guildsDir, guild.dirName, dungeonmasterHomeStatics.paths.questsDir])
      .returns(guild.questsDirPath);

    readdirProxy.returns({
      path: guild.questsDirPath,
      entries: guild.questFolders.map(({ folderName }) => ({
        name: folderName,
        kind: 'directory' as const,
      })),
    });

    for (const questFolder of guild.questFolders) {
      joinHandle
        .calledWith([guild.questsDirPath, questFolder.folderName, locationsStatics.quest.questFile])
        .returns(questFolder.questFilePath);
      joinHandle
        .calledWith([guild.questsDirPath, questFolder.folderName])
        .returns(questFolder.questFolderPath);

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
  setupGuildsDirMissing: (params: {
    homeDir: string;
    homePath: FilePath;
    guildsDir: FilePath;
  }) => void;
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
  // Caller-level scenarios: address by questId alone, and let the REAL broker (probe → scan →
  // matchCandidatesLayerBroker) settle the answer through the SAME staged dependencies
  // setupQuestFound composes above. A caller reaching this broker through the bare
  // `@dungeonmaster/orchestrator` barrel gets the identical answer — see the barrel-export mock
  // wired below, right where this file's own real, relatively-imported broker is wired too.
  setupQuestPath: (params: {
    questId: QuestId;
    guildId: GuildId;
    questPath: AbsoluteFilePath;
    // A real process has one home. Omit this to get a per-questId fixture home this scenario
    // invents for itself; pass the SAME homeDir a sibling proxy composed in the same test staged
    // (e.g. pastedImagePersistBrokerProxy.setupHome's own homePath) when that sibling's real
    // resolution also has to run through this one process's homedir().
    homeDir?: string;
  }) => void;
  setupQuestPathError: (params: { questId: QuestId; homeDir?: string }) => void;
  // Answers one questId outright, without running the real lookup or staging any fs — for a caller
  // whose test shares `join` and `homedir` mocks with other real code that setupQuestPath's staging
  // would corrupt. Any other questId runs the real broker.
  setupResolves: (params: {
    questId: QuestId;
    questPath: AbsoluteFilePath;
    guildId: GuildId;
  }) => void;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const joinHandle: MockHandle = registerMock({ fn: join });
  const existsProxy = existsSyncProxy();
  const readdirProxy = readdirEntriesSyncProxy();
  // The quest FILE reads happen inside matchCandidatesLayerBroker, so its proxy — not a raw
  // read-file mock — is what stages their contents. Both phases read through it.
  const layerProxy = matchCandidatesLayerBrokerProxy();
  const realMod = requireActual<{ questFindQuestPathBroker: typeof questFindQuestPathBroker }>({
    module: './quest-find-quest-path-broker',
  });
  // Real-broker default at `[]`. A proxy that stages its own `[]` answer for this function must
  // compose this one BEFORE staging: the later `[]` registration at the same address wins.
  const findMock = registerMock({ fn: questFindQuestPathBroker });
  findMock.calledWith([]).implement(realMod.questFindQuestPathBroker as never);

  const stageGuildsDir = ({
    homePath,
    guildsDir,
  }: {
    homePath: FilePath;
    guildsDir: FilePath;
  }): void => {
    joinHandle.calledWith([homePath, dungeonmasterHomeStatics.paths.guildsDir]).returns(guildsDir);
  };

  const stageGuildsList = ({
    guildsDir,
    guilds,
  }: {
    guildsDir: FilePath;
    guilds: readonly { dirName: FileName }[];
  }): void => {
    readdirProxy.returns({
      path: guildsDir,
      entries: guilds.map(({ dirName }) => ({ name: dirName, kind: 'directory' as const })),
    });
  };

  return {
    setupResolves: ({
      questId,
      questPath,
      guildId,
    }: {
      questId: QuestId;
      questPath: AbsoluteFilePath;
      guildId: GuildId;
    }): void => {
      findMock.calledWith([{ questId }]).resolves({ questPath, guildId });
    },

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
      stageGuildsDir({ homePath, guildsDir });
      stageGuildsList({ guildsDir, guilds });
      if (stageProbe) {
        setupProbeEntries({ guilds, guildsDir, joinHandle, existsProxy, layerProxy });
      }
      setupScanEntries({ guilds, guildsDir, joinHandle, readdirProxy, layerProxy });
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
      stageGuildsDir({ homePath, guildsDir });
      readdirProxy.returns({ path: guildsDir, entries: [] });
    },

    setupGuildsDirMissing: ({
      homeDir,
      homePath,
      guildsDir,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildsDir: FilePath;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      stageGuildsDir({ homePath, guildsDir });
      readdirProxy.throws({
        path: guildsDir,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
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
      stageGuildsDir({ homePath, guildsDir });
      stageGuildsList({ guildsDir, guilds });
      if (stageProbe) {
        setupProbeEntries({ guilds, guildsDir, joinHandle, existsProxy, layerProxy });
      }
      setupScanEntries({ guilds, guildsDir, joinHandle, readdirProxy, layerProxy });
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
      stageGuildsDir({ homePath, guildsDir });
      stageGuildsList({ guildsDir, guilds: [{ dirName: guildDirName }] });

      setupProbeEntries({
        guilds: [{ dirName: guildDirName, questsDirPath, questFolders: [] }],
        guildsDir,
        joinHandle,
        existsProxy,
        layerProxy,
      });

      joinHandle
        .calledWith([guildsDir, guildDirName, dungeonmasterHomeStatics.paths.questsDir])
        .returns(questsDirPath);
      readdirProxy.throws({
        path: questsDirPath,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },

    // Addressed by questId alone — a single guild, named by guildId, whose canonical PROBE path
    // (questsDir/<questId>) already holds a quest.json recording that same id. The probe answers
    // before the scan ever runs (see the broker's own header, "TWO PHASES, ONE ANSWER"), so
    // `questFolders` stays empty. Every internal home/guilds path is a fixture this scenario
    // invents for itself — a caller only cares about the {questId, guildId} -> {questPath} answer,
    // never the fs layout that produced it.
    setupQuestPath: ({
      questId,
      guildId,
      questPath,
      homeDir: givenHomeDir,
    }: {
      questId: QuestId;
      guildId: GuildId;
      questPath: AbsoluteFilePath;
      homeDir?: string;
    }): void => {
      const homeDir = givenHomeDir ?? `/quest-find-quest-path-broker-proxy/${String(questId)}`;
      const homePath = filePathContract.parse(`${homeDir}/.dungeonmaster`);
      const guildsDir = filePathContract.parse(`${homePath}/guilds`);
      const questFilePath = filePathContract.parse(
        `${String(questPath)}/${locationsStatics.quest.questFile}`,
      );
      const guilds = [
        {
          dirName: fileNameContract.parse(String(guildId)),
          questsDirPath: filePathContract.parse(`${guildsDir}/${String(guildId)}/quests`),
          probe: {
            questFolderPath: filePathContract.parse(String(questPath)),
            questFilePath,
            exists: true,
            // matchCandidatesLayerBroker checks `id` alone (questContract.pick({ id: true })), so
            // a minimal object carries everything the real broker's match needs.
            contents: FileContentsStub({ value: JSON.stringify({ id: String(questId) }) }),
          },
          questFolders: [],
        },
      ];

      homeFindProxy.setupHomePath({ homeDir, homePath });
      stageGuildsDir({ homePath, guildsDir });
      stageGuildsList({ guildsDir, guilds });
      setupProbeEntries({ guilds, guildsDir, joinHandle, existsProxy, layerProxy });
      // No setupScanEntries here, unlike setupQuestFound: the probe above is staged to ALWAYS hit
      // (`exists: true`), so the real broker returns before its own scan phase ever runs.
    },

    // No guilds at all — both the probe and the scan come up empty, so the REAL broker throws its
    // own QuestNotFoundError(questId) (packages/orchestrator/src/errors/quest-not-found/quest-not-found-error.ts)
    // rather than this proxy ever handing a caller-invented Error.
    setupQuestPathError: ({
      questId,
      homeDir: givenHomeDir,
    }: {
      questId: QuestId;
      homeDir?: string;
    }): void => {
      const homeDir = givenHomeDir ?? `/quest-find-quest-path-broker-proxy/${String(questId)}`;
      const homePath = filePathContract.parse(`${homeDir}/.dungeonmaster`);
      const guildsDir = filePathContract.parse(`${homePath}/guilds`);

      homeFindProxy.setupHomePath({ homeDir, homePath });
      stageGuildsDir({ homePath, guildsDir });
      readdirProxy.returns({ path: guildsDir, entries: [] });
    },
  };
};
