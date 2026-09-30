/**
 * PURPOSE: A `DmTarget` pointing at a real temporary directory on disk — the "files only" tier of
 * `scrolls/seigelense/siegelense-recipes.md`'s three test costs, for a colocated recipe or
 * ingredient integration test that needs no server. Reach for this over building a target inline:
 * `installTestbedCreateBroker`'s own temp-dir property is `testbed.guildPath`, confirmed by
 * reading `install-testbed-contract.ts` directly — the repo-root CLAUDE.md names `projectPath`,
 * which does not exist.
 *
 * Also sets `process.env.DUNGEONMASTER_HOME` to the same directory for the test's duration, and
 * seeds an empty `config.json` there — a finding, not a convenience. `target.home` alone is NOT
 * enough: `operationWriteRouteBroker` calls `questGetBroker`, which takes no `target` parameter
 * (confirmed by reading it directly) and resolves the GLOBAL env var, so without it a quest
 * written correctly under `target.home` is one a later `operationWriteRouteBroker` call cannot
 * find. `guildWriteRouteBroker` is the route this no longer covers: it hands `guildAddBroker` an
 * explicit `home: target.home` and needs no env var at all. Without the seeded `config.json`,
 * `guildConfigReadBroker`'s ENOENT fallback never fires under jest — it tests
 * `cause instanceof Error`, and the cause is an `fs/promises` error from outside the sandbox
 * realm — so `guildAddBroker` fails outright on the very first guild. This mirrors
 * `packages/orchestrator/test/harnesses/orchestration-environment/orchestration-environment.harness.ts`'s
 * own `setupHome`, which this package cannot import (it lives under another package's `test/`, not
 * its public surface).
 *
 * Created once at `describe` scope, like every other harness in this repo — the lint rule
 * enforcing that is what a per-test `fileTargetHarness()` call trips. `beforeEach`/`afterEach` are
 * properties the AST transformer wires into real jest hooks; `target()` is only valid to call
 * between the two.
 *
 * `readQuestFileOperations` reads a quest.json straight off disk and returns its ledger array —
 * reach for it wherever a plan's `saveRecordAs` cannot prove the claim. `saveRecordAs` freezes a
 * row's record at CREATE time (`op-create-apply-layer-broker.ts:112` —
 * `state.records.set(op.ref, parsedRecord.data)`, never updated again), so a quest row saved
 * before a sibling `operation` create appends onto the SAME on-disk quest file reads back its
 * ORIGINAL `operations: []`, not the ledger that exists by the time the plan finishes. Reading
 * the real file is what proves the ledger landed.
 *
 * `questFolderExists` answers whether a quest's directory is still on disk, via `testbed.listDir`
 * (which returns `null` for a path that doesn't exist rather than throwing) — reach for it to
 * prove a refused delete left a quest's directory untouched, since a thrown error alone never
 * observed the filesystem.
 *
 * `readQuestByTitle` walks every guild directory's quest folders and parses each `quest.json`,
 * returning the first whose `title` matches. Reach for it when a plan run REJECTS partway through
 * (a real gate refusing a later hop) and the rejection loses every `saveRecordAs` result the run
 * would otherwise have returned — the quest rows a plan already created and wrote before the
 * refusing op are still real files on disk, and this is how a test reads their actual last-landed
 * state rather than asserting nothing about them at all.
 *
 * `denyWrites` chmods the target's own root to `0o500` (read/execute, no write), so a route's own
 * `mkdir`/`writeFile` underneath it fails with a real `EACCES` — the same mechanism
 * `plan-run-broker.integration.test.ts` uses one package over. `allowWrites` restores `0o700` before
 * `afterEach`'s own cleanup, which needs write access on this same directory to remove it.
 *
 * USAGE:
 * describe('...', () => {
 *   const fileTarget = fileTargetHarness();
 *   it('VALID: {} => writes a guild', async () => {
 *     const record = await guildWriteRouteBroker({ target: fileTarget.target(), fields: {...} });
 *   });
 * });
 */
