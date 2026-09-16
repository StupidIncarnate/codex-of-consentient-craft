import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';

import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { RecipeInputKeyStub } from '../../../contracts/recipe-input-key/recipe-input-key.stub';
import { RecipeListingEntryStub } from '../../../contracts/recipe-listing-entry/recipe-listing-entry.stub';
import { RecipeNameStub } from '../../../contracts/recipe-name/recipe-name.stub';
import { StepStub } from '../../../contracts/step/step.stub';

import { stepSeedBroker } from './step-seed-broker';
import { stepSeedBrokerProxy } from './step-seed-broker.proxy';

describe('stepSeedBroker', () => {
  describe('a paramless recipe seeded against a live lane', () => {
    it('VALID: {guild-mid-execution} => calls the seed entry with the lane home and base URL, and returns the seeded record map', async () => {
      const proxy = stepSeedBrokerProxy();
      proxy.stagesListing({
        listing: [
          RecipeListingEntryStub({ recipeName: RecipeNameStub({ value: 'guild-mid-execution' }) }),
        ],
      });
      const seedRun = proxy.stagesSeedRun({ result: { guild: { id: 'g1', urlSlug: 'guild-1' } } });
      const lane = LaneSessionStub({
        homePath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-seed-lane' }),
        baseUrl: ContentTextStub({ value: 'http://127.0.0.1:40410' }),
      });
      const step = StepStub({
        step: 'seed',
        recipe: RecipeNameStub({ value: 'guild-mid-execution' }),
      });

      const reading = await stepSeedBroker({ lane, step });

      expect(JSON.parse(reading)).toStrictEqual({ guild: { id: 'g1', urlSlug: 'guild-1' } });
      expect(seedRun.getCallArgs()).toStrictEqual([
        [
          {
            recipeName: 'guild-mid-execution',
            params: null,
            home: '/tmp/dm-siege-seed-lane',
            baseUrl: 'http://127.0.0.1:40410',
          },
        ],
      ]);
    });
  });

  describe('a browserless lane', () => {
    it('VALID: {lane.browser: null} => the seed still runs, proving it is not a browser verb', async () => {
      const proxy = stepSeedBrokerProxy();
      proxy.stagesListing({
        listing: [
          RecipeListingEntryStub({ recipeName: RecipeNameStub({ value: 'guild-mid-execution' }) }),
        ],
      });
      proxy.stagesSeedRun({ result: { guild: { id: 'g1' } } });
      const lane = LaneSessionStub({ browser: null });
      const step = StepStub({
        step: 'seed',
        recipe: RecipeNameStub({ value: 'guild-mid-execution' }),
      });

      const reading = await stepSeedBroker({ lane, step });

      expect(JSON.parse(reading)).toStrictEqual({ guild: { id: 'g1' } });
    });
  });

  describe('an unknown recipe', () => {
    it('INVALID: {recipe: "nope"} => throws RecipeUnknownError listing the recipes the listing holds', async () => {
      const proxy = stepSeedBrokerProxy();
      proxy.stagesListing({
        listing: [
          RecipeListingEntryStub({ recipeName: RecipeNameStub({ value: 'guild-mid-execution' }) }),
        ],
      });
      const lane = LaneSessionStub();
      const step = StepStub({ step: 'seed', recipe: RecipeNameStub({ value: 'nope' }) });

      const error = await stepSeedBroker({ lane, step }).then(
        (): never => {
          throw new Error('Expected stepSeedBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeUnknownError',
        message: 'Unknown recipe "nope". Known recipes: guild-mid-execution.',
      });
    });
  });

  describe('params on a paramless recipe', () => {
    it('INVALID: {recipe takes none, params: {x}} => throws RecipeParamsRefusedError, never reaching the seed entry', async () => {
      const proxy = stepSeedBrokerProxy();
      proxy.stagesListing({
        listing: [
          RecipeListingEntryStub({ recipeName: RecipeNameStub({ value: 'guild-mid-execution' }) }),
        ],
      });
      const seedRun = proxy.stagesSeedRun({ result: {} });
      const lane = LaneSessionStub();
      const step = StepStub({
        step: 'seed',
        recipe: RecipeNameStub({ value: 'guild-mid-execution' }),
        params: { x: 1 },
      });

      const error = await stepSeedBroker({ lane, step }).then(
        (): never => {
          throw new Error('Expected stepSeedBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({
        name: error.name,
        message: error.message,
        seedRunCallArgs: seedRun.getCallArgs(),
      }).toStrictEqual({
        name: 'RecipeParamsRefusedError',
        message:
          'Recipe "guild-mid-execution" does not accept the param "x". This recipe takes no params.',
        seedRunCallArgs: [],
      });
    });
  });

  describe('a params key the listing does not name', () => {
    it('INVALID: {recipe takes guildPath, params: {wrong}} => throws RecipeParamsRefusedError naming the key and the accepted keys', async () => {
      const proxy = stepSeedBrokerProxy();
      proxy.stagesListing({
        listing: [
          RecipeListingEntryStub({
            recipeName: RecipeNameStub({ value: 'session-with-nested-chain' }),
            inputKeys: [RecipeInputKeyStub({ value: 'guildPath' })],
          }),
        ],
      });
      proxy.stagesSeedRun({ result: {} });
      const lane = LaneSessionStub();
      const step = StepStub({
        step: 'seed',
        recipe: RecipeNameStub({ value: 'session-with-nested-chain' }),
        params: { wrong: 1 },
      });

      const error = await stepSeedBroker({ lane, step }).then(
        (): never => {
          throw new Error('Expected stepSeedBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeParamsRefusedError',
        message:
          'Recipe "session-with-nested-chain" does not accept the param "wrong". Accepted params: guildPath.',
      });
    });
  });

  describe('a missing declared param', () => {
    it('INVALID: {recipe requires guildPath, params: null} => throws RecipeParamsRefusedError naming the missing key, before the seed entry is imported', async () => {
      const proxy = stepSeedBrokerProxy();
      proxy.stagesListing({
        listing: [
          RecipeListingEntryStub({
            recipeName: RecipeNameStub({ value: 'session-with-nested-chain' }),
            inputKeys: [RecipeInputKeyStub({ value: 'guildPath' })],
          }),
        ],
      });
      const seedRun = proxy.stagesSeedRun({ result: {} });
      const lane = LaneSessionStub();
      const step = StepStub({
        step: 'seed',
        recipe: RecipeNameStub({ value: 'session-with-nested-chain' }),
      });

      const error = await stepSeedBroker({ lane, step }).then(
        (): never => {
          throw new Error('Expected stepSeedBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({
        name: error.name,
        message: error.message,
        seedRunCallArgs: seedRun.getCallArgs(),
      }).toStrictEqual({
        name: 'RecipeParamsRefusedError',
        message:
          'Recipe "session-with-nested-chain" requires the param "guildPath", which was not supplied. Accepted params: guildPath.',
        seedRunCallArgs: [],
      });
    });
  });

  describe('a malformed param value', () => {
    it("INVALID: {recipe requires guildPath, params: {guildPath: 123}} => propagates the recipe's own schema refusal uncaught", async () => {
      const proxy = stepSeedBrokerProxy();
      proxy.stagesListing({
        listing: [
          RecipeListingEntryStub({
            recipeName: RecipeNameStub({ value: 'session-with-nested-chain' }),
            inputKeys: [RecipeInputKeyStub({ value: 'guildPath' })],
          }),
        ],
      });
      proxy.stagesSeedRunThrows({
        error: new Error(
          "recipesSeedRunBroker: recipe 'session-with-nested-chain' refused params — guildPath: Expected string, received number — this recipe takes: guildPath",
        ),
      });
      const lane = LaneSessionStub();
      const step = StepStub({
        step: 'seed',
        recipe: RecipeNameStub({ value: 'session-with-nested-chain' }),
        params: { guildPath: 123 },
      });

      const error = await stepSeedBroker({ lane, step }).then(
        (): never => {
          throw new Error('Expected stepSeedBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.message).toBe(
        "recipesSeedRunBroker: recipe 'session-with-nested-chain' refused params — guildPath: Expected string, received number — this recipe takes: guildPath",
      );
    });
  });
});
