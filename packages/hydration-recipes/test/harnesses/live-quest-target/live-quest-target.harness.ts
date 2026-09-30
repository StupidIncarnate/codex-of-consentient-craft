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
 * A third opt-in, `simulateRelaySeed: true`, is a SEPARATE code path from `simulateStartRoute` —
 * neither test suite using the plain flip is affected by this one existing. It makes BOTH the
 * create and the `/start` handlers production-plausible for the ONE thing DEF-71's guild-mid-
 * execution fix needs proved: `questCreateBroker` seeds EVERY quest, real or seeded, with one
 * locked `{role: chaoswhisperer, status: in_progress}` operation at create time (verified by
 * reading `quest-create-broker.ts` directly), and a real Start (`questBuildRelayGraphBroker`)
 * force-completes that item and mints one `riftcarver` scope `in_progress` — never a bare status
 * flip. `simulateStartRoute` stays the cheap, honest-for-its-own-tests plain flip for every
 * caller that only needs to drive a plan PAST `in_progress`, not prove what the ledger holds there.
 *
 * USAGE:
 * describe('...', () => {
 *   const liveTarget = liveQuestTargetHarness();
 *   it('VALID: {} => walks the real gates', async () => {
 *     const result = await dmRegistryBroker.run(someRecipe(), liveTarget.target());
 *   });
 * });
 */
import { randomUUID } from '#gateway/node/crypto';
import { writeFileSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import { deleteEnv, getEnv, setEnv } from '#gateway/node/process';

import {
  guildAddBroker,
  questGetBroker,
  questModifyBroker,
} from '@dungeonmaster/orchestrator/brokers';
import {
  getQuestInputContract,
  modifyQuestInputContract,
  operationItemContract,
  questContract,
  guildContract,
} from '@dungeonmaster/shared/contracts';
import type { Quest, Guild } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics, questFlowStatics } from '@dungeonmaster/shared/statics';
import { installTestbedCreateBroker } from '@dungeonmaster/testing';

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
const COMPLETE_STATUS = 'complete';
const START_PATH_SUFFIX = '/start';
const FEATURE_QUEST_TYPE = 'feature';
const { initialWorkItemRole, entry, families } = questFlowStatics[FEATURE_QUEST_TYPE];
const ENTRY_FAMILY_ROLE = families[entry].role;
const INTAKE_OPERATION_TEXT = 'Author spec + implementation plan';
const ENTRY_OPERATION_TEXT = 'Carve the quest branch, worktree and preflight typecheck';

export const liveQuestTargetHarness = ({
  simulateStartRoute = false,
  simulateRelaySeed = false,
}: { simulateStartRoute?: boolean; simulateRelaySeed?: boolean } = {}): {
  beforeEach: () => void;
  afterEach: () => void;
  target: () => DmTarget;
} => {
  let testbed: ReturnType<typeof installTestbedCreateBroker> | undefined;
  let savedDungeonmasterHome: ReturnType<typeof getEnv>;

  return {
    beforeEach: (): void => {
      testbed = installTestbedCreateBroker({
        baseName: 'live-quest-target',
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
        throw new Error('liveQuestTargetHarness: target() called outside beforeEach/afterEach');
      }
      const home = testbed.guildPath;
      const innerTarget = DmTargetStub({ home, claudeHome: home });
      // `questContract` carries no `guildId` field (a quest's parent is its FOLDER on disk, never a
      // field on the record — `quest-fields-contract.ts`'s own header) so a later `/start` rewrite
      // through `questWriteRouteBroker`, which REQUIRES `guildId`, cannot recover it by spreading a
      // reloaded `Quest`. Recorded here at create time instead, scoped to this one `target()` call.
      const questGuildIds = new Map<Quest['id'], Guild['id']>();

      return DmTargetStub({
        home,
        claudeHome: home,
        baseUrl: IN_PROCESS_BASE_URL,
        request: async ({ method, path: requestPath, body }) => {
          if (method === 'POST' && requestPath === GUILDS_PATH) {
            const fields = body as Record<PropertyKey, unknown>;
            const guild = await guildAddBroker({
              name: String(fields.name),
              path: String(fields.path),
            });
            return { status: 201, body: guild };
          }

          if (method === 'POST' && requestPath === QUESTS_PATH) {
            const fields = body as Record<PropertyKey, unknown>;
            const intakeOperation = operationItemContract.parse({
              id: randomUUID(),
              role: initialWorkItemRole,
              text: INTAKE_OPERATION_TEXT,
              status: IN_PROGRESS_STATUS,
              locked: true,
            });
            const quest = await questWriteRouteBroker({
              target: innerTarget,
              fields: {
                guildId: fields.guildId,
                title: fields.title,
                userRequest: fields.userRequest,
                status: CREATED_STATUS,
                ...(simulateRelaySeed ? { operations: [intakeOperation] } : {}),
              },
            });
            questGuildIds.set(quest.id, guildContract.shape.id.parse(fields.guildId));
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
            simulateRelaySeed &&
            method === 'POST' &&
            requestPath.startsWith(`${QUESTS_PATH}/`) &&
            requestPath.endsWith(START_PATH_SUFFIX)
          ) {
            const questId = requestPath.slice(
              `${QUESTS_PATH}/`.length,
              requestPath.length - START_PATH_SUFFIX.length,
            );
            const loaded = await questGetBroker({
              input: getQuestInputContract.parse({ questId }),
            });
            if (!loaded.success) {
              return { status: 404, body: loaded };
            }
            const quest = loaded.quest!;
            const guildId = questGuildIds.get(quest.id);
            if (guildId === undefined) {
              throw new Error(
                `liveQuestTargetHarness: no guildId recorded for quest "${String(quest.id)}" — ` +
                  'this target never created it through the POST /api/quests handler above',
              );
            }
            const seededOperations = [
              ...quest.operations.map((operation) =>
                operation.role === initialWorkItemRole
                  ? { ...operation, status: COMPLETE_STATUS }
                  : operation,
              ),
              operationItemContract.parse({
                id: randomUUID(),
                role: ENTRY_FAMILY_ROLE,
                text: ENTRY_OPERATION_TEXT,
                status: IN_PROGRESS_STATUS,
              }),
            ];
            await questWriteRouteBroker({
              target: innerTarget,
              fields: {
                ...quest,
                guildId,
                status: IN_PROGRESS_STATUS,
                operations: seededOperations,
              },
            });
            return { status: 200, body: { success: true } };
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
                questId: questContract.shape.id.parse(questId),
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
