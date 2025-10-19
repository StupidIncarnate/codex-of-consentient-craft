import { z } from 'zod';

export const eslintRulesContract = z.record(
  z.union([z.literal('off'), z.literal('warn'), z.literal('error'), z.array(z.unknown())]),
);

export type EslintRules = z.infer<typeof eslintRulesContract>;
