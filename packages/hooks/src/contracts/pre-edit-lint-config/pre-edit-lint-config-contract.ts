import { z } from 'zod';
import { ruleConfigContract } from '../rule-config/rule-config-contract';

export const preEditLintConfigContract = z.object({
  rules: z.array(z.union([z.string().min(1).brand<'Rule'>(), ruleConfigContract])),
});

export type PreEditLintConfig = z.infer<typeof preEditLintConfigContract>;
