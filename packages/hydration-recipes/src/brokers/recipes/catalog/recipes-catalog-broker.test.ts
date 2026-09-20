import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { recipesCatalogBroker } from './recipes-catalog-broker';
import { recipesCatalogBrokerProxy } from './recipes-catalog-broker.proxy';

describe('recipesCatalogBroker', () => {
  describe('catalog entries', () => {
    it('VALID: {} => returns 3 registered recipes in catalog', () => {
      recipesCatalogBrokerProxy();

      const entries = recipesCatalogBroker();

      expect(entries.map((entry) => entry.recipeName)).toStrictEqual([
        'guild-mid-execution',
        'quest-advances-one-step',
        'session-with-nested-chain',
      ]);
    });
  });

  describe('guild-mid-execution entry', () => {
    it('VALID: probeListing() => returns serverless runs, makes and empty inputKeys', () => {
      recipesCatalogBrokerProxy();

      const entry = recipesCatalogBroker().find(
        (candidate) => candidate.recipeName === 'guild-mid-execution',
      );

      expect(entry?.probeListing()).toStrictEqual({
        runs: { serverless: true },
        makes: [
          { ingredient: 'guild', count: 1 },
          { ingredient: 'quest', count: 3 },
          { ingredient: 'operation', count: 'varies' },
        ],
        inputKeys: [],
      });
    });

    it('INVALID: execute({ params: { extra: "param" } }) => throws takes no params error', async () => {
      recipesCatalogBrokerProxy();

      const entry = recipesCatalogBroker().find(
        (candidate) => candidate.recipeName === 'guild-mid-execution',
      );

      await expect(
        entry?.execute({
          params: { extra: 'param' },
          target: DmTargetStub(),
        }),
      ).rejects.toThrow(/recipe 'guild-mid-execution' takes no params, got: extra/u);
    });
  });

  describe('quest-advances-one-step entry', () => {
    it('VALID: probeListing() => returns serverless runs, makes and guildId inputKey', () => {
      recipesCatalogBrokerProxy();

      const entry = recipesCatalogBroker().find(
        (candidate) => candidate.recipeName === 'quest-advances-one-step',
      );

      expect({
        hasInputs: entry?.inputs !== undefined,
        listing: entry?.probeListing(),
      }).toStrictEqual({
        hasInputs: true,
        listing: {
          runs: { serverless: true },
          makes: [{ ingredient: 'quest', count: 1 }],
          inputKeys: ['guildId'],
        },
      });
    });

    it('INVALID: execute({ params: {} }) => throws refused params error', async () => {
      recipesCatalogBrokerProxy();

      const entry = recipesCatalogBroker().find(
        (candidate) => candidate.recipeName === 'quest-advances-one-step',
      );

      await expect(
        entry?.execute({
          params: {},
          target: DmTargetStub(),
        }),
      ).rejects.toThrow(/recipe 'quest-advances-one-step' refused params/u);
    });
  });

  describe('session-with-nested-chain entry', () => {
    it('VALID: probeListing() => returns serverless runs, makes and guildPath inputKey', () => {
      recipesCatalogBrokerProxy();

      const entry = recipesCatalogBroker().find(
        (candidate) => candidate.recipeName === 'session-with-nested-chain',
      );

      expect({
        hasInputs: entry?.inputs !== undefined,
        listing: entry?.probeListing(),
      }).toStrictEqual({
        hasInputs: true,
        listing: {
          runs: { serverless: true },
          makes: [{ ingredient: 'session', count: 1 }],
          inputKeys: ['guildPath'],
        },
      });
    });

    it('INVALID: execute({ params: {} }) => throws refused params error', async () => {
      recipesCatalogBrokerProxy();

      const entry = recipesCatalogBroker().find(
        (candidate) => candidate.recipeName === 'session-with-nested-chain',
      );

      await expect(
        entry?.execute({
          params: {},
          target: DmTargetStub(),
        }),
      ).rejects.toThrow(/recipe 'session-with-nested-chain' refused params/u);
    });
  });

  describe('a broken probe', () => {
    it('INVALID: {corrupted probe} => probeListing() throws error naming recipe', () => {
      const proxy = recipesCatalogBrokerProxy();
      proxy.corruptQuestAdvancesOneStepProbe();

      const entry = recipesCatalogBroker().find(
        (candidate) => candidate.recipeName === 'quest-advances-one-step',
      );

      expect(() => entry?.probeListing()).toThrow(
        /^recipe 'quest-advances-one-step': its listing probe no longer satisfies its own inputs contract/u,
      );
    });
  });
});
