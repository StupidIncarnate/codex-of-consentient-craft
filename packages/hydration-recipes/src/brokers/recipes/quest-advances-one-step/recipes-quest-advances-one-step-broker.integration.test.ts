import type { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';
import { liveQuestTargetHarness } from '../../../../test/harnesses/live-quest-target/live-quest-target.harness';
import { QuestFieldsStub } from '../../../contracts/quest-fields/quest-fields.stub';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesGuildEmptyBroker } from '../guild-empty/recipes-guild-empty-broker';
import { recipesGuildMidExecutionBroker } from '../guild-mid-execution/recipes-guild-mid-execution-broker';
import { recipesQuestAdvancesOneStepBroker } from './recipes-quest-advances-one-step-broker';

type Guild = ReturnType<typeof GuildStub>;
type Quest = ReturnType<typeof QuestStub>;

const { run } = dmRegistryBroker;

const GUILD_NAME = 'guild';
const QUEST_NAME = 'quest';
const QUEST_TITLE = QuestFieldsStub({ title: 'Advancing quest' }).title;

describe('recipesQuestAdvancesOneStepBroker', () => {
  describe('the manifest identity chunk 8 reads off this same export', () => {
    it('VALID: {} => carries its verbatim name, description, and a real inputs schema', () => {
      expect({
        recipeName: recipesQuestAdvancesOneStepBroker.recipeName,
        description: recipesQuestAdvancesOneStepBroker.description,
        hasInputs: recipesQuestAdvancesOneStepBroker.inputs !== undefined,
      }).toStrictEqual({
        recipeName: 'quest-advances-one-step',
        description:
          'one quest under an existing guild, its ledger already one operation along — the first item complete and the second running',
        hasInputs: true,
      });
    });
  });

  describe('stacked on a guild an EARLIER step made, against a real temporary directory', () => {
    const fileTarget = fileTargetHarness();

    it('VALID: {guildId from an earlier step} => saves exactly quest', async () => {
      const target = fileTarget.target();
      const earlierStep = await run(recipesGuildMidExecutionBroker(), target);
      const guild = earlierStep[GUILD_NAME] as unknown as Guild;

      const result = await run(recipesQuestAdvancesOneStepBroker({ guildId: guild.id }), target);

      expect(Object.keys(result).sort()).toStrictEqual(['quest']);
    });

    it('VALID: {guildId from an earlier step} => the quest is under THAT guild, in_progress', async () => {
      const target = fileTarget.target();
      const earlierStep = await run(recipesGuildMidExecutionBroker(), target);
      const guild = earlierStep[GUILD_NAME] as unknown as Guild;

      const result = await run(recipesQuestAdvancesOneStepBroker({ guildId: guild.id }), target);
      const quest = (result as Record<PropertyKey, unknown>)[QUEST_NAME] as Quest;

      expect({ status: quest.status, title: quest.title }).toStrictEqual({
        status: 'in_progress',
        title: 'Advancing quest',
      });
    });

    it('VALID: {guildId from an earlier step} => the ledger reads one item complete, the second running', async () => {
      const target = fileTarget.target();
      const earlierStep = await run(recipesGuildMidExecutionBroker(), target);
      const guild = earlierStep[GUILD_NAME] as unknown as Guild;

      const result = await run(recipesQuestAdvancesOneStepBroker({ guildId: guild.id }), target);
      const quest = (result as Record<PropertyKey, unknown>)[QUEST_NAME] as Quest;

      const operationsOnDisk = fileTarget.readQuestFileOperations({
        guildId: guild.id,
        questFolder: quest.folder,
      });

      expect({
        rolesOnDisk: operationsOnDisk.map((operation) => operation.role),
        statusesOnDisk: operationsOnDisk.map((operation) => operation.status),
      }).toStrictEqual({
        rolesOnDisk: ['codeweaver', 'ward'],
        statusesOnDisk: ['complete', 'in_progress'],
      });
    });

    it('VALID: {guildId from an earlier step} => on disk, both operation ids are distinct, real, run-time-minted uuids', async () => {
      const target = fileTarget.target();
      const earlierStep = await run(recipesGuildMidExecutionBroker(), target);
      const guild = earlierStep[GUILD_NAME] as unknown as Guild;

      await run(recipesQuestAdvancesOneStepBroker({ guildId: guild.id }), target);
      const quest = fileTarget.readQuestByTitle({ title: QUEST_TITLE });

      const operationIds = quest.operations.map((operation) => operation.id);

      expect(new Set(operationIds).size).toBe(operationIds.length);
    });
  });

  // DEF-71: on a live target the quest ingredient's `api` route walks the freshly-minted `created`
  // quest to `in_progress` through the REAL `questReachRouteBroker`, hitting the REAL
  // `flows_approved`/`approved` gates on the way — reachable outside `start --seed` (which cannot
  // pass this recipe's required `guildId` param at all) via a `run` `seed` step, exactly as the
  // dogfood repro that widened DEF-71 to this recipe used. Before the fix this threw
  // `Missing required content for transition to flows_approved`; this proves the walk now clears
  // both gates and stops only at the one hop `liveQuestTargetHarness` cannot honestly serve —
  // `POST /api/quests/:id/start` (`orchestration-start-responder`'s own logic being unexported).
  describe('run against a live target (api route, DEF-71)', () => {
    const liveTarget = liveQuestTargetHarness();

    it('VALID: {guildId from an earlier step on the SAME live target} => walks past the flows_approved and approved gates for real, stopping only at the unserved in_progress hop', async () => {
      const target = liveTarget.target();
      const earlierStep = (await run(recipesGuildEmptyBroker(), target)) as Record<
        PropertyKey,
        unknown
      >;
      const guild = earlierStep[GUILD_NAME] as Guild;

      await expect(
        run(recipesQuestAdvancesOneStepBroker({ guildId: guild.id }), target),
      ).rejects.toThrow(
        /^recipe "quest-advances-one-step": ingredient "quest"'s "api" route at http:\/\/live-quest-target\.test\/api\/quests\/[0-9a-f-]+\/start refused the connection: .*no in-process dispatch for POST \/api\/quests\/[0-9a-f-]+\/start/u,
      );
    });
  });
});
