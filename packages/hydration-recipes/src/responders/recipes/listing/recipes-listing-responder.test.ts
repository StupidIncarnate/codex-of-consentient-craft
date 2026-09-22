import { RecipesListingResponderProxy } from './recipes-listing-responder.proxy';

describe('RecipesListingResponder', () => {
  describe('delegation to recipesListingBuildBroker', () => {
    it('VALID: {} => delegates to broker and returns all 8 declared recipes', () => {
      const proxy = RecipesListingResponderProxy();

      const result = proxy.callResponder();

      expect(result).toStrictEqual([
        {
          recipeName: 'guild-empty',
          description:
            'one empty guild with no quests or sessions, ready for initial configuration',
          inputKeys: [],
          runs: { serverless: true },
          makes: [{ ingredient: 'guild', count: 1 }],
        },
        {
          recipeName: 'guild-with-three-quests',
          description:
            'one guild holding three quests: one created, one in_progress, and one complete',
          inputKeys: [],
          runs: { serverless: true },
          makes: [
            { ingredient: 'guild', count: 1 },
            { ingredient: 'quest', count: 'varies' },
          ],
        },
        {
          recipeName: 'guild-mid-execution',
          description:
            'one guild holding three quests, the first running with its riftcarver item dropped',
          inputKeys: [],
          runs: { serverless: true },
          makes: [
            { ingredient: 'guild', count: 1 },
            { ingredient: 'quest', count: 3 },
            { ingredient: 'operation', count: 'varies' },
          ],
        },
        {
          recipeName: 'quest-advances-one-step',
          description:
            'one quest under an existing guild, its ledger already one operation along — the first item complete and the second running',
          inputKeys: ['guildId'],
          runs: { serverless: true },
          makes: [{ ingredient: 'quest', count: 1 }],
        },
        {
          recipeName: 'quest-completed',
          description:
            'one guild holding one completed quest with all workflow operations finished',
          inputKeys: [],
          runs: { serverless: true },
          makes: [
            { ingredient: 'guild', count: 1 },
            { ingredient: 'quest', count: 1 },
            { ingredient: 'operation', count: 2 },
          ],
        },
        {
          recipeName: 'session-single-turn',
          description:
            'one session under an existing guild, holding a single turn prompt and response',
          inputKeys: ['guildPath'],
          runs: { serverless: true },
          makes: [{ ingredient: 'session', count: 1 }],
        },
        {
          recipeName: 'session-with-nested-chain',
          description: 'one session under an existing guild, holding a nested sub-agent chain',
          inputKeys: ['guildPath'],
          runs: { serverless: true },
          makes: [{ ingredient: 'session', count: 1 }],
        },
        {
          recipeName: 'guild-active-suite',
          description:
            'one active guild holding two quests (one in progress, one complete) and a session with subagent chain',
          inputKeys: [],
          runs: { serverless: true },
          makes: [
            { ingredient: 'guild', count: 1 },
            { ingredient: 'quest', count: 2 },
            { ingredient: 'session', count: 1 },
            { ingredient: 'subagent', count: 1 },
          ],
        },
      ]);
    });
  });

  describe('a corrupted listing probe', () => {
    it('INVALID: {corrupted probe} => throws error naming the recipe and failing key', () => {
      const proxy = RecipesListingResponderProxy();
      proxy.corruptQuestAdvancesOneStepProbe();

      expect(() => proxy.callResponder()).toThrow(
        /^recipe 'quest-advances-one-step': its listing probe no longer satisfies its own inputs contract/u,
      );
    });
  });
});
