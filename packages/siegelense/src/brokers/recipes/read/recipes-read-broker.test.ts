import { recipesConventionStatics } from '@dungeonmaster/shared/statics';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { recipesReadBroker } from './recipes-read-broker';
import { recipesReadBrokerProxy } from './recipes-read-broker.proxy';
import { RecipeListingEntryStub } from '../../../contracts/recipe-listing-entry/recipe-listing-entry.stub';
import { RecipeNameStub } from '../../../contracts/recipe-name/recipe-name.stub';
import { RecipesListingExportInvalidError } from '../../../errors/recipes-listing-export-invalid/recipes-listing-export-invalid-error';

const ENTRY_PATH = '/repo/packages/siegelense-recipes/dist/index.js';

const MISSING_RUNS_ZOD_MESSAGE =
  '[\n  {\n    "code": "invalid_type",\n    "expected": "object",\n    "received": "undefined",\n    "path": [\n      0,\n      "runs"\n    ],\n    "message": "Required"\n  }\n]';

describe('recipesReadBroker', () => {
  describe('a well-formed listing', () => {
    it('VALID: {a module exporting a listing of two recipes} => returns both entries complete', async () => {
      const proxy = recipesReadBrokerProxy();
      const entryA = RecipeListingEntryStub({
        recipeName: RecipeNameStub({ value: 'guild-mid-execution' }),
      });
      const entryB = RecipeListingEntryStub({
        recipeName: RecipeNameStub({ value: 'quest-advances-one-step' }),
      });

      proxy.setupModule({
        entryPath: FilePathStub({ value: ENTRY_PATH }),
        moduleExports: { [recipesConventionStatics.exports.listingBuild]: () => [entryA, entryB] },
      });

      const result = await recipesReadBroker();

      expect(result).toStrictEqual([entryA, entryB]);
    });
  });

  describe('a built package declaring no recipes', () => {
    it('EMPTY: {a module whose listing returns []} => returns [] rather than throwing', async () => {
      const proxy = recipesReadBrokerProxy();

      proxy.setupModule({
        entryPath: FilePathStub({ value: ENTRY_PATH }),
        moduleExports: { [recipesConventionStatics.exports.listingBuild]: () => [] },
      });

      const result = await recipesReadBroker();

      expect(result).toStrictEqual([]);
    });
  });

  describe('the module carries no listing export', () => {
    it('ERROR: {a module with no listing export} => throws naming the export the convention requires', async () => {
      const proxy = recipesReadBrokerProxy();

      proxy.setupModule({
        entryPath: FilePathStub({ value: ENTRY_PATH }),
        moduleExports: {},
      });

      await expect(recipesReadBroker()).rejects.toStrictEqual(
        new RecipesListingExportInvalidError({
          entryPath: ENTRY_PATH,
          exportName: recipesConventionStatics.exports.listingBuild,
          found: 'undefined',
        }),
      );
    });
  });

  describe('the listing export is not a function', () => {
    it('ERROR: {the listing export is a string} => throws naming what it found', async () => {
      const proxy = recipesReadBrokerProxy();

      proxy.setupModule({
        entryPath: FilePathStub({ value: ENTRY_PATH }),
        moduleExports: { [recipesConventionStatics.exports.listingBuild]: 'not-a-function' },
      });

      await expect(recipesReadBroker()).rejects.toStrictEqual(
        new RecipesListingExportInvalidError({
          entryPath: ENTRY_PATH,
          exportName: recipesConventionStatics.exports.listingBuild,
          found: 'string',
        }),
      );
    });
  });

  describe('an entry fails its own contract', () => {
    it("INVALID: {an entry missing runs} => throws with the contract's own message", async () => {
      const proxy = recipesReadBrokerProxy();

      proxy.setupModule({
        entryPath: FilePathStub({ value: ENTRY_PATH }),
        moduleExports: {
          [recipesConventionStatics.exports.listingBuild]: () => [
            {
              recipeName: 'guild-mid-execution',
              description: 'one guild holding three quests',
              inputKeys: [],
              makes: [{ ingredient: 'guild', count: 1 }],
            },
          ],
        },
      });

      await expect(recipesReadBroker()).rejects.toThrow(MISSING_RUNS_ZOD_MESSAGE);
    });
  });
});
