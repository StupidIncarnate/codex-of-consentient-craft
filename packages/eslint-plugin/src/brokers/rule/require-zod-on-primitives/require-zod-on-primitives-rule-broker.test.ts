import { createEslintRuleTester } from '../../../../test/helpers/eslint-rule-tester';
import { requireZodOnPrimitivesRuleBroker } from './require-zod-on-primitives-rule-broker';

const ruleTester = createEslintRuleTester();

ruleTester.run('require-zod-on-primitives', requireZodOnPrimitivesRuleBroker(), {
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
  ],
});
