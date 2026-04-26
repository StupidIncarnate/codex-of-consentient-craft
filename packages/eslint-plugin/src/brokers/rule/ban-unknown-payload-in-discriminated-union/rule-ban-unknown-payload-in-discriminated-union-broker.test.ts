import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleBanUnknownPayloadInDiscriminatedUnionBroker } from './rule-ban-unknown-payload-in-discriminated-union-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run(
  'ban-unknown-payload-in-discriminated-union',
  ruleBanUnknownPayloadInDiscriminatedUnionBroker(),
  {
    valid: [
      // Discriminated union with fully typed payload — no unknown
      {
        code: `
          import { z } from 'zod';
          export const c = z.discriminatedUnion('type', [
            z.object({ type: z.literal('a'), payload: z.string() }),
            z.object({ type: z.literal('b'), payload: z.number() }),
          ]);
        `,
      },

      // Carve-out: property suffixed with `Raw` is exempt
      {
        code: `
          import { z } from 'zod';
          export const c = z.discriminatedUnion('type', [
            z.object({ type: z.literal('a'), payloadRaw: z.unknown() }),
          ]);
        `,
      },

      // Carve-out: `Raw`-suffixed field with z.record(*, z.unknown())
      {
        code: `
          import { z } from 'zod';
          export const c = z.discriminatedUnion('type', [
            z.object({ type: z.literal('a'), metaRaw: z.record(z.string(), z.unknown()) }),
          ]);
        `,
      },

      // z.unknown() outside any discriminatedUnion — does NOT fire
      {
        code: `
          import { z } from 'zod';
          export const looseSchema = z.object({ payload: z.unknown() });
          export const looseRecord = z.record(z.string(), z.unknown());
        `,
      },

      // z.unknown() inside a plain z.union (not discriminatedUnion) — does NOT fire
      {
        code: `
          import { z } from 'zod';
          export const c = z.union([
            z.object({ type: z.literal('a'), payload: z.unknown() }),
          ]);
        `,
      },

      // discriminatedUnion with non-object variant (e.g., a reference) — ignored, no false positive
      {
        code: `
          import { z } from 'zod';
          const variantA = z.object({ type: z.literal('a'), payload: z.string() });
          export const c = z.discriminatedUnion('type', [variantA]);
        `,
      },

      // Identifier-bound z.string() referenced in a variant — does NOT fire
      {
        code: `
          import { z } from 'zod';
          const namedSchema = z.string();
          export const c = z.discriminatedUnion('type', [
            z.object({ type: z.literal('a'), payload: namedSchema }),
          ]);
        `,
      },

      // Identifier-bound z.unknown() referenced via Raw-suffixed property — exempt
      {
        code: `
          import { z } from 'zod';
          const looseSchema = z.unknown();
          export const c = z.discriminatedUnion('type', [
            z.object({ type: z.literal('a'), payloadRaw: looseSchema }),
          ]);
        `,
      },
    ],
    invalid: [
      // Direct z.unknown() in a discriminatedUnion variant
      {
        code: `
          import { z } from 'zod';
          export const c = z.discriminatedUnion('type', [
            z.object({ type: z.literal('a'), payload: z.unknown() }),
          ]);
        `,
        errors: [{ messageId: 'banUnknownPayload' }],
      },

      // z.record(*, z.unknown()) in a discriminatedUnion variant
      {
        code: `
          import { z } from 'zod';
          export const c = z.discriminatedUnion('type', [
            z.object({
              type: z.literal('a'),
              payload: z.record(z.string().brand('PayloadKey'), z.unknown()),
            }),
          ]);
        `,
        errors: [{ messageId: 'banUnknownRecordPayload' }],
      },

      // Multiple variants, multiple offending fields
      {
        code: `
          import { z } from 'zod';
          export const c = z.discriminatedUnion('type', [
            z.object({ type: z.literal('a'), payload: z.unknown() }),
            z.object({ type: z.literal('b'), data: z.record(z.string(), z.unknown()) }),
          ]);
        `,
        errors: [{ messageId: 'banUnknownPayload' }, { messageId: 'banUnknownRecordPayload' }],
      },

      // Mixed: one Raw-suffixed (exempt) + one un-suffixed (flagged)
      {
        code: `
          import { z } from 'zod';
          export const c = z.discriminatedUnion('type', [
            z.object({
              type: z.literal('a'),
              payloadRaw: z.unknown(),
              extra: z.unknown(),
            }),
          ]);
        `,
        errors: [{ messageId: 'banUnknownPayload' }],
      },

      // String-literal property key with z.unknown() value
      {
        code: `
          import { z } from 'zod';
          export const c = z.discriminatedUnion('type', [
            z.object({ type: z.literal('a'), 'payload': z.unknown() }),
          ]);
        `,
        errors: [{ messageId: 'banUnknownPayload' }],
      },

      // Identifier-bound z.record(brand, z.unknown()) referenced in a variant — fires
      // (mirrors packages/shared/src/contracts/ws-message/ws-message-contract.ts shape)
      {
        code: `
          import { z } from 'zod';
          const genericPayloadSchema = z.record(z.string().brand('PayloadKey'), z.unknown());
          export const c = z.discriminatedUnion('type', [
            z.object({ type: z.literal('fallback'), payload: genericPayloadSchema }),
          ]);
        `,
        errors: [{ messageId: 'banUnknownRecordPayload' }],
      },

      // Identifier-bound bare z.unknown() referenced in a variant — fires
      {
        code: `
          import { z } from 'zod';
          const looseSchema = z.unknown();
          export const c = z.discriminatedUnion('type', [
            z.object({ type: z.literal('a'), payload: looseSchema }),
          ]);
        `,
        errors: [{ messageId: 'banUnknownPayload' }],
      },
    ],
  },
);
