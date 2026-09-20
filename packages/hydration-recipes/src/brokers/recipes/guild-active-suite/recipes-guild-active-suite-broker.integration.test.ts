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
});
