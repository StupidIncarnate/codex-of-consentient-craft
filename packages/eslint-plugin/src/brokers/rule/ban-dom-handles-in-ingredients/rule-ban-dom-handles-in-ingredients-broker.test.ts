import { ruleBanDomHandlesInIngredientsBroker } from './rule-ban-dom-handles-in-ingredients-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

const ingredientFixture = '/repo/packages/hydration-recipes/src/quest/quest-ingredient.ts';
const ingredientTsxFixture = '/repo/packages/hydration-recipes/src/quest/quest-ingredient.tsx';
const nonIngredientFixture = '/repo/packages/web/src/flows/quest/quest-flow.e2e.ts';
// The REAL shape on disk: `enforce-project-structure` refuses a bare `-ingredient.ts` file, so
// every actual ingredient is named `<name>-ingredient-broker.ts` inside an `ingredient/` folder of
// a `*-recipes` package — see `packages/siegelense-recipes/src/brokers/quest/ingredient/`.
const realRepoIngredientFixture =
  '/repo/packages/siegelense-recipes/src/brokers/quest/ingredient/quest-ingredient-broker.ts';
// A route broker beside a real ingredient: same `*-recipes` package, but not an `ingredient/`
// folder and not calling `ingredient({...})` itself — must stay out of scope.
const recipesRouteBrokerFixture =
  '/repo/packages/siegelense-recipes/src/brokers/quest/write-route/quest-write-route-broker.ts';
// Under NEITHER path convention — only the behavioral signal (calling `ingredient({...})`) can
// catch this one.
const unconventionallyNamedIngredientFixture =
  '/repo/packages/some-other-package/src/brokers/random/random-broker.ts';

