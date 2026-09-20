import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceHydrationRecipesStructureBroker } from './rule-enforce-hydration-recipes-structure-broker';
import { ruleEnforceHydrationRecipesStructureBrokerProxy } from './rule-enforce-hydration-recipes-structure-broker.proxy';

const ruleTester = eslintRuleTesterAdapter();

beforeEach(() => {
  const proxy = ruleEnforceHydrationRecipesStructureBrokerProxy();

  proxy.setupFileSystem((filePath) => {
    const path = String(filePath);

    if (path.startsWith('/no-hydration-project')) {
      return false;
    }

    if (path === '/missing-structure-project/packages/hydration-recipes') {
      return true;
    }
    if (path.startsWith('/missing-structure-project')) {
      return false;
    }

    const existingFiles = [
      '/project/packages/hydration-recipes',
      '/project/packages/hydration-recipes/src/startup/start-hydration-recipes.ts',
      '/project/packages/hydration-recipes/src/flows/recipes/recipes-flow.ts',
      '/project/packages/hydration-recipes/responders.ts',
      '/project/packages/hydration-recipes/src/responders/recipes/listing/recipes-listing-responder.ts',
      '/project/packages/hydration-recipes/src/responders/recipes/seed/recipes-seed-responder.ts',
    ];

    return existingFiles.includes(path);
  });
});

ruleTester.run(
  'enforce-hydration-recipes-structure',
  ruleEnforceHydrationRecipesStructureBroker(),
  {
    valid: [
      {
        code: "import { startHydrationRecipes } from '@dungeonmaster/hydration-recipes';",
        filename: '/project/packages/siegelense/src/index.ts',
      },
      {
        code: "import { recipesListingResponder } from '@dungeonmaster/hydration-recipes/responders';",
        filename: '/project/packages/siegelense/src/index.ts',
      },
      {
        code: "import { recipeManifestContract } from '@dungeonmaster/hydration-recipes/contracts';",
        filename: '/project/packages/siegelense/src/index.ts',
      },
      {
        code: "export * from './src/responders/recipes/listing/recipes-listing-responder';",
        filename: '/project/packages/hydration-recipes/responders.ts',
      },
      {
        code: "import { recipesListingBuildBroker } from '../../brokers/recipes-listing/recipes-listing-build-broker';",
        filename:
          '/project/packages/hydration-recipes/src/responders/recipes/listing/recipes-listing-responder.ts',
      },
      {
        code: "import { recipesSeedRunBroker } from '../../recipes-seed/run/recipes-seed-run-broker';",
        filename:
          '/project/packages/hydration-recipes/src/brokers/recipes/catalog/recipes-catalog-broker.ts',
      },
      {
        code: "export * from './src/brokers/recipe/run/recipe-run-broker';",
        filename: '/project/packages/hydration-recipes/brokers.ts',
      },
      {
        code: "import { recipesListingResponder } from './responders';",
        filename: '/project/packages/hydration-recipes/index.ts',
      },
      {
        code: "import { foo } from '@dungeonmaster/hydration-recipes/brokers';",
        filename: '/no-hydration-project/packages/siegelense/src/index.ts',
      },
    ],
    invalid: [
      {
        code: "import { foo } from '@dungeonmaster/hydration-recipes/brokers';",
        filename: '/project/packages/siegelense/src/index.ts',
        errors: [{ messageId: 'noBrokerImport' }],
      },
      {
        code: "import { foo } from '@dungeonmaster/hydration-recipes/brokers/catalog';",
        filename: '/project/packages/web/src/index.ts',
        errors: [{ messageId: 'noBrokerImport' }],
      },
      {
        code: "import { recipesCatalogBroker } from './src/brokers/recipes/catalog/recipes-catalog-broker';",
        filename: '/project/packages/hydration-recipes/index.ts',
        errors: [{ messageId: 'noBrokerImport' }],
      },
      {
        code: "import { recipesCatalogBroker } from '../../brokers/recipes/catalog/recipes-catalog-broker';",
        filename: '/project/packages/hydration-recipes/src/flows/recipes/recipes-flow.ts',
        errors: [{ messageId: 'noBrokerImport' }],
      },
      {
        code: "import { foo } from '@dungeonmaster/hydration-recipes/brokers';",
        filename: '/project/packages/hydration-recipes/src/flows/recipes/recipes-flow.ts',
        errors: [{ messageId: 'noBrokerImport' }],
      },
      {
        code: 'export const test = 1;',
        filename: '/missing-structure-project/packages/hydration-recipes/index.ts',
        errors: [
          {
            messageId: 'missingStructure',
            data: { filePath: 'src/startup/start-hydration-recipes.ts' },
          },
          {
            messageId: 'missingStructure',
            data: { filePath: 'src/flows/recipes/recipes-flow.ts' },
          },
          {
            messageId: 'missingStructure',
            data: { filePath: 'responders.ts' },
          },
          {
            messageId: 'missingStructure',
            data: { filePath: 'src/responders/recipes/listing/recipes-listing-responder.ts' },
          },
          {
            messageId: 'missingStructure',
            data: { filePath: 'src/responders/recipes/seed/recipes-seed-responder.ts' },
          },
        ],
      },
    ],
  },
);
