import { recipesListingBuildBroker } from './recipes-listing-build-broker';
import { recipesListingBuildBrokerProxy } from './recipes-listing-build-broker.proxy';
import { QuestAdvancesOneStepInputsStub } from '../../../contracts/quest-advances-one-step-inputs/quest-advances-one-step-inputs.stub';
import { SessionWithNestedChainInputsStub } from '../../../contracts/session-with-nested-chain-inputs/session-with-nested-chain-inputs.stub';
import { recipeListingProbeStatics } from '../../../statics/recipe-listing-probe/recipe-listing-probe-statics';

describe('recipesListingBuildBroker', () => {
  describe('the recipe names', () => {
    it('VALID: {} => returns one entry per recipe, with the exact names', () => {
      recipesListingBuildBrokerProxy();

      const listing = recipesListingBuildBroker();

      expect(listing.map((entry) => entry.recipeName)).toStrictEqual([
        'guild-empty',
        'guild-with-three-quests',
        'guild-mid-execution',
        'quest-advances-one-step',
        'quest-completed',
        'session-single-turn',
        'session-with-nested-chain',
        'guild-active-suite',
        'session-with-nested-subagent',
      ]);
    });
  });

  describe('guild-mid-execution', () => {
    it("VALID: {} => guild-mid-execution's entry is the complete expected object", () => {
      recipesListingBuildBrokerProxy();

      const listing = recipesListingBuildBroker();

      expect(listing.find((entry) => entry.recipeName === 'guild-mid-execution')).toStrictEqual({
        recipeName: 'guild-mid-execution',
        description:
          'one guild holding three quests — the first running with its riftcarver item dropped, ' +
          'the second and third both freshly created and told apart only by their seeded title ' +
          'and request text ("Quest 2"/"Quest 3")',
        inputKeys: [],
        runs: { serverless: true },
        makes: [
          { ingredient: 'guild', count: 1 },
          { ingredient: 'quest', count: 3 },
          { ingredient: 'operation', count: 'varies' },
        ],
      });
    });
  });

  describe('quest-advances-one-step', () => {
    it("VALID: {} => quest-advances-one-step's entry is the complete expected object", () => {
      recipesListingBuildBrokerProxy();

      const listing = recipesListingBuildBroker();

      expect(listing.find((entry) => entry.recipeName === 'quest-advances-one-step')).toStrictEqual(
        {
          recipeName: 'quest-advances-one-step',
          description:
            'one quest under an existing guild, its ledger already one operation along — the first item complete and the second running',
          inputKeys: ['guildId'],
          runs: { serverless: true },
          makes: [{ ingredient: 'quest', count: 1 }],
        },
      );
    });
  });

  describe('session-with-nested-chain', () => {
    it("VALID: {} => session-with-nested-chain's inputKeys is ['guildPath']", () => {
      recipesListingBuildBrokerProxy();

      const listing = recipesListingBuildBroker();

      expect(
        listing.find((entry) => entry.recipeName === 'session-with-nested-chain')?.inputKeys,
      ).toStrictEqual(['guildPath']);
    });

    it("VALID: {} => session-with-nested-chain's entry is the complete expected object", () => {
      recipesListingBuildBrokerProxy();

      const listing = recipesListingBuildBroker();

      expect(
        listing.find((entry) => entry.recipeName === 'session-with-nested-chain'),
      ).toStrictEqual({
        recipeName: 'session-with-nested-chain',
        description:
          'one session under an existing guild, holding a nested sub-agent chain two levels deep ' +
          '— a top agent with one sub-agent nested under it',
        inputKeys: ['guildPath'],
        runs: { serverless: true },
        makes: [{ ingredient: 'session', count: 1 }],
      });
    });
  });

  describe('the listing probes', () => {
    it("VALID: {} => quest-advances-one-step's probe parses through that recipe's own inputs contract", () => {
      expect(
        QuestAdvancesOneStepInputsStub({
          guildId: recipeListingProbeStatics.questAdvancesOneStep.guildId,
        }),
      ).toStrictEqual({ guildId: '00000000-0000-4000-8000-000000000000' });
    });

    it("VALID: {} => session-with-nested-chain's probe parses through that recipe's own inputs contract", () => {
      expect(
        SessionWithNestedChainInputsStub({
          guildPath: recipeListingProbeStatics.sessionWithNestedChain.guildPath,
        }),
      ).toStrictEqual({ guildPath: '/siegelense-recipes/listing-probe/never-seeded' });
    });
  });

  // Last in the file on purpose: it leaves `recipeListingProbeStatics.questAdvancesOneStep`
  // corrupted (`Object.defineProperty` is the only lint-legal way to mutate a statics object
  // outside a `*-guard.ts`/`*-contract.ts` file), and no test above this one depends on it.
  describe('a broken probe', () => {
    it("INVALID: {a probe that no longer parses its recipe's inputs} => throws naming the recipe and the failing key", () => {
      const proxy = recipesListingBuildBrokerProxy();
      proxy.corruptQuestAdvancesOneStepProbe();

      expect(() => recipesListingBuildBroker()).toThrow(
        /^recipe 'quest-advances-one-step': its listing probe no longer satisfies its own inputs contract — [\s\S]*guildId/u,
      );
    });
  });
});
