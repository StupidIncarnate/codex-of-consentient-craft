import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';
import { QuestFieldsStub } from '../../../contracts/quest-fields/quest-fields.stub';
import { seedFixtureStatics } from '../../../statics/seed-fixture/seed-fixture-statics';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesGuildWithThreeQuestsBroker } from './recipes-guild-with-three-quests-broker';

type Quest = ReturnType<typeof QuestStub>;

const { run } = dmRegistryBroker;

const CREATED_TITLE = QuestFieldsStub({ title: 'Setup Database' }).title;
const IN_PROGRESS_TITLE = QuestFieldsStub({ title: 'Implement Authentication' }).title;
const COMPLETE_TITLE = QuestFieldsStub({ title: 'Scaffold Architecture' }).title;
// `seedFixtureStatics` is declared `as const`, so its arrays are deeply `readonly` — a JSON
// round-trip is what strips that back to the mutable shape `QuestFieldsStub`'s own argument type
// expects, the same fixture value either way.
const GATE_FLOWS = QuestFieldsStub({
  flows: JSON.parse(JSON.stringify(seedFixtureStatics.quest.flows)),
}).flows;
const GATE_PACKAGES_AFFECTED = QuestFieldsStub({
  packagesAffected: JSON.parse(JSON.stringify(seedFixtureStatics.quest.packagesAffected)),
}).packagesAffected;

const IN_PROGRESS_ERROR =
  /^recipe "guild-with-three-quests": ingredient "quest" cannot go to "in_progress" from "approved": questReachRouteBroker: a write-only target cannot walk a quest to "in_progress" — .+$/u;

// Every test below runs against `fileTargetHarness()` — a WRITE-only target, no `baseUrl`. That is
// real evidence for everything up through `approved`: a `set({status})`'s transition always calls
// the ingredient's real `reach` (`questReachRouteBroker`), which walks every ordinary hop through
// the real, in-process `questModifyBroker` regardless of `baseUrl` — only the ONE hop into
// `in_progress` needs a live server, since reaching it calls the real
// `POST /api/quests/:questId/start` route. So this target proves the flows/packagesAffected gate
// content genuinely clears `flows_approved` and `approved` for both quests, and that the recipe
// then makes an honest, DOCUMENTED attempt at `in_progress` rather than the silent, gateless
// `setRaw` write this exact harness used to let pass. Proving `in_progress`/`complete` land for
// real needs a live orchestrator HTTP server backing `home` — `recipes-seed-run-broker.integration
// .test.ts`'s own "a baseUrl supplied on a recipe whose ingredient declares an api route" test
// already documents that this package owns no such harness today.
describe('recipesGuildWithThreeQuestsBroker', () => {
  describe('the manifest identity chunk 8 reads off this same export', () => {
    it('VALID: {} => carries its verbatim name, description, and no inputs', () => {
      expect({
        recipeName: recipesGuildWithThreeQuestsBroker.recipeName,
        description: recipesGuildWithThreeQuestsBroker.description,
        inputs: recipesGuildWithThreeQuestsBroker.inputs,
      }).toStrictEqual({
        recipeName: 'guild-with-three-quests',
        description:
          'one guild holding three quests: one created, one in_progress, and one complete',
        inputs: undefined,
      });
    });
  });

  describe('run against a real temporary directory — a write-only target', () => {
    const fileTarget = fileTargetHarness();

    it("ERROR: {} => walking questInProgress to in_progress throws the real gate's own write-only-target refusal, naming the status it actually reached first", async () => {
      await expect(run(recipesGuildWithThreeQuestsBroker(), fileTarget.target())).rejects.toThrow(
        IN_PROGRESS_ERROR,
      );
    });

    it('VALID: {} => questCreated lands on disk still "created", with its configured title and no gate content it never needed', async () => {
      await expect(run(recipesGuildWithThreeQuestsBroker(), fileTarget.target())).rejects.toThrow(
        IN_PROGRESS_ERROR,
      );

      const questCreated: Quest = fileTarget.readQuestByTitle({ title: CREATED_TITLE });

      expect({
        status: questCreated.status,
        title: questCreated.title,
        flows: questCreated.flows,
      }).toStrictEqual({ status: 'created', title: CREATED_TITLE, flows: [] });
    });

    it('VALID: {} => questInProgress and questComplete both carry real flows/packagesAffected content and reach "approved" for real before the plan halts', async () => {
      await expect(run(recipesGuildWithThreeQuestsBroker(), fileTarget.target())).rejects.toThrow(
        IN_PROGRESS_ERROR,
      );

      const questInProgress: Quest = fileTarget.readQuestByTitle({ title: IN_PROGRESS_TITLE });
      const questComplete: Quest = fileTarget.readQuestByTitle({ title: COMPLETE_TITLE });

      // `questModifyBroker` re-parses the whole quest through `questContract` on every save
      // (`quest-modify-broker.ts`'s own header: "so defaults ... are applied to newly-upserted
      // entries"), which materialises `flows[].offMapSignoffs: []`, and
      // `resolvePackageEntryFactsLayerBroker` stamps a `packageTypes` array alongside
      // `packagesAffected[].packageType` — both real, expected additions over the literal fixture.
      const expectedFlows = GATE_FLOWS.map((flow) => ({ ...flow, offMapSignoffs: [] }));
      const expectedPackagesAffected = GATE_PACKAGES_AFFECTED.map((entry) => ({
        ...entry,
        packageTypes: [entry.packageType],
      }));

      expect({
        inProgress: {
          status: questInProgress.status,
          flows: questInProgress.flows,
          packagesAffected: questInProgress.packagesAffected,
        },
        complete: {
          status: questComplete.status,
          flows: questComplete.flows,
          packagesAffected: questComplete.packagesAffected,
        },
      }).toStrictEqual({
        inProgress: {
          status: 'approved',
          flows: expectedFlows,
          packagesAffected: expectedPackagesAffected,
        },
        complete: {
          status: 'approved',
          flows: expectedFlows,
          packagesAffected: expectedPackagesAffected,
        },
      });
    });
  });
});
