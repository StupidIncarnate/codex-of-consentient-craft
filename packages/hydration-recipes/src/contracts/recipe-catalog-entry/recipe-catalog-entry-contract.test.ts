import { recipeCatalogEntryContract } from './recipe-catalog-entry-contract';
import { RecipeCatalogEntryStub } from './recipe-catalog-entry.stub';

type RecipeCatalogEntry = ReturnType<typeof RecipeCatalogEntryStub>;

describe('recipeCatalogEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {recipeName, description} => parses successfully', () => {
      const result = recipeCatalogEntryContract.parse({
        recipeName: 'guild-with-three-quests',
        description: 'one guild holding three quests',
      });

      expect(result).toStrictEqual({
        recipeName: 'guild-with-three-quests',
        description: 'one guild holding three quests',
      });
    });

    it('VALID: {stub with defaults} => creates valid RecipeCatalogEntry', async () => {
      const stub: RecipeCatalogEntry = RecipeCatalogEntryStub();

      expect({
        recipeName: stub.recipeName,
        description: stub.description,
      }).toStrictEqual({
        recipeName: 'guild-with-three-quests',
        description: 'one guild holding three quests',
      });

      const listing = stub.probeListing();

      expect(listing).toStrictEqual({
        runs: { serverless: true },
        makes: [],
        inputKeys: [],
      });

      const result = await stub.execute({
        target: {
          home: '/tmp/dm-target' as never,
          claudeHome: '/tmp/dm-target' as never,
        },
      });

      expect(result).toStrictEqual({});
    });

    it('VALID: {stub with overrides} => preserves custom probeListing and execute', () => {
      const customListing = () => ({
        runs: { serverless: true as const },
        makes: [],
        inputKeys: [],
      });
      const customExecute = async () => Promise.resolve({});

      const stub = RecipeCatalogEntryStub({
        recipeName: 'guild-with-three-quests',
        probeListing: customListing,
        execute: customExecute,
      });

      expect({
        recipeName: stub.recipeName,
        probeListing: stub.probeListing,
        execute: stub.execute,
      }).toStrictEqual({
        recipeName: 'guild-with-three-quests',
        probeListing: customListing,
        execute: customExecute,
      });
    });
  });

  describe('invalid entries', () => {
    it('INVALID: {recipeName: ""} => throws "at least 1"', () => {
      expect(() =>
        recipeCatalogEntryContract.parse({
          recipeName: '',
          description: 'one guild',
        }),
      ).toThrow(/at least 1/u);
    });

    it('INVALID: {description: ""} => throws "at least 1"', () => {
      expect(() =>
        recipeCatalogEntryContract.parse({
          recipeName: 'guild-mid-execution',
          description: '',
        }),
      ).toThrow(/at least 1/u);
    });

    it('EMPTY: {} => throws "Required"', () => {
      expect(() => recipeCatalogEntryContract.parse({})).toThrow(/Required/u);
    });
  });
});
