import { z } from 'zod';
import { eslintContextContract } from './eslint-context-contract';
import type { EslintContext } from './eslint-context-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

const filenameContract = z.string().brand<'Filename'>();

export const EslintContextStub = ({
  ...props
}: StubArgument<EslintContext> = {}): EslintContext => {
  // Separate function props from data props
  const { report, getFilename, getScope, getSourceCode, sourceCode, ...dataProps } = props;

  // Return: validated data + functions (preserved references)
  const result: EslintContext = {
    // Data properties validated through contract
    ...eslintContextContract.parse({
      filename: filenameContract.parse('/test/file.ts'),
      ...dataProps,
    }),
    // Function properties preserved (not parsed to maintain references)
    report: report ?? ((..._args: unknown[]): unknown => true),
    getFilename:
      getFilename ?? ((): string & z.BRAND<'Filename'> => filenameContract.parse('/test/file.ts')),
    getScope: getScope ?? ((): unknown => ({})),
    getSourceCode: getSourceCode ?? ((): unknown => ({})),
  };

  // Only add sourceCode if provided (it's optional)
  if (sourceCode && 'getAncestors' in sourceCode && typeof sourceCode.getAncestors === 'function') {
    result.sourceCode = sourceCode as { getAncestors: (node: unknown) => unknown[] };
  }

  return result;
};
