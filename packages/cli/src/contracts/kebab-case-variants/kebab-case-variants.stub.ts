/**
 * PURPOSE: Builds a valid KebabCaseVariants for tests
 *
 * USAGE:
 * KebabCaseVariantsStub();
 * // Returns a valid KebabCaseVariants
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { kebabCaseVariantsContract } from './kebab-case-variants-contract';
import type { KebabCaseVariants } from './kebab-case-variants-contract';

export const KebabCaseVariantsStub = ({
  ...props
}: StubArgument<KebabCaseVariants> = {}): KebabCaseVariants =>
  kebabCaseVariantsContract.parse({
    camel: 'sample',
    pascal: 'sample',
    testId: 'sample',
    ...props,
  });
