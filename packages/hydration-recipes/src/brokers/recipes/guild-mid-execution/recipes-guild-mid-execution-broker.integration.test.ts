import { questGetBroker } from '@dungeonmaster/orchestrator/brokers';
import { GetQuestInputStub } from '@dungeonmaster/shared/contracts/get-quest-input/get-quest-input.stub';
import type { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { SavedRecordNameStub } from '@dungeonmaster/hydration/contracts/saved-record-name/saved-record-name.stub';

import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';
import { liveQuestTargetHarness } from '../../../../test/harnesses/live-quest-target/live-quest-target.harness';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesGuildMidExecutionBroker } from './recipes-guild-mid-execution-broker';

type Guild = ReturnType<typeof GuildStub>;
type Quest = ReturnType<typeof QuestStub>;

const { run } = dmRegistryBroker;

const GUILD_NAME = SavedRecordNameStub({ value: 'guild' });
const QUEST1_NAME = SavedRecordNameStub({ value: 'quest1' });
const QUEST2_NAME = SavedRecordNameStub({ value: 'quest2' });
const QUEST3_NAME = SavedRecordNameStub({ value: 'quest3' });

describe('recipesGuildMidExecutionBroker', () => {
  describe('the manifest identity chunk 8 reads off this same export', () => {
    it('VALID: {} => carries its verbatim name, description, and no inputs', () => {
      expect({
        recipeName: recipesGuildMidExecutionBroker.recipeName,
        description: recipesGuildMidExecutionBroker.description,
        inputs: recipesGuildMidExecutionBroker.inputs,
      }).toStrictEqual({
        recipeName: 'guild-mid-execution',
        description:
          'one guild holding three quests — the first running with codeweaver actually in progress ' +
          'and its riftcarver item dropped, the second and third both freshly created and told ' +
          'apart only by their seeded title and request text ("Quest 2"/"Quest 3")',
        inputs: undefined,
      });
    });
  });

  describe('run against a real temporary directory', () => {
    const fileTarget = fileTargetHarness();

    it('VALID: {} => saves exactly guild, quest1, quest2 and quest3', async () => {
      const result = await run(recipesGuildMidExecutionBroker(), fileTarget.target());

      expect(Object.keys(result).sort()).toStrictEqual(['guild', 'quest1', 'quest2', 'quest3']);
    });

    it('VALID: {} => the guild record carries the derived name and a real url slug', async () => {
      const result = await run(recipesGuildMidExecutionBroker(), fileTarget.target());
      const guild = result[GUILD_NAME] as unknown as Guild;

      expect({ name: guild.name, urlSlug: guild.urlSlug }).toStrictEqual({
        name: 'Guild 1',
        urlSlug: 'guild-1',
      });
    });

    it('VALID: {} => the three quests read back with the titles defaults(index) and set() produced', async () => {
      const result = await run(recipesGuildMidExecutionBroker(), fileTarget.target());
      const quest1 = result[QUEST1_NAME] as unknown as Quest;
      const quest2 = result[QUEST2_NAME] as unknown as Quest;
      const quest3 = result[QUEST3_NAME] as unknown as Quest;

      expect([quest1.title, quest2.title, quest3.title]).toStrictEqual([
        'The running one',
        'Quest 2',
        'Quest 3',
      ]);
    });

    it('VALID: {} => the second and third quests are NOT byte-identical — status matches by design, title and userRequest do not', async () => {
      const result = await run(recipesGuildMidExecutionBroker(), fileTarget.target());
      const quest2 = result[QUEST2_NAME] as unknown as Quest;
      const quest3 = result[QUEST3_NAME] as unknown as Quest;

      expect({
        sameStatus: quest2.status === quest3.status,
        title2: quest2.title,
        title3: quest3.title,
        userRequest2: quest2.userRequest,
        userRequest3: quest3.userRequest,
      }).toStrictEqual({
        sameStatus: true,
        title2: 'Quest 2',
        title3: 'Quest 3',
        userRequest2: 'seeded quest 2',
        userRequest3: 'seeded quest 3',
      });
    });

    it('VALID: {} => on disk, the first quest is in_progress with the riftcarver operation dropped from its ledger and codeweaver actually running', async () => {
      const result = await run(recipesGuildMidExecutionBroker(), fileTarget.target());
      const guild = result[GUILD_NAME] as unknown as Guild;
      const quest1 = result[QUEST1_NAME] as unknown as Quest;

      const operationsOnDisk = fileTarget.readQuestFileOperations({
        guildId: guild.id,
        questFolder: quest1.folder,
      });
      const rolesOnDisk = operationsOnDisk.map((operation) => operation.role);
      const statusesOnDisk = operationsOnDisk.map((operation) => operation.status);

      expect({ status: quest1.status, rolesOnDisk, statusesOnDisk }).toStrictEqual({
        status: 'in_progress',
        rolesOnDisk: ['codeweaver', 'ward', 'flowrider', 'siegemaster'],
        statusesOnDisk: ['in_progress', 'pending', 'pending', 'pending'],
      });
    });

    it("VALID: {} => on disk, the second and third quests' ledgers stay empty — the scope rule", async () => {
      const result = await run(recipesGuildMidExecutionBroker(), fileTarget.target());
      const guild = result[GUILD_NAME] as unknown as Guild;
      const quest2 = result[QUEST2_NAME] as unknown as Quest;
      const quest3 = result[QUEST3_NAME] as unknown as Quest;

      const rolesOnDisk2 = fileTarget
        .readQuestFileOperations({ guildId: guild.id, questFolder: quest2.folder })
        .map((operation) => operation.role);
      const rolesOnDisk3 = fileTarget
        .readQuestFileOperations({ guildId: guild.id, questFolder: quest3.folder })
        .map((operation) => operation.role);

      expect({ rolesOnDisk2, rolesOnDisk3 }).toStrictEqual({
        rolesOnDisk2: [],
        rolesOnDisk3: [],
      });
    });
  });

  // DEF-71: a live target (`baseUrl` set) picks the quest ingredient's `api` route over `write`,
  // and `POST /api/quests` never mints anything but `created` — so `q[0]`'s create-time `setRaw`'d
  // `in_progress` is walked there through the REAL `questReachRouteBroker`, hitting the REAL
  // `flows_approved`/`approved` gates for real. Before the fix this threw
  // `Missing required content for transition to flows_approved` because the recipe supplied no
  // flow content the create wire could carry; this suite proves the walk now clears both gates
  // (using `liveQuestTargetHarness`'s real `questUserAddBroker`/`questModifyBroker`/`questGetBroker`
  // dispatch, never `instanceStubHarness`'s canned echo, which persists nothing for the in-process
  // hops to find) and only stops at the ONE hop this harness cannot honestly serve —
  // `POST /api/quests/:id/start`, `orchestration-start-responder`'s own logic being unexported.
  describe('run against a live target (api route, DEF-71)', () => {
    const liveTarget = liveQuestTargetHarness();

    it('VALID: {} => walks past the flows_approved and approved gates for real, stopping only at the unserved in_progress hop', async () => {
      await expect(run(recipesGuildMidExecutionBroker(), liveTarget.target())).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "quest"'s "api" route at http:\/\/live-quest-target\.test\/api\/quests\/[0-9a-f-]+\/start refused the connection: .*no in-process dispatch for POST \/api\/quests\/[0-9a-f-]+\/start/u,
      );
    });
  });

  // DEF-71 follow-up: a real live target mints EVERY quest with a locked `chaoswhisperer` operation
  // at create (`quest-create-broker.ts`), and a real Start force-completes it rather than removing it
  // (`questBuildRelayGraphBroker`) — on top of the riftcarver scope the DEF-71 gate tests already
  // cover. Before this fix, quest1's ledger carried FIVE items on a live target — `chaoswhisperer:
  // complete` alongside the four tail roles, every one of THOSE `pending`, so the "running" quest had
  // nothing actually running. This recipe leaves `chaoswhisperer` on the ledger (the broker's own
  // header explains why a second `.filter().remove()` for it is not an option, and why keeping it is
  // the more honest answer anyway) and fixes the real bug: `codeweaver` now carries an explicit
  // `status: 'in_progress'`. `liveQuestTargetHarness({ simulateRelaySeed: true })` is the one harness
  // mode that seeds and force-completes the intake item for real, so this is the only describe block
  // in this file that can prove it survives riftcarver's own removal untouched.
  describe('run against a live target with the relay seed simulated (DEF-71 follow-up)', () => {
    const liveTarget = liveQuestTargetHarness({ simulateRelaySeed: true });

    it('VALID: {} => on a live target, the first quest keeps the auto-seeded chaoswhisperer intake item, drops riftcarver, and has codeweaver actually running', async () => {
      const result = (await run(recipesGuildMidExecutionBroker(), liveTarget.target())) as Record<
        PropertyKey,
        unknown
      >;
      const quest1 = result[QUEST1_NAME] as Quest;

      // `saveRecordAs` freezes at CREATE time, before this plan's own `operations.add`/`filter`
      // steps ran against the same on-disk file — reload fresh, exactly as `readQuestFileOperations`
      // does for the write-target case above (`packages/hydration-recipes/CLAUDE.md`'s own finding).
      const reloaded = await questGetBroker({ input: GetQuestInputStub({ questId: quest1.id }) });
      const operationsOnDisk = reloaded.quest!.operations;

      expect({
        status: reloaded.quest!.status,
        rolesOnDisk: operationsOnDisk.map((operation) => operation.role),
        statusesOnDisk: operationsOnDisk.map((operation) => operation.status),
      }).toStrictEqual({
        status: 'in_progress',
        rolesOnDisk: ['chaoswhisperer', 'codeweaver', 'ward', 'flowrider', 'siegemaster'],
        statusesOnDisk: ['complete', 'in_progress', 'pending', 'pending', 'pending'],
      });
    });

    it("VALID: {} => on a live target, quests 2 and 3 each carry only the auto-seeded chaoswhisperer intake item — the recipe's own scope rule still holds", async () => {
      const result = (await run(recipesGuildMidExecutionBroker(), liveTarget.target())) as Record<
        PropertyKey,
        unknown
      >;
      const quest2 = result[QUEST2_NAME] as Quest;
      const quest3 = result[QUEST3_NAME] as Quest;

      const reloaded2 = await questGetBroker({ input: GetQuestInputStub({ questId: quest2.id }) });
      const reloaded3 = await questGetBroker({ input: GetQuestInputStub({ questId: quest3.id }) });

      expect({
        rolesOnDisk2: reloaded2.quest!.operations.map((operation) => operation.role),
        rolesOnDisk3: reloaded3.quest!.operations.map((operation) => operation.role),
      }).toStrictEqual({
        rolesOnDisk2: ['chaoswhisperer'],
        rolesOnDisk3: ['chaoswhisperer'],
      });
    });
  });
});
