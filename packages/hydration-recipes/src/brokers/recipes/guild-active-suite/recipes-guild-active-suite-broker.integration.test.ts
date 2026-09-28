import { liveQuestTargetHarness } from '../../../../test/harnesses/live-quest-target/live-quest-target.harness';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesGuildActiveSuiteBroker } from './recipes-guild-active-suite-broker';

describe('recipesGuildActiveSuiteBroker', () => {
  describe('the manifest identity chunk 8 reads off this same export', () => {
    it('VALID: {} => carries its verbatim name, description, and no inputs', () => {
      expect({
        recipeName: recipesGuildActiveSuiteBroker.recipeName,
        description: recipesGuildActiveSuiteBroker.description,
        inputs: recipesGuildActiveSuiteBroker.inputs,
      }).toStrictEqual({
        recipeName: 'guild-active-suite',
        description:
          'one active guild holding two quests (one in progress, one complete) and a session with subagent chain',
        inputs: undefined,
      });
    });
  });

  describe('plan structure and listing', () => {
    it('VALID: {} => produces a plan making guild, 2 quests, session and subagent', () => {
      const plan = recipesGuildActiveSuiteBroker();
      const listing = dmRegistryBroker.listing(plan);

      expect(listing).toStrictEqual({
        runs: { serverless: true },
        makes: [
          { ingredient: 'guild', count: 1 },
          { ingredient: 'quest', count: 2 },
          { ingredient: 'session', count: 1 },
          { ingredient: 'subagent', count: 1 },
        ],
      });
    });
  });

  // DEF-71: on a live target the quest ingredient's `api` route walks the first freshly-minted
  // `created` quest to `in_progress` through the REAL `questReachRouteBroker`, hitting the REAL
  // `flows_approved`/`approved` gates on the way. Before the fix this threw
  // `Missing required content for transition to flows_approved`; this proves the walk now clears
  // both gates and stops only at the one hop `liveQuestTargetHarness` cannot honestly serve —
  // `POST /api/quests/:id/start` (`orchestration-start-responder`'s own logic being unexported).
  describe('run against a live target (api route, DEF-71)', () => {
    const liveTarget = liveQuestTargetHarness();

    it('VALID: {} => walks past the flows_approved and approved gates for real, stopping only at the unserved in_progress hop', async () => {
      const { run } = dmRegistryBroker;

      await expect(run(recipesGuildActiveSuiteBroker(), liveTarget.target())).rejects.toThrow(
        /^recipe "guild-active-suite": ingredient "quest"'s "api" route at http:\/\/live-quest-target\.test\/api\/quests\/[0-9a-f-]+\/start refused the connection: .*no in-process dispatch for POST \/api\/quests\/[0-9a-f-]+\/start/u,
      );
    });
  });
});
