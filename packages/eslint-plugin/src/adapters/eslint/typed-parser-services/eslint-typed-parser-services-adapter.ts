/**
 * PURPOSE: Wraps `@typescript-eslint/utils`'s `ESLintUtils.getParserServices`, the one way a rule
 * broker reaches the real TypeScript type checker. Brokers may never import an npm package
 * directly (only `adapters/` may), so `platform-globals-ban` resolves a symbol's declaration file
 * through this adapter instead of importing `@typescript-eslint/utils` itself.
 *
 * USAGE:
 * const declarationFileName = eslintTypedParserServicesAdapter({ context, node });
 * // Returns '/repo/node_modules/@types/node/globals.d.ts', or undefined if the symbol has no
 * // declaration (an unresolved identifier, or one declared in the same file)
 */
import { ESLintUtils } from '@typescript-eslint/utils';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { filePathContract, type FilePath } from '@dungeonmaster/shared/contracts';

export const eslintTypedParserServicesAdapter = ({
  context,
  node,
}: {
  context: unknown;
  node: unknown;
}): FilePath | undefined => {
  // `never` in place of the library's own `MessageIds extends string` type parameter: this adapter
  // never reads a message id off the context, only its parser services, so the constraint needs no
  // concrete string literal type — and `never` still satisfies "extends string".
  const services = ESLintUtils.getParserServices(
    context as Readonly<TSESLint.RuleContext<never, never[]>>,
  );
  const symbol = services.getSymbolAtLocation(node as TSESTree.Node);
  const fileName = symbol?.getDeclarations()?.[0]?.getSourceFile().fileName;
  return fileName === undefined ? undefined : filePathContract.parse(fileName);
};
