import { ruleBanReflectOutsideGuardsBroker } from './rule-ban-reflect-outside-guards-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-reflect-outside-guards', ruleBanReflectOutsideGuardsBroker(), {
  valid: [
    // --- Reflect.get inside *-guard.ts is allowed ---
    {
      code: 'const v = Reflect.get(obj, "k");',
      filename: '/project/src/guards/is-foo/is-foo-guard.ts',
    },
    // --- Reflect.set inside *-guard.ts is allowed ---
    {
      code: 'Reflect.set(obj, "k", 1);',
      filename: '/project/src/guards/is-foo/is-foo-guard.ts',
    },
    // --- Reflect.get inside *-contract.ts is allowed ---
    {
      code: 'const v = Reflect.get(obj, "k");',
      filename: '/project/src/contracts/foo/foo-contract.ts',
    },
    // --- Reflect.set inside *-contract.ts is allowed ---
    {
      code: 'Reflect.set(obj, "k", 1);',
      filename: '/project/src/contracts/foo/foo-contract.ts',
    },

    // --- Reflect.deleteProperty is allowed everywhere ---
    {
      code: 'Reflect.deleteProperty(obj, "k");',
      filename: '/project/src/brokers/foo/foo-broker.ts',
    },
    {
      code: 'Reflect.deleteProperty(obj, "k");',
      filename: '/project/src/transformers/foo/foo-transformer.ts',
    },

    // --- Other Reflect methods are not banned (only get/set are) ---
    {
      code: 'Reflect.has(obj, "k");',
      filename: '/project/src/brokers/foo/foo-broker.ts',
    },
    {
      code: 'Reflect.ownKeys(obj);',
      filename: '/project/src/brokers/foo/foo-broker.ts',
    },

    // --- Plain property access is unaffected ---
    {
      code: 'const v = obj.k;',
      filename: '/project/src/brokers/foo/foo-broker.ts',
    },

    // --- Different identifier named .get / .set is not Reflect ---
    {
      code: 'map.get("k");',
      filename: '/project/src/brokers/foo/foo-broker.ts',
    },
    {
      code: 'map.set("k", 1);',
      filename: '/project/src/brokers/foo/foo-broker.ts',
    },
  ],

  invalid: [
    // --- Reflect.get inside a broker fires ---
    {
      code: 'const v = Reflect.get(obj, "k");',
      filename: '/project/src/brokers/foo/foo-broker.ts',
      errors: [{ messageId: 'banReflectOutsideGuards' }],
    },
    // --- Reflect.set inside a transformer fires ---
    {
      code: 'Reflect.set(obj, "k", 1);',
      filename: '/project/src/transformers/foo/foo-transformer.ts',
      errors: [{ messageId: 'banReflectOutsideGuards' }],
    },
    // --- Reflect.get inside a responder fires ---
    {
      code: 'const v = Reflect.get(obj, "k");',
      filename: '/project/src/responders/foo/foo-responder.ts',
      errors: [{ messageId: 'banReflectOutsideGuards' }],
    },
    // --- Reflect.get inside a proxy fires ---
    {
      code: 'const v = Reflect.get(obj, "k");',
      filename: '/project/src/brokers/foo/foo-broker.proxy.ts',
      errors: [{ messageId: 'banReflectOutsideGuards' }],
    },
    // --- Both Reflect.get and Reflect.set in the same file fire twice ---
    {
      code: 'Reflect.set(obj, "k", 1); const v = Reflect.get(obj, "k");',
      filename: '/project/src/brokers/foo/foo-broker.ts',
      errors: [{ messageId: 'banReflectOutsideGuards' }, { messageId: 'banReflectOutsideGuards' }],
    },
  ],
});
