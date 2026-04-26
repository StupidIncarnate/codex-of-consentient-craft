import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleRequireValidationOnUntypedPropertyAccessBroker } from './rule-require-validation-on-untyped-property-access-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run(
  'require-validation-on-untyped-property-access',
  ruleRequireValidationOnUntypedPropertyAccessBroker(),
  {
    valid: [
      // Inline parse chain — accessing properties on contract.parse(...) result is fine
      {
        code: 'const out = userContract.parse(input).name;',
        filename: '/project/src/transformers/format/format-transformer.ts',
      },
      // Inline safeParse chain via .data
      {
        code: 'const out = userContract.safeParse(input).data.name;',
        filename: '/project/src/transformers/format/format-transformer.ts',
      },
      // Same-block alias for member access
      {
        code: 'function f(input) { const v = userContract.parse(input); return v.name; }',
        filename: '/project/src/transformers/format/format-transformer.ts',
      },
      // Reflect.get on inline parse chain
      {
        code: 'const out = Reflect.get(userContract.parse(input), "name");',
        filename: '/project/src/transformers/format/format-transformer.ts',
      },
      // Reflect.get on same-block aliased parsed value
      {
        code: 'function f(input) { const parsed = userContract.parse(input); return Reflect.get(parsed, "name"); }',
        filename: '/project/src/transformers/format/format-transformer.ts',
      },
      // Reflect.get inside *-guard.ts file is allowed
      {
        code: 'export const isFooGuard = (x) => Reflect.get(x, "name");',
        filename: '/project/src/guards/is-foo/is-foo-guard.ts',
      },
      // Reflect.get inside *-contract.ts is allowed
      {
        code: 'const refined = (x) => Reflect.get(x, "name");',
        filename: '/project/src/contracts/foo/foo-contract.ts',
      },
      // Reflect.get inside *-adapter.ts is allowed
      {
        code: 'export const fooAdapter = (x) => Reflect.get(x, "name");',
        filename: '/project/src/adapters/foo/foo-adapter.ts',
      },
      // Reflect.get inside *.stub.ts is allowed
      {
        code: 'export const FooStub = (x) => Reflect.get(x, "name");',
        filename: '/project/src/contracts/foo/foo.stub.ts',
      },
      // Bracket access is never inspected (rule only fires on Reflect.get and JSON.parse member access)
      {
        code: 'const v = obj[key];',
        filename: '/project/src/transformers/format/format-transformer.ts',
      },
      // Member access on non-JSON.parse identifier with no JSON.parse initializer should not fire
      {
        code: 'function f(parsedThing) { return parsedThing.name; }',
        filename: '/project/src/transformers/format/format-transformer.ts',
      },
      // JSON.parse wrapped through contract.parse is fine — outer .field is on parse(...).field
      {
        code: 'const out = userContract.parse(JSON.parse(s)).name;',
        filename: '/project/src/transformers/format/format-transformer.ts',
      },
    ],
    invalid: [
      // Reflect.get on a plain identifier in a transformer — flagged
      {
        code: 'export const fooTransformer = (x) => Reflect.get(x, "name");',
        filename: '/project/src/transformers/foo/foo-transformer.ts',
        errors: [{ messageId: 'reflectGetWithoutValidation' }],
      },
      // Reflect.get on identifier whose initializer is not a parse call
      {
        code: 'function f(input) { const v = input; return Reflect.get(v, "name"); }',
        filename: '/project/src/transformers/foo/foo-transformer.ts',
        errors: [{ messageId: 'reflectGetWithoutValidation' }],
      },
      // Direct JSON.parse(...).field
      {
        code: 'const v = JSON.parse(s).field;',
        filename: '/project/src/transformers/foo/foo-transformer.ts',
        errors: [{ messageId: 'jsonParseWithoutValidation' }],
      },
      // Same-block alias to JSON.parse, then .field
      {
        code: 'function f(s) { const x = JSON.parse(s); return x.field; }',
        filename: '/project/src/transformers/foo/foo-transformer.ts',
        errors: [{ messageId: 'jsonParseWithoutValidation' }],
      },
    ],
  },
);
