/**
 * PURPOSE: Resolves a symbol's declaration file through the real TypeScript type checker
 * (`ESLintUtils.getParserServices`, reached via the typescript-eslint utils gateway).
 * `platform-globals-ban` reaches for this to tell which lib or `@types` file declares an
 * identifier, which AST shape alone cannot say.
 *
 * USAGE:
 * const declarationFileName = typedParserServicesTransformer({ context, node });
 * // Returns '/repo/node_modules/@types/node/globals.d.ts', or undefined if the symbol has no
 * // declaration (an unresolved identifier, or one declared in the same file)
 */
import { ESLintUtils } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { filePathContract, type FilePath } from '@dungeonmaster/shared/contracts';

export const typedParserServicesTransformer = ({
  context,
  node,
}: {
  context: unknown;
  node: unknown;
}): FilePath | undefined => {
  // `never` in place of the library's own `MessageIds extends string` type parameter: this transformer
  // never reads a message id off the context, only its parser services, so the constraint needs no
  // concrete string literal type — and `never` still satisfies "extends string".
  const services = ESLintUtils.getParserServices(
    context as Readonly<TSESLint.RuleContext<never, never[]>>,
  );
  const symbol = services.getSymbolAtLocation(node as TSESTree.Node);
  const fileName = symbol?.getDeclarations()?.[0]?.getSourceFile().fileName;
  return fileName === undefined ? undefined : filePathContract.parse(fileName);
};
