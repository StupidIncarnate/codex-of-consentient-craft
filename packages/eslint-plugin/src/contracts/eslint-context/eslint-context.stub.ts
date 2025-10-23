import { z } from 'zod';
import { eslintContextContract } from './eslint-context-contract';
import type { EslintContext, EslintScope, EslintSourceCode } from './eslint-context-contract';
import type { StubArgument } from '@questmaestro/shared/@types';
import { identifierContract } from '@questmaestro/shared/contracts';

const filenameContract = z.string().brand<'Filename'>();
const sourceTextContract = z.string().brand<'SourceText'>();

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
    report: report ?? ((): void => undefined),
    getFilename:
      getFilename ?? ((): string & z.BRAND<'Filename'> => filenameContract.parse('/test/file.ts')),
    getScope:
      getScope ??
      ((): EslintScope => ({
        type: identifierContract.parse('global'),
        variables: [],
      })),
    getSourceCode:
      getSourceCode ??
      ((): EslintSourceCode => ({
        text: sourceTextContract.parse(''),
        ast: {},
        getAncestors: (_node) => [],
      })),
    // sourceCode property with same structure as getSourceCode return
    sourceCode: sourceCode
      ? ({
          text: sourceCode.text ?? sourceTextContract.parse(''),
          ast: sourceCode.ast ?? {},
          getAncestors: sourceCode.getAncestors ?? ((_node) => []),
        } as EslintSourceCode)
      : ({
          text: sourceTextContract.parse(''),
          ast: {},
          getAncestors: (_node) => [],
        } as EslintSourceCode),
  };
};
