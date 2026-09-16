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
 * enough: `guildWriteRouteBroker` calls `StartOrchestrator.addGuild`, whose `guildAddBroker`
 * resolves its home via `dungeonmasterHomeEnsureBroker()` (no `target` parameter, confirmed by
 * reading it directly), and `operationWriteRouteBroker` calls `StartOrchestrator.getQuest`, which
 * resolves the SAME way — both read the GLOBAL env var, never the `target` object a route was
 * handed. Measured directly: without the env var, a guild registers into whatever
 * `~/.dungeonmaster` the process defaults to while the quest and guild FILES this package's own
 * routes write land correctly under `target.home`, so a later `operationWriteRouteBroker` call
 * cannot find the quest it needs. Without the seeded `config.json`,
 * `guildConfigReadBroker`'s ENOENT fallback never fires — the orchestrator's own
 * `fsReadFileAdapter` throws a differently-shaped error first — so `guildAddBroker` fails outright
 * on the very first guild. This mirrors
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
 * USAGE:
 * describe('...', () => {
 *   const fileTarget = fileTargetHarness();
 *   it('VALID: {} => writes a guild', async () => {
 *     const record = await guildWriteRouteBroker({ target: fileTarget.target(), fields: {...} });
 *   });
 * });
 */
import * as fs from 'fs';
import * as path from 'path';

import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import type { GuildStub } from '@dungeonmaster/shared/contracts';
import { absoluteFilePathContract, QuestStub } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';

import type { DmTarget } from '../../../src/contracts/dm-target/dm-target-contract';

type GuildId = ReturnType<typeof GuildStub>['id'];
type QuestFolder = ReturnType<typeof QuestStub>['folder'];
type QuestOperations = ReturnType<typeof QuestStub>['operations'];

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
} => {
  let testbed: ReturnType<typeof installTestbedCreateBroker> | undefined;
  let savedDungeonmasterHome: typeof process.env.DUNGEONMASTER_HOME;

  return {
    beforeEach: (): void => {
      testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'recipes-file-target' }),
      });
      savedDungeonmasterHome = process.env[DUNGEONMASTER_HOME_ENV_VAR];
      process.env[DUNGEONMASTER_HOME_ENV_VAR] = testbed.guildPath;
      fs.writeFileSync(
        path.join(testbed.guildPath, dungeonmasterHomeStatics.paths.configFile),
        JSON.stringify(EMPTY_GUILD_CONFIG),
      );
    },
    afterEach: (): void => {
      testbed?.cleanup();
      testbed = undefined;
      if (savedDungeonmasterHome === undefined) {
        Reflect.deleteProperty(process.env, DUNGEONMASTER_HOME_ENV_VAR);
      } else {
        process.env[DUNGEONMASTER_HOME_ENV_VAR] = savedDungeonmasterHome;
      }
    },
    target: (): DmTarget => {
      if (testbed === undefined) {
        throw new Error('fileTargetHarness: target() called outside beforeEach/afterEach');
      }
      const home = absoluteFilePathContract.parse(testbed.guildPath);
      return { home, claudeHome: home };
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
      const relativePath = RelativePathStub({
        value: [
          dungeonmasterHomeStatics.paths.guildsDir,
          guildId,
          dungeonmasterHomeStatics.paths.questsDir,
          questFolder,
          dungeonmasterHomeStatics.paths.questFile,
        ].join('/'),
      });
      const contents = testbed.readFile({ relativePath });
      const parsedJson = JSON.parse(String(contents)) as StubArgument<ReturnType<typeof QuestStub>>;
      const parsed = QuestStub(parsedJson);
      return parsed.operations;
    },
  };
};
