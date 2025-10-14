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
  return {
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
    // Only include sourceCode if explicitly provided, reconstructing to ensure type correctness
    ...(sourceCode
      ? {
          sourceCode: {
            getAncestors: sourceCode.getAncestors ?? ((_node: unknown): unknown[] => []),
          },
        }
      : {}),
  };
};
