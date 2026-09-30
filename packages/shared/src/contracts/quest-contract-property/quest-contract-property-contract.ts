/**
 * PURPOSE: Defines the recursive QuestContractProperty schema for describing contract properties with nested structure
 *
 * USAGE:
 * questContractPropertyContract.parse({name: 'email', type: 'EmailAddress', description: 'User email'});
 * // Returns: QuestContractProperty object with branded fields
 */

import { z } from '#gateway/npm/zod';

const questContractPropertyFields = z.object({
  name: z
    .string()
    .min(1)
    .brand<'QuestContractPropertyName'>()
    .describe('The property name in the contract (e.g., "email", "method", "path")'),
  type: z
    .string()
    .min(1)
    .refine(
      (value) => !/^(string|number)$/iu.test(value),
      'Type must be a branded type reference (e.g., "EmailAddress", "UserId"), not a raw primitive like "string" or "number"',
    )
    .brand<'QuestContractPropertyType'>()
    .describe(
      'Branded type reference (e.g., "EmailAddress", "UserId"). Must NOT be raw primitives like "string" or "number"',
    ),
  value: z
    .string()
    .brand<'QuestContractPropertyValue'>()
    .optional()
    .describe(
      'Literal value for this property (e.g., "POST", "/api/auth/login"). Use for endpoint methods, paths, and other fixed values',
    ),
  description: z
    .string()
    .brand<'QuestContractPropertyDescription'>()
    .describe('Human-readable description giving AI context about this property'),
  optional: z
    .boolean()
    .optional()
    .describe('Whether this property is optional in the contract. Omit for required properties'),
  source: z
    .string()
    .min(1)
    .brand<'QuestContractPropertySource'>()
    .optional()
    .describe(
      "File path this ONE property lands in, when it is not the contract's own source. Omit it whenever the property lives in the contract's file — the routing falls back to that. Set it when the contract spans packages: the derived implementation ledger routes a contract to a package by resolving a path, so a property whose file lives in another package otherwise reaches no session at all. Set it on a TOP-LEVEL property only; a nested property describes a field inside its parent and lives in the parent's file.",
    ),
});

type QuestContractPropertySelf = z.infer<typeof questContractPropertyFields> & {
  properties?: QuestContractPropertySelf[] | undefined;
} & z.$brand<'QuestContractProperty'>;

// A getter, not `z.lazy` + a cast — the getter's return type wraps `z.core.$ZodType`, which is
// the only self-reference form `contracts/` allows (zod v4 dropped the old `z.ZodTypeDef` type
// param `z.lazy` needed here).
export const questContractPropertyContract = z
  .object({
    ...questContractPropertyFields.shape,
    get properties(): z.ZodOptional<z.ZodArray<z.core.$ZodType<QuestContractPropertySelf>>> {
      return z.array(questContractPropertyContract).optional();
    },
  })
  .brand<'QuestContractProperty'>();

export type QuestContractProperty = z.infer<typeof questContractPropertyContract>;
