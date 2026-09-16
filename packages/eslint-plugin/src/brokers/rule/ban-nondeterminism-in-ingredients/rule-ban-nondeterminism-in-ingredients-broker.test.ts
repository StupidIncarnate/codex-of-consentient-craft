import { ruleBanNondeterminismInIngredientsBroker } from './rule-ban-nondeterminism-in-ingredients-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

const ingredientFixture = '/repo/packages/hydration-recipes/src/quest/quest-ingredient.ts';
const nonIngredientFixture = '/repo/packages/hydration-recipes/src/quest/quest-broker.ts';

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
            "An ingredient must not call `crypto.randomUUID()` — the chain already hands each row its own index, so this is the only way left to break byte-identical output across two runs of the same plan. This rule only fires on a file named `<name>-ingredient.ts` or `.tsx`, and only on this exact global call — a destructured import (`import { randomUUID } from 'node:crypto'`) or an equivalent call (`new Date()`, `performance.now()`) is invisible to it.",
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
  ],
});
