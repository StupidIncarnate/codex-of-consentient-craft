/**
 * PURPOSE: Defines the recursive QuestContractProperty schema for describing contract properties with nested structure
 *
 * USAGE:
 * questContractPropertyContract.parse({name: 'email', type: 'EmailAddress', description: 'User email'});
 * // Returns: QuestContractProperty object with branded fields
 */

import { z } from 'zod';

const baseQuestContractPropertyContract = z.object({
  name: z
    .string()
    .min(1)
    .brand<'PropertyName'>()
    .describe('The property name in the contract (e.g., "email", "method", "path")'),
  type: z
    .string()
    .min(1)
    .brand<'TypeReference'>()
    .optional()
    .describe(
      'Branded type reference (e.g., "EmailAddress", "UserId"). Must NOT be raw primitives like "string" or "number"',
    ),
  value: z
    .string()
    .brand<'PropertyValue'>()
    .optional()
    .describe(
      'Literal value for this property (e.g., "POST", "/api/auth/login"). Use for endpoint methods, paths, and other fixed values',
    ),
  description: z
    .string()
    .brand<'PropertyDescription'>()
    .optional()
    .describe('Human-readable description giving AI context about this property'),
  optional: z
    .boolean()
    .optional()
    .describe('Whether this property is optional in the contract. Omit for required properties'),
});

export type QuestContractProperty = z.infer<typeof baseQuestContractPropertyContract> & {
  properties?: QuestContractProperty[] | undefined;
};

type QuestContractPropertyInput = z.input<typeof baseQuestContractPropertyContract> & {
  properties?: QuestContractPropertyInput[] | undefined;
};

export const questContractPropertyContract: z.ZodType<
  QuestContractProperty,
  z.ZodTypeDef,
  QuestContractPropertyInput
> = baseQuestContractPropertyContract.extend({
  properties: z.lazy(() => z.array(questContractPropertyContract)).optional(),
}) as unknown as z.ZodType<QuestContractProperty, z.ZodTypeDef, QuestContractPropertyInput>;
