import { questGetBroker } from '@dungeonmaster/orchestrator/brokers';
import { GetQuestInputStub } from '@dungeonmaster/shared/contracts';
import type { GuildStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { SavedRecordNameStub } from '@dungeonmaster/hydration/contracts';

import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';
import { liveQuestTargetHarness } from '../../../../test/harnesses/live-quest-target/live-quest-target.harness';
import { QuestFieldsStub } from '../../../contracts/quest-fields/quest-fields.stub';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesQuestCompletedBroker } from './recipes-quest-completed-broker';

type Guild = ReturnType<typeof GuildStub>;
type Quest = ReturnType<typeof QuestStub>;

const { run } = dmRegistryBroker;

const GUILD_NAME = SavedRecordNameStub({ value: 'guild' });
const QUEST_NAME = SavedRecordNameStub({ value: 'quest' });
const QUEST_TITLE = QuestFieldsStub({ title: 'Verified Flow' }).title;

describe('recipesQuestCompletedBroker', () => {
  describe('the manifest identity chunk 8 reads off this same export', () => {
    it('VALID: {} => carries its verbatim name, description, and no inputs', () => {
      expect({
        recipeName: recipesQuestCompletedBroker.recipeName,
        description: recipesQuestCompletedBroker.description,
        inputs: recipesQuestCompletedBroker.inputs,
      }).toStrictEqual({
        recipeName: 'quest-completed',
        description:
          'one guild holding one completed quest with all workflow operations and work items finished',
        inputs: undefined,
      });
    });
  });

  describe('run against a real temporary directory', () => {
    const fileTarget = fileTargetHarness();

    it('VALID: {} => saves guild, quest and each operation named for a later attachWorkItem reference', async () => {
      const result = await run(recipesQuestCompletedBroker(), fileTarget.target());

      expect(Object.keys(result).sort()).toStrictEqual([
        'codeweaverOperation',
        'guild',
        'quest',
        'wardOperation',
      ]);
    });

    it('VALID: {} => quest is complete with title "Verified Flow"', async () => {
      const result = await run(recipesQuestCompletedBroker(), fileTarget.target());
      const quest = (result as Record<PropertyKey, unknown>)[QUEST_NAME] as Quest;

      expect({ status: quest.status, title: quest.title }).toStrictEqual({
        status: 'complete',
        title: 'Verified Flow',
      });
    });

    it('VALID: {} => on disk, the quest has codeweaver and ward operations in its ledger, both complete', async () => {
      const result = await run(recipesQuestCompletedBroker(), fileTarget.target());
      const guild = (result as Record<PropertyKey, unknown>)[GUILD_NAME] as Guild;
      const quest = (result as Record<PropertyKey, unknown>)[QUEST_NAME] as Quest;

      const operationsOnDisk = fileTarget.readQuestFileOperations({
        guildId: guild.id,
        questFolder: quest.folder,
      });

      expect(
        operationsOnDisk.map((operation) => ({ role: operation.role, status: operation.status })),
      ).toStrictEqual([
        { role: 'codeweaver', status: 'complete' },
        { role: 'ward', status: 'complete' },
      ]);
    });

    it('VALID: {} => on disk, the quest carries two work items, one per operation, both in a terminal complete state', async () => {
      await run(recipesQuestCompletedBroker(), fileTarget.target());
      const quest = fileTarget.readQuestByTitle({ title: QUEST_TITLE });

      expect(
        quest.workItems.map((workItem) => ({
          role: workItem.role,
          status: workItem.status,
          spawnerType: workItem.spawnerType,
        })),
      ).toStrictEqual([
        { role: 'codeweaver', status: 'complete', spawnerType: 'agent' },
        { role: 'ward', status: 'complete', spawnerType: 'command' },
      ]);
    });

    it('VALID: {} => each work item on disk names the REAL, run-time-minted id of the operation sharing its role', async () => {
      await run(recipesQuestCompletedBroker(), fileTarget.target());
      const quest = fileTarget.readQuestByTitle({ title: QUEST_TITLE });

      const operationIdByRole = new Map(
        quest.operations.map((operation) => [operation.role, operation.id] as const),
      );

      expect(
        quest.workItems.map((workItem) => ({
          role: workItem.role,
          relatedDataItems: workItem.relatedDataItems,
        })),
      ).toStrictEqual([
        {
          role: 'codeweaver',
          relatedDataItems: [`operations/${operationIdByRole.get('codeweaver')}`],
        },
        {
          role: 'ward',
          relatedDataItems: [`operations/${operationIdByRole.get('ward')}`],
        },
      ]);
    });

    it('VALID: {} => on disk, every operation id and work item id is a distinct real uuid', async () => {
      await run(recipesQuestCompletedBroker(), fileTarget.target());
      const quest = fileTarget.readQuestByTitle({ title: QUEST_TITLE });

      const allIds = [
        ...quest.operations.map((operation) => operation.id),
        ...quest.workItems.map((workItem) => workItem.id),
      ];

      expect(new Set(allIds).size).toBe(allIds.length);
    });
  });

  // DEF-71: on a live target the quest ingredient's `api` route walks the freshly-minted `created`
  // quest all the way to `complete` through the REAL `questReachRouteBroker`, hitting the REAL
  // `flows_approved`/`approved` gates. Before the fix this threw
  // `Missing required content for transition to flows_approved`; this proves the walk now clears
  // both gates and stops only at the one hop `liveQuestTargetHarness` cannot honestly serve —
  // `POST /api/quests/:id/start` (`orchestration-start-responder`'s own logic being unexported).
  describe('run against a live target (api route, DEF-71)', () => {
    const liveTarget = liveQuestTargetHarness();

    it('VALID: {} => walks past the flows_approved and approved gates for real, stopping only at the unserved in_progress hop', async () => {
      await expect(run(recipesQuestCompletedBroker(), liveTarget.target())).rejects.toThrow(
        /^recipe "quest-completed": ingredient "quest"'s "api" route at http:\/\/live-quest-target\.test\/api\/quests\/[0-9a-f-]+\/start refused the connection: .*no in-process dispatch for POST \/api\/quests\/[0-9a-f-]+\/start/u,
      );
    });
  });

  // DEF-100: a live target's real Start force-completes the chaoswhisperer intake item rather than
  // removing it (`packages/orchestrator/CLAUDE.md`'s own "Seed (questBuildRelayGraphBroker...)"
  // entry) — the identical fact `guild-mid-execution`'s own DEF-71 follow-up proved for its own
  // recipe (`recipes-guild-mid-execution-broker.integration.test.ts`'s "relay seed simulated"
  // describe block). This recipe's own riftcarver-removal filter already drops the auto-seeded
  // riftcarver scope; `liveQuestTargetHarness({ simulateRelaySeed: true })` is the one harness mode
  // that also seeds and force-completes the chaoswhisperer intake item for real, so this is the only
  // describe block in this file that can prove what a live target's real ledger holds once the walk
  // reads back "complete" — chaoswhisperer stays on the ledger, complete, alongside codeweaver and
  // ward, matching exactly what a production quest's own Start leaves behind.
  describe('run against a live target with the relay seed simulated (DEF-100)', () => {
    const liveTarget = liveQuestTargetHarness({ simulateRelaySeed: true });

    it('VALID: {} => on a live target, the completed quest keeps the auto-seeded chaoswhisperer intake item complete, alongside codeweaver and ward', async () => {
      const result = (await run(recipesQuestCompletedBroker(), liveTarget.target())) as Record<
        PropertyKey,
        unknown
      >;
      const quest = result[QUEST_NAME] as Quest;

      // `saveRecordAs` freezes at CREATE time, before this plan's own `operations.add`/`filter`
      // steps ran against the same on-disk file — reload fresh, exactly as
      // `guild-mid-execution`'s own DEF-71 follow-up test does for the identical reason
      // (`packages/hydration-recipes/CLAUDE.md`'s "saveRecordAs freezes a row's record" finding).
      const reloaded = await questGetBroker({ input: GetQuestInputStub({ questId: quest.id }) });
      const operationsOnDisk = reloaded.quest!.operations;

      expect({
        status: reloaded.quest!.status,
        rolesOnDisk: operationsOnDisk.map((operation) => operation.role),
        statusesOnDisk: operationsOnDisk.map((operation) => operation.status),
      }).toStrictEqual({
        status: 'complete',
        rolesOnDisk: ['chaoswhisperer', 'codeweaver', 'ward'],
        statusesOnDisk: ['complete', 'complete', 'complete'],
      });
    });
  });
});
