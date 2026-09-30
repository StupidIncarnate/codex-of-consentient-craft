/**
 * PURPOSE: Defines the data `kebabCaseVariantsTransformer` returns
 *
 * USAGE:
 * kebabCaseVariantsContract.parse(value);
 * // Returns validated KebabCaseVariants
 */
import { z } from '#gateway/npm/zod';

export const kebabCaseVariantsContract = z
  .object({
    camel: z.string().brand<'KebabCaseVariantsCamel'>(),
    pascal: z.string().brand<'KebabCaseVariantsPascal'>(),
    testId: z.string().brand<'KebabCaseVariantsTestId'>(),
  })
  .brand<'KebabCaseVariants'>();

export type KebabCaseVariants = z.infer<typeof kebabCaseVariantsContract>;
