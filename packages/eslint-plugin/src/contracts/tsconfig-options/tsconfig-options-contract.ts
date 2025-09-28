import { z } from 'zod';

export const tsconfigOptionsContract = z.object({
  target: z.string().brand<'TsTarget'>().optional(),
  module: z.string().brand<'TsModule'>().optional(),
  lib: z.array(z.string()).optional(),
  strict: z.boolean().optional(),
  noEmit: z.boolean().optional(),
  esModuleInterop: z.boolean().optional(),
  skipLibCheck: z.boolean().optional(),
  forceConsistentCasingInFileNames: z.boolean().optional(),
  resolveJsonModule: z.boolean().optional(),
  moduleResolution: z.string().brand<'ModuleResolution'>().optional(),
  allowJs: z.boolean().optional(),
  checkJs: z.boolean().optional(),
  noUnusedLocals: z.boolean().optional(),
  noUnusedParameters: z.boolean().optional(),
  noImplicitReturns: z.boolean().optional(),
  noFallthroughCasesInSwitch: z.boolean().optional(),
  allowUnreachableCode: z.boolean().optional(),
  noImplicitAny: z.boolean().optional(),
  strictNullChecks: z.boolean().optional(),
  exactOptionalPropertyTypes: z.boolean().optional(),
  noUncheckedIndexedAccess: z.boolean().optional(),
  declaration: z.boolean().optional(),
  declarationMap: z.boolean().optional(),
});

export type TsconfigOptions = z.infer<typeof tsconfigOptionsContract>;
