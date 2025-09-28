import { z } from 'zod';

export const eslintContextContract = z.object({
  report: z.function(),
  getFilename: z.function().returns(z.string().brand<'Filename'>()).optional(),
  getScope: z.function().optional(),
  getSourceCode: z.function().optional(),
});

export type EslintContext = z.infer<typeof eslintContextContract>;
