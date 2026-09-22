import { RecipesSeedResponderProxy } from './recipes-seed-responder.proxy';

const UNUSED_HOME = '/tmp/recipes-seed-responder-unused';

describe('RecipesSeedResponder', () => {
  describe('delegation with unknown recipe', () => {
    it('INVALID: {recipeName: "no-such-recipe"} => throws listing known recipes', async () => {
      const proxy = RecipesSeedResponderProxy();

      await expect(
        proxy.callResponder({
          recipeName: 'no-such-recipe',
          home: UNUSED_HOME,
        }),
      ).rejects.toThrow(
        /^recipesSeedRunBroker: unknown recipe 'no-such-recipe' — known recipes: guild-empty, guild-with-three-quests, guild-mid-execution, quest-advances-one-step, quest-completed, session-single-turn, session-with-nested-chain, guild-active-suite, session-with-nested-subagent$/u,
      );
    });
  });

  describe('delegation with params on paramless recipe', () => {
    it('INVALID: {recipeName: "guild-mid-execution", params: {extra: 1}} => throws takes no params', async () => {
      const proxy = RecipesSeedResponderProxy();

      await expect(
        proxy.callResponder({
          recipeName: 'guild-mid-execution',
          params: { extra: 1 },
          home: UNUSED_HOME,
        }),
      ).rejects.toThrow(
        /^recipesSeedRunBroker: recipe 'guild-mid-execution' takes no params, got: extra$/u,
      );
    });
  });

  describe('delegation with invalid params on parameterized recipe', () => {
    it('INVALID: {recipeName: "quest-advances-one-step", params: {guildId: "not-a-uuid"}} => throws refused params', async () => {
      const proxy = RecipesSeedResponderProxy();

      await expect(
        proxy.callResponder({
          recipeName: 'quest-advances-one-step',
          params: { guildId: 'not-a-uuid' },
          home: UNUSED_HOME,
        }),
      ).rejects.toThrow(
        /^recipesSeedRunBroker: recipe 'quest-advances-one-step' refused params — [\s\S]*guildId[\s\S]* — this recipe takes: guildId$/u,
      );
    });
  });

  describe('delegation with missing required params on parameterized recipe', () => {
    it('INVALID: {recipeName: "session-with-nested-chain", params: undefined} => throws missing params error', async () => {
      const proxy = RecipesSeedResponderProxy();

      await expect(
        proxy.callResponder({
          recipeName: 'session-with-nested-chain',
          home: UNUSED_HOME,
        }),
      ).rejects.toThrow(
        /^recipesSeedRunBroker: recipe 'session-with-nested-chain' refused params — [\s\S]*guildPath[\s\S]* — this recipe takes: guildPath$/u,
      );
    });
  });
});
