/**
 * PURPOSE: A `DmTarget` whose `request` dispatches straight to REAL broker logic in-process — no
 * socket, but no shortcuts either. Guild creation calls the REAL, exported `guildAddBroker`; quest
 * creation calls THIS package's own `questWriteRouteBroker` (which writes a full quest record to
 * REAL disk, exactly as `questPersistBroker` would — `questUserAddBroker` itself is not on
 * `@dungeonmaster/orchestrator/brokers`' exported surface, confirmed by reading `brokers.ts`
 * directly); the reload calls the REAL, exported `questGetBroker`. Reach for this over
 * `instanceStubHarness` whenever a test needs `questModifyBroker`'s REAL gate checks to run against
 * a REAL quest file the create step actually wrote — `instanceStubHarness` only echoes a canned
 * quest and never persists one, so `questReachRouteBroker`'s in-process hops find nothing to modify
 * (`recipes-seed-run-broker.integration.test.ts`'s own "needs a live orchestrator HTTP server"
 * comment names exactly this gap, which is what this harness closes for the two creates).
 *
 * `POST /api/quests/:id/start` is NOT dispatched by default — `orchestration-start-responder`'s own
 * logic is not exported from `@dungeonmaster/orchestrator`'s barrel (confirmed by
 * `quest-reach-route-broker.ts`'s own header), so a test driving a recipe all the way to
 * `in_progress` observes the SAME named refusal `guild-with-three-quests`'s own integration test
 * already documents for a write-only target ("a write-only target cannot walk a quest to
 * in_progress") — proving every hop BEFORE it landed for real, including the `flows_approved`/
 * `approved` gates DEF-71 is about. A test that needs to drive a plan PAST `in_progress` — to reach
 * ops the real recipe declares AFTER its quest creates, such as a session/subagent this same guild
 * holds — opts in with `simulateStartRoute: true`, which answers that ONE hop with a plain
 * `questModifyBroker({status: 'in_progress'})` flip instead of throwing. That is NOT the real
 * responder: it seeds no operations relay, so it is honest only for a test whose claim is about
 * something OTHER than the ledger `in_progress` itself would seed — the four DEF-71 gate tests never
 * pass this flag, and still observe the real, named refusal at that hop.
 *
 * Sets and restores `process.env.DUNGEONMASTER_HOME`, and seeds an empty `config.json`, exactly as
 * `fileTargetHarness` does and for the identical reason: `guildAddBroker`'s config read has no
 * ENOENT fallback under jest, and `questModifyBroker`/`questGetBroker` both resolve the quest file
 * off that GLOBAL env var, never off `target.home` (`packages/hydration-recipes/CLAUDE.md`'s own
 * finding).
 *
 * USAGE:
 * describe('...', () => {
 *   const liveTarget = liveQuestTargetHarness();
 *   it('VALID: {} => walks the real gates', async () => {
 *     const result = await dmRegistryBroker.run(someRecipe(), liveTarget.target());
 *   });
 * });
 */
import * as fs from 'fs';
import * as path from 'path';

import {
  guildAddBroker,
  questGetBroker,
  questModifyBroker,
} from '@dungeonmaster/orchestrator/brokers';
import {
  absoluteFilePathContract,
  getQuestInputContract,
  guildNameContract,
  guildPathContract,
  modifyQuestInputContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { questWriteRouteBroker } from '../../../src/brokers/quest/write-route/quest-write-route-broker';
import { DmTargetStub } from '../../../src/contracts/dm-target/dm-target.stub';

type DmTarget = ReturnType<typeof DmTargetStub>;

const DUNGEONMASTER_HOME_ENV_VAR = 'DUNGEONMASTER_HOME';
const IN_PROCESS_BASE_URL = 'http://live-quest-target.test';
const GUILDS_PATH = '/api/guilds';
const QUESTS_PATH = '/api/quests';
const EMPTY_GUILD_CONFIG = { guilds: [] };
const CREATED_STATUS = 'created';
const IN_PROGRESS_STATUS = 'in_progress';
const START_PATH_SUFFIX = '/start';

export const liveQuestTargetHarness = ({
  simulateStartRoute = false,
}: { simulateStartRoute?: boolean } = {}): {
  beforeEach: () => void;
  afterEach: () => void;
  target: () => DmTarget;
} => {
  let testbed: ReturnType<typeof installTestbedCreateBroker> | undefined;
  let savedDungeonmasterHome: typeof process.env.DUNGEONMASTER_HOME;

  return {
    beforeEach: (): void => {
      testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'live-quest-target' }),
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
        throw new Error('liveQuestTargetHarness: target() called outside beforeEach/afterEach');
      }
      const home = absoluteFilePathContract.parse(testbed.guildPath);
      const innerTarget = DmTargetStub({ home, claudeHome: home });

      return DmTargetStub({
        home,
        claudeHome: home,
        baseUrl: IN_PROCESS_BASE_URL,
        request: async ({ method, path: requestPath, body }) => {
          if (method === 'POST' && requestPath === GUILDS_PATH) {
            const fields = body as Record<PropertyKey, unknown>;
            const guild = await guildAddBroker({
              name: guildNameContract.parse(fields.name),
              path: guildPathContract.parse(fields.path),
            });
            return { status: 201, body: guild };
          }

          if (method === 'POST' && requestPath === QUESTS_PATH) {
            const fields = body as Record<PropertyKey, unknown>;
            const quest = await questWriteRouteBroker({
              target: innerTarget,
              fields: {
                guildId: fields.guildId,
                title: fields.title,
                userRequest: fields.userRequest,
                status: CREATED_STATUS,
              },
            });
            const filePath = [
              home,
              dungeonmasterHomeStatics.paths.guildsDir,
              String(fields.guildId),
              dungeonmasterHomeStatics.paths.questsDir,
              quest.folder,
              dungeonmasterHomeStatics.paths.questFile,
            ].join('/');
            return {
              status: 201,
              body: {
                success: true,
                questId: quest.id,
                questFolder: quest.folder,
                filePath,
              },
            };
          }

          if (method === 'GET' && requestPath.startsWith(`${QUESTS_PATH}/`)) {
            const questId = requestPath.slice(`${QUESTS_PATH}/`.length);
            const result = await questGetBroker({
              input: getQuestInputContract.parse({ questId }),
            });
            return { status: result.success ? 200 : 404, body: result };
          }

          if (
            simulateStartRoute &&
            method === 'POST' &&
            requestPath.startsWith(`${QUESTS_PATH}/`) &&
            requestPath.endsWith(START_PATH_SUFFIX)
          ) {
            const questId = requestPath.slice(
              `${QUESTS_PATH}/`.length,
              requestPath.length - START_PATH_SUFFIX.length,
            );
            const result = await questModifyBroker({
              input: modifyQuestInputContract.parse({
                questId: questIdContract.parse(questId),
                status: IN_PROGRESS_STATUS,
              }),
            });
            return result.success
              ? { status: 200, body: { success: true } }
              : { status: 500, body: { success: false, error: result.error } };
          }

          throw new Error(
            `liveQuestTargetHarness: no in-process dispatch for ${method} ${requestPath} — this ` +
              'harness real-dispatches guild/quest creation only, never the live START route (see its own header)',
          );
        },
      });
    },
  };
};