ruleTester.run('ban-dom-handles-in-ingredients', ruleBanDomHandlesInIngredientsBroker(), {
  valid: [
    // === SCOPE: the same DOM usage outside an ingredient file is not this rule's business ===
    {
      code: "page.locator('button').click();",
      filename: nonIngredientFixture,
    },
    {
      code: 'useRef(null);',
      filename: nonIngredientFixture,
    },
    {
      code: "import React from 'react';",
      filename: nonIngredientFixture,
    },
    // === PRODUCTION: an ingredient doing its actual job — files and APIs, no UI ===
    {
      code: "export const questIngredient = ingredient({ name: 'quest' });",
      filename: ingredientFixture,
    },
    // === PRODUCTION: the REAL repo path — a `-recipes` package's `ingredient/` folder — doing its
    // actual job, no UI ===
    {
      code: "export const questIngredientBroker = ingredient({ name: 'quest' });",
      filename: realRepoIngredientFixture,
    },
    {
      code: "import { ingredient } from '@dungeonmaster/hydration';",
      filename: ingredientFixture,
    },
    // === PRECISION: a property named like a watched member, never called, is data not a handle ===
    {
      code: "const config = { locator: 'quest' };",
      filename: ingredientFixture,
    },
    {
      code: 'const value = someRecord.locator;',
      filename: ingredientFixture,
    },
    // === SCOPE: a route broker beside a real ingredient — same `*-recipes` package, but not an
    // `ingredient/` folder and no `ingredient({...})` call of its own — stays out of scope ===
    {
      code: "import React from 'react';",
      filename: recipesRouteBrokerFixture,
    },
    // === SCOPE: a call to a differently-named function is not the framework's declaration call ===
    {
      code: "import React from 'react';\nconst broker = dmIngredient({ name: 'quest' });",
      filename: unconventionallyNamedIngredientFixture,
    },
  ],

  invalid: [
    // === SELECTOR: a Playwright locator call ===
    {
      code: "page.locator('button').click();",
      filename: ingredientFixture,
      errors: [
        {
          messageId: 'domHandleInIngredient',
          data: { detail: 'a DOM selector call (`.locator(...)`)' },
        },
      ],
    },
    // === SELECTOR: a testid query ===
    {
      code: "page.getByTestId('submit');",
      filename: ingredientFixture,
      errors: [
        {
          messageId: 'domHandleInIngredient',
          data: { detail: 'a DOM selector call (`.getByTestId(...)`)' },
        },
      ],
    },
    // === POSITION: a bounding box read ===
    {
      code: 'element.getBoundingClientRect();',
      filename: ingredientFixture,
      errors: [
        {
          messageId: 'domHandleInIngredient',
          data: { detail: 'a DOM position call (`.getBoundingClientRect(...)`)' },
        },
      ],
    },
    // === POSITION: Playwright's own bounding box call ===
    {
      code: 'element.boundingBox();',
      filename: ingredientFixture,
      errors: [
        {
          messageId: 'domHandleInIngredient',
          data: { detail: 'a DOM position call (`.boundingBox(...)`)' },
        },
      ],
    },
    // === REF: React's hook form ===
    {
      code: 'useRef(null);',
      filename: ingredientFixture,
      errors: [
        { messageId: 'domHandleInIngredient', data: { detail: 'a DOM ref (`useRef(...)`)' } },
      ],
    },
    // === REF: the exact text a developer sees, checked on its own (RuleTester refuses an error
    // entry that specifies both `message` and `messageId` together, and refuses a duplicate case,
    // so this uses a distinct call producing the identical rendered message) ===
    {
      code: 'const ref = useRef(undefined);',
      filename: ingredientFixture,
      errors: [
        {
          message:
            "An ingredient touches STATE, never a screen, so it must not hold a DOM ref (`useRef(...)`). The moment an ingredient knows about the UI it has become a walk. This rule fires on a file named `<name>-ingredient.ts`/`.tsx`, on this repo's `<name>-ingredient-broker.ts`/`.tsx` inside an `ingredient/` folder of a `*-recipes` package, or on any file that calls the framework's `ingredient(...)` declaration function directly — an ingredient reached only through a re-exported wrapper that never itself calls `ingredient(...)`, under none of those names or locations, is invisible to it.",
        },
      ],
    },
    // === REF: React's imperative form ===
    {
      code: 'createRef();',
      filename: ingredientFixture,
      errors: [
        { messageId: 'domHandleInIngredient', data: { detail: 'a DOM ref (`createRef(...)`)' } },
      ],
    },
    // === IMPORT: pulling in React at all is the violation ===
    {
      code: "import React from 'react';",
      filename: ingredientFixture,
      errors: [
        {
          messageId: 'domHandleInIngredient',
          data: { detail: 'an import of `react`, a UI-driving package' },
        },
      ],
    },
    // === IMPORT: pulling in Playwright at all is the violation ===
    {
      code: "import { test } from '@playwright/test';",
      filename: ingredientFixture,
      errors: [
        {
          messageId: 'domHandleInIngredient',
          data: { detail: 'an import of `@playwright/test`, a UI-driving package' },
        },
      ],
    },
    // === JSX: markup that renders a screen, in a .tsx ingredient file ===
    {
      code: 'const el = <div />;',
      filename: ingredientTsxFixture,
      errors: [
        {
          messageId: 'domHandleInIngredient',
          data: { detail: 'JSX markup, which renders a screen' },
        },
      ],
    },
    // === REAL REPO PATH: a `<name>-ingredient-broker.ts` file inside an `ingredient/` folder of a
    // `*-recipes` package — the exact shape `packages/siegelense-recipes` uses on disk, invisible
    // to the bare `-ingredient.ts` filename convention alone ===
    {
      code: "page.locator('button').click();",
      filename: realRepoIngredientFixture,
      errors: [
        {
          messageId: 'domHandleInIngredient',
          data: { detail: 'a DOM selector call (`.locator(...)`)' },
        },
      ],
    },
    // === BEHAVIORAL: a file under neither path convention, caught only because it calls the
    // framework's `ingredient({...})` declaration function — and the violation appears BEFORE that
    // call in source order, proving the deferred-reporting still catches it ===
    {
      code: "import React from 'react';\nconst quest = ingredient({ name: 'quest' });",
      filename: unconventionallyNamedIngredientFixture,
      errors: [
        {
          messageId: 'domHandleInIngredient',
          data: { detail: 'an import of `react`, a UI-driving package' },
        },
      ],
    },
  ],
});
