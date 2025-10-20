import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleRequireZodOnPrimitivesBroker } from './rule-require-zod-on-primitives-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('require-zod-on-primitives', ruleRequireZodOnPrimitivesBroker(), {
  valid: [
    "const schema = z.string().email().brand<'EmailAddress'>()",
    "const schema = z.number().positive().brand<'PositiveNumber'>()",
    "const schema = z.string().brand<'UserName'>()",
    "const schema = z.number().brand<'Age'>()",
    "const schema = z.object({ id: z.string().brand<'UserId'>() })",
    "const schema = z.array(z.string().brand<'Tag'>())",
    "const schema = z.object({ name: z.string().brand<'Name'>(), age: z.number().brand<'Age'>() })",
    "const schema = z.string().min(1).max(100).brand<'LimitedString'>()",
    "const schema = z.number().int().positive().brand<'PositiveInt'>()",

    // Unions with branded primitives
    "const schema = z.union([z.string().brand<'A'>(), z.number().brand<'B'>()])",

    // Tuples with branded primitives
    "const schema = z.tuple([z.string().brand<'First'>(), z.number().brand<'Second'>()])",

    // Records with branded primitives
    "const schema = z.record(z.string().brand<'Key'>(), z.number().brand<'Value'>())",

    // Promises with branded primitives
    "const schema = z.promise(z.string().brand<'AsyncValue'>())",

    // Lazy with branded primitives
    "const schema = z.lazy(() => z.string().brand<'Recursive'>())",

    // Literals (already constrained, no brand needed)
    "const schema = z.literal('hello')",
    'const schema = z.literal(123)',
    'const schema = z.literal(true)',

    // Enums (already constrained, no brand needed)
    "const schema = z.enum(['a', 'b', 'c'])",
    'const schema = z.nativeEnum(MyEnum)',

    // Discriminated unions with branded primitives
    "const schema = z.discriminatedUnion('type', [z.object({ type: z.literal('a'), value: z.string().brand<'ValueA'>() }), z.object({ type: z.literal('b'), value: z.number().brand<'ValueB'>() })])",
  ],
  invalid: [
    {
      code: 'const schema = z.string()',
      errors: [{ messageId: 'requireBrandString' }],
    },
    {
      code: 'const schema = z.number()',
      errors: [{ messageId: 'requireBrandNumber' }],
    },
    {
      code: 'const schema = z.string().email()',
      errors: [{ messageId: 'requireBrandString' }],
    },
    {
      code: 'const schema = z.number().positive()',
      errors: [{ messageId: 'requireBrandNumber' }],
    },
    {
      code: 'const schema = z.string().min(1)',
      errors: [{ messageId: 'requireBrandString' }],
    },
    {
      code: 'const schema = z.number().int()',
      errors: [{ messageId: 'requireBrandNumber' }],
    },
    {
      code: `
        const nameSchema = z.string();
        const ageSchema = z.number();
      `,
      errors: [{ messageId: 'requireBrandString' }, { messageId: 'requireBrandNumber' }],
    },
    {
      code: 'const schema = z.object({ id: z.string(), count: z.number() })',
      errors: [{ messageId: 'requireBrandString' }, { messageId: 'requireBrandNumber' }],
    },
    {
      code: 'const schema = z.array(z.string())',
      errors: [{ messageId: 'requireBrandString' }],
    },
    {
      code: 'const schema = z.string().optional()',
      errors: [{ messageId: 'requireBrandString' }],
    },
    {
      code: 'const schema = z.number().nullable()',
      errors: [{ messageId: 'requireBrandNumber' }],
    },

    // Unions without branding
    {
      code: 'const schema = z.union([z.string(), z.number()])',
      errors: [{ messageId: 'requireBrandString' }, { messageId: 'requireBrandNumber' }],
    },
    {
      code: "const schema = z.union([z.string().brand<'A'>(), z.number()])",
      errors: [{ messageId: 'requireBrandNumber' }],
    },

    // Tuples without branding
    {
      code: 'const schema = z.tuple([z.string(), z.number()])',
      errors: [{ messageId: 'requireBrandString' }, { messageId: 'requireBrandNumber' }],
    },
    {
      code: 'const schema = z.tuple([z.string().email()])',
      errors: [{ messageId: 'requireBrandString' }],
    },

    // Records without branding
    {
      code: 'const schema = z.record(z.string(), z.number())',
      errors: [{ messageId: 'requireBrandString' }, { messageId: 'requireBrandNumber' }],
    },
    {
      code: "const schema = z.record(z.string().brand<'Key'>(), z.number())",
      errors: [{ messageId: 'requireBrandNumber' }],
    },
    {
      code: "const schema = z.record(z.string(), z.number().brand<'Value'>())",
      errors: [{ messageId: 'requireBrandString' }],
    },

    // Promises without branding
    {
      code: 'const schema = z.promise(z.string())',
      errors: [{ messageId: 'requireBrandString' }],
    },
    {
      code: 'const schema = z.promise(z.number().positive())',
      errors: [{ messageId: 'requireBrandNumber' }],
    },

    // Lazy without branding
    {
      code: 'const schema = z.lazy(() => z.string())',
      errors: [{ messageId: 'requireBrandString' }],
    },
    {
      code: 'const schema = z.lazy(() => z.number())',
      errors: [{ messageId: 'requireBrandNumber' }],
    },

    // Default/catch without branding
    {
      code: "const schema = z.string().default('foo')",
      errors: [{ messageId: 'requireBrandString' }],
    },
    {
      code: 'const schema = z.number().catch(0)',
      errors: [{ messageId: 'requireBrandNumber' }],
    },

    // Discriminated unions without branding
    {
      code: "const schema = z.discriminatedUnion('type', [z.object({ type: z.literal('a'), value: z.string() }), z.object({ type: z.literal('b'), value: z.number() })])",
      errors: [{ messageId: 'requireBrandString' }, { messageId: 'requireBrandNumber' }],
    },
  ],
});
