import { ruleBanNondeterminismInIngredientsBroker } from './rule-ban-nondeterminism-in-ingredients-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

const ingredientFixture = '/repo/packages/hydration-recipes/src/quest/quest-ingredient.ts';
const nonIngredientFixture = '/repo/packages/hydration-recipes/src/quest/quest-broker.ts';
// The REAL shape on disk: `enforce-project-structure` refuses a bare `-ingredient.ts` file, so
// every actual ingredient is named `<name>-ingredient-broker.ts` inside an `ingredient/` folder of
// a `*-recipes` package — see `packages/siegelense-recipes/src/brokers/quest/ingredient/`.
const realRepoIngredientFixture =
  '/repo/packages/siegelense-recipes/src/brokers/quest/ingredient/quest-ingredient-broker.ts';
// A route broker beside a real ingredient, minting a real id — `quest-write-route-broker.ts`'s own
// header documents this exact call as legitimate and out of this rule's scope: same `*-recipes`
// package, but not an `ingredient/` folder and no `ingredient({...})` call of its own.
const recipesRouteBrokerFixture =
  '/repo/packages/siegelense-recipes/src/brokers/quest/write-route/quest-write-route-broker.ts';
// Under NEITHER path convention — only the behavioral signal (calling `ingredient({...})`) can
// catch this one.
const unconventionallyNamedIngredientFixture =
  '/repo/packages/some-other-package/src/brokers/random/random-broker.ts';

ruleTester.run('ban-nondeterminism-in-ingredients', ruleBanNondeterminismInIngredientsBroker(), {
  valid: [
    // === SCOPE: the same call outside an ingredient file is not this rule's business ===
    {
      code: 'Date.now();',
      filename: nonIngredientFixture,
    },
    {
      code: 'Math.random();',
      filename: nonIngredientFixture,
    },
    // === PRECISION: a different property on the same watched object is not banned ===
    {
      code: "Date.parse('2024-01-01');",
      filename: ingredientFixture,
    },
    // === PRECISION: a different object sharing a watched property name is not banned ===
    {
      code: 'myObject.now();',
      filename: ingredientFixture,
    },
    {
      code: 'crypto.getRandomValues(buffer);',
      filename: ingredientFixture,
    },
    // === PRODUCTION: the index-driven default this rule exists to keep sufficient ===
    {
      code: "const defaults = (index) => ({ title: 'Quest ' + (index + 1) });",
      filename: ingredientFixture,
    },
    // === PRODUCTION: the REAL repo path — a `-recipes` package's `ingredient/` folder — doing its
    // actual job ===
    {
      code: "const defaults = (index) => ({ title: 'Quest ' + (index + 1) });",
      filename: realRepoIngredientFixture,
    },
    // === SCOPE: a route broker beside a real ingredient minting a real id with
    // `crypto.randomUUID()` — legitimate per `quest-write-route-broker.ts`'s own header, and out of
    // scope because it neither lives in an `ingredient/` folder nor calls `ingredient({...})` ===
    {
      code: 'crypto.randomUUID();',
      filename: recipesRouteBrokerFixture,
    },
    // === SCOPE: a call to a differently-named function is not the framework's declaration call ===
    {
      code: "Date.now();\nconst broker = dmIngredient({ name: 'quest' });",
      filename: unconventionallyNamedIngredientFixture,
    },
  ],

  invalid: [
    // === Date.now() ===
    {
      code: 'Date.now();',
      filename: ingredientFixture,
      errors: [
        {
          messageId: 'nondeterministicCallInIngredient',
          data: { objectName: 'Date', propertyName: 'now' },
        },
      ],
    },
    // === Math.random() ===
    {
      code: 'Math.random();',
      filename: ingredientFixture,
      errors: [
        {
          messageId: 'nondeterministicCallInIngredient',
          data: { objectName: 'Math', propertyName: 'random' },
        },
      ],
    },
    // === crypto.randomUUID() ===
    {
      code: 'crypto.randomUUID();',
      filename: ingredientFixture,
      errors: [
        {
          messageId: 'nondeterministicCallInIngredient',
          data: { objectName: 'crypto', propertyName: 'randomUUID' },
        },
      ],
    },
    // === crypto.randomUUID() — the exact text a developer sees, checked on its own (RuleTester
    // refuses an error entry that specifies both `message` and `messageId` together, and refuses a
    // duplicate case, so this uses a distinct call producing the identical rendered message) ===
    {
      code: 'const id = crypto.randomUUID();',
      filename: ingredientFixture,
      errors: [
        {
          message:
            "An ingredient must not call `crypto.randomUUID()` — the chain already hands each row its own index, so this is the only way left to break byte-identical output across two runs of the same plan. This rule fires on a file named `<name>-ingredient.ts`/`.tsx`, on this repo's `<name>-ingredient-broker.ts`/`.tsx` inside an `ingredient/` folder of a `*-recipes` package, or on any file that calls the framework's `ingredient(...)` declaration function directly — a destructured import (`import { randomUUID } from 'node:crypto'`), an equivalent call (`new Date()`, `performance.now()`), or an ingredient reached only through a re-exported wrapper that never itself calls `ingredient(...)`, is invisible to it.",
        },
      ],
    },
    // === multiple violations in one file ===
    {
      code: 'Date.now();\nMath.random();',
      filename: ingredientFixture,
      errors: [
        {
          messageId: 'nondeterministicCallInIngredient',
          data: { objectName: 'Date', propertyName: 'now' },
        },
        {
          messageId: 'nondeterministicCallInIngredient',
          data: { objectName: 'Math', propertyName: 'random' },
        },
      ],
    },
    // === REAL REPO PATH: a `<name>-ingredient-broker.ts` file inside an `ingredient/` folder of a
    // `*-recipes` package — the exact shape `packages/siegelense-recipes` uses on disk, invisible
    // to the bare `-ingredient.ts` filename convention alone ===
    {
      code: 'crypto.randomUUID();',
      filename: realRepoIngredientFixture,
      errors: [
        {
          messageId: 'nondeterministicCallInIngredient',
          data: { objectName: 'crypto', propertyName: 'randomUUID' },
        },
      ],
    },
    // === BEHAVIORAL: a file under neither path convention, caught only because it calls the
    // framework's `ingredient({...})` declaration function — and the violation appears BEFORE that
    // call in source order, proving the deferred-reporting still catches it ===
    {
      code: "Date.now();\nconst quest = ingredient({ name: 'quest' });",
      filename: unconventionallyNamedIngredientFixture,
      errors: [
        {
          messageId: 'nondeterministicCallInIngredient',
          data: { objectName: 'Date', propertyName: 'now' },
        },
      ],
    },
  ],
});
