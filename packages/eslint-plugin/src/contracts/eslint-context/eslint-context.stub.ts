import { z } from 'zod';
import { eslintContextContract } from './eslint-context-contract';
import type { EslintContext, EslintScope, EslintSourceCode } from './eslint-context-contract';
import type { StubArgument } from '@questmaestro/shared/@types';
import { identifierContract } from '@questmaestro/shared/contracts';

const filenameContract = z.string().brand<'Filename'>();
const sourceTextContract = z.string().brand<'SourceText'>();

const createDefaultSourceCode = (): EslintSourceCode => ({
  text: sourceTextContract.parse(''),
  ast: {},
  getAncestors: (_node) => [],
  getAllComments: () => [],
  getText: () => '',
});

const createSourceCodeWithOverrides = (overrides?: {
  text?: string;
  ast?: unknown;
  getAncestors?: EslintSourceCode['getAncestors'];
  getAllComments?: EslintSourceCode['getAllComments'];
  getText?: EslintSourceCode['getText'];
}): EslintSourceCode => {
  const defaults = createDefaultSourceCode();
  if (!overrides) {
    return defaults;
  }
  return {
    text: overrides.text ? sourceTextContract.parse(overrides.text) : defaults.text,
    ast: overrides.ast ?? defaults.ast,
    getAncestors: overrides.getAncestors ?? defaults.getAncestors,
    getAllComments: overrides.getAllComments ?? defaults.getAllComments,
    getText: overrides.getText ?? defaults.getText,
  };
};

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
    getSourceCode: getSourceCode ?? ((): EslintSourceCode => createDefaultSourceCode()),
    // sourceCode property with same structure as getSourceCode return
    sourceCode: createSourceCodeWithOverrides(sourceCode),
  };
};
