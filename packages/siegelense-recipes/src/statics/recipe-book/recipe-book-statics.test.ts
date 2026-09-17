import { recipeBookStatics } from './recipe-book-statics';

describe('recipeBookStatics', () => {
  describe('recipes', () => {
    it("VALID: {recipeBookStatics.recipes} => declares both named recipes whole, with the spec's own produces: text and fidelity", () => {
      expect(recipeBookStatics.recipes).toStrictEqual([
        {
          name: 'guild-with-three-quests',
          produces: 'one guild holding three quests, one in_progress',
          fidelity: 'production',
          mirrors: null,
          parameters: [],
          returns: [
            {
              name: 'guildId',
              description: 'the seeded guild, for a later recipe that stacks onto it',
            },
            {
              name: 'guildSlug',
              description: "the guild's own route segment",
            },
            {
              name: 'questId',
              description:
                'the one quest left in_progress, the one an assertion must tell from the other two',
            },
          ],
        },
        {
          name: 'session-with-nested-subagent',
          produces:
            'one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished',
          fidelity: 'direct',
          mirrors:
            'the Claude CLI session transcript writer — its on-disk location is claudePathSlugEncoderTransformer (the same transformer the server resolves a session through), its line shapes are the stream-line contracts and stubs in @dungeonmaster/shared/contracts, and the reader a drift shows up against is the orchestrator chat replay, which pairs a sub-agent file to its Task by toolUseResult.agentId',
          parameters: [
            {
              name: 'guild',
              description:
                "the guild the transcript is filed under — an earlier recipe's guildId, passed explicitly",
              required: true,
            },
          ],
          returns: [
            {
              name: 'sessionId',
              description: 'the session the outer chain was written as',
            },
            {
              name: 'sessions.outer',
              description: 'the route that renders the outer sub-agent chain',
            },
            {
              name: 'sessions.nested',
              description: 'the route that renders the chain nested inside it',
            },
          ],
        },
      ]);
    });

    it('VALID: {every entry} => carries a distinct name, so a seed step resolves one recipe and never two', () => {
      const names = recipeBookStatics.recipes.map((recipe) => recipe.name);

      expect(names).toStrictEqual([...new Set(names)]);
    });

    it('VALID: {recipeBookStatics.names} => holds exactly the names the entries carry, so the runner and the listing cannot drift', () => {
      expect(recipeBookStatics.names).toStrictEqual({
        guildWithThreeQuests: 'guild-with-three-quests',
        sessionWithNestedSubagent: 'session-with-nested-subagent',
      });
      expect(Object.values(recipeBookStatics.names)).toStrictEqual(
        recipeBookStatics.recipes.map((recipe) => recipe.name),
      );
    });
  });
});