import { chmodSync, readFileSync, writeFileSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import { deleteEnv, getEnv, setEnv } from '#gateway/node/process';

import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import type { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';

import type { DmTarget } from '../../../src/contracts/dm-target/dm-target-contract';
import { DmTargetStub } from '../../../src/contracts/dm-target/dm-target.stub';

type GuildId = ReturnType<typeof GuildStub>['id'];
type Quest = ReturnType<typeof QuestStub>;
type QuestFolder = Quest['folder'];
type QuestOperations = Quest['operations'];
type QuestTitle = Quest['title'];

const DUNGEONMASTER_HOME_ENV_VAR = 'DUNGEONMASTER_HOME';
const EMPTY_GUILD_CONFIG = { guilds: [] };

export const fileTargetHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  target: () => DmTarget;
  readQuestFileOperations: (params: {
    guildId: GuildId;
    questFolder: QuestFolder;
  }) => QuestOperations;
  readQuestByTitle: (params: { title: QuestTitle }) => Quest;
  questFolderExists: (params: { guildId: GuildId; questFolder: QuestFolder }) => boolean;
  readAbsoluteFileLines: (params: { filePath: string }) => readonly string[];
  denyWrites: () => void;
  allowWrites: () => void;
} => {
  let testbed: ReturnType<typeof installTestbedCreateBroker> | undefined;
  let savedDungeonmasterHome: ReturnType<typeof getEnv>;

  return {
    beforeEach: (): void => {
      testbed = installTestbedCreateBroker({
        baseName: 'recipes-file-target',
      });
      savedDungeonmasterHome = getEnv(DUNGEONMASTER_HOME_ENV_VAR);
      setEnv(DUNGEONMASTER_HOME_ENV_VAR, testbed.guildPath);
      writeFileSync(
        join(testbed.guildPath, dungeonmasterHomeStatics.paths.configFile),
        JSON.stringify(EMPTY_GUILD_CONFIG),
      );
    },
    afterEach: (): void => {
      testbed?.cleanup();
      testbed = undefined;
      if (savedDungeonmasterHome === undefined) {
        deleteEnv(DUNGEONMASTER_HOME_ENV_VAR);
      } else {
        setEnv(DUNGEONMASTER_HOME_ENV_VAR, savedDungeonmasterHome);
      }
    },
    target: (): DmTarget => {
      if (testbed === undefined) {
        throw new Error('fileTargetHarness: target() called outside beforeEach/afterEach');
      }
      const home = testbed.guildPath;
      return DmTargetStub({ home, claudeHome: home });
    },
    readQuestFileOperations: ({
      guildId,
      questFolder,
    }: {
      guildId: GuildId;
      questFolder: QuestFolder;
    }): QuestOperations => {
      if (testbed === undefined) {
        throw new Error(
          'fileTargetHarness: readQuestFileOperations() called outside beforeEach/afterEach',
        );
      }
      const relativePath = [
          dungeonmasterHomeStatics.paths.guildsDir,
          guildId,
          dungeonmasterHomeStatics.paths.questsDir,
          questFolder,
          dungeonmasterHomeStatics.paths.questFile,
        ].join('/');
      const contents = testbed.readFile({ relativePath });
      const parsedJson = JSON.parse(String(contents)) as StubArgument<ReturnType<typeof QuestStub>>;
      const parsed = QuestStub(parsedJson);
      return parsed.operations;
    },
    readQuestByTitle: ({ title }: { title: QuestTitle }): Quest => {
      if (testbed === undefined) {
        throw new Error(
          'fileTargetHarness: readQuestByTitle() called outside beforeEach/afterEach',
        );
      }
      const guildIds =
        testbed.listDir({
          relativePath: dungeonmasterHomeStatics.paths.guildsDir,
        }) ?? [];
      for (const guildId of guildIds) {
        const questFolders =
          testbed.listDir({
            relativePath: [
                dungeonmasterHomeStatics.paths.guildsDir,
                guildId,
                dungeonmasterHomeStatics.paths.questsDir,
              ].join('/'),
          }) ?? [];
        for (const questFolder of questFolders) {
          const relativePath = [
              dungeonmasterHomeStatics.paths.guildsDir,
              guildId,
              dungeonmasterHomeStatics.paths.questsDir,
              questFolder,
              dungeonmasterHomeStatics.paths.questFile,
            ].join('/');
          const contents = testbed.readFile({ relativePath });
          if (contents === null) {
            continue;
          }
          const parsedJson = JSON.parse(String(contents)) as StubArgument<
            ReturnType<typeof QuestStub>
          >;
          const parsed = QuestStub(parsedJson);
          if (parsed.title === title) {
            return parsed;
          }
        }
      }
      throw new Error(`fileTargetHarness: no quest found with title "${String(title)}"`);
    },
    questFolderExists: ({
      guildId,
      questFolder,
    }: {
      guildId: GuildId;
      questFolder: QuestFolder;
    }): boolean => {
      if (testbed === undefined) {
        throw new Error(
          'fileTargetHarness: questFolderExists() called outside beforeEach/afterEach',
        );
      }
      const relativePath = [
          dungeonmasterHomeStatics.paths.guildsDir,
          guildId,
          dungeonmasterHomeStatics.paths.questsDir,
          questFolder,
        ].join('/');
      return testbed.listDir({ relativePath }) !== null;
    },
    readAbsoluteFileLines: ({
      filePath,
    }: {
      filePath: string;
    }): readonly string[] => {
      if (testbed === undefined) {
        throw new Error(
          'fileTargetHarness: readAbsoluteFileLines() called outside beforeEach/afterEach',
        );
      }
      return readFileSync(filePath)
        .split('\n')
        .filter((line) => line.length > 0)
        .map((line) => line);
    },
    denyWrites: (): void => {
      if (testbed === undefined) {
        throw new Error('fileTargetHarness: denyWrites() called outside beforeEach/afterEach');
      }
      chmodSync(testbed.guildPath, 0o500);
    },
    allowWrites: (): void => {
      if (testbed === undefined) {
        throw new Error('fileTargetHarness: allowWrites() called outside beforeEach/afterEach');
      }
      chmodSync(testbed.guildPath, 0o700);
    },
  };
};
