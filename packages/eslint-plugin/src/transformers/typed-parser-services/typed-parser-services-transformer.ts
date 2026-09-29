/**
 * PURPOSE: Resolves a symbol's declaration file through the real TypeScript type checker
 * (`ESLintUtils.getParserServices`, reached via the typescript-eslint utils gateway).
 * `platform-globals-ban` reaches for this to tell which lib or `@types` file declares an
 * identifier, which AST shape alone cannot say. The value side of an object-literal shorthand
 * (`{ fetch }`) resolves to the outer binding it reads, not to the literal's own property.
 *
 * USAGE:
 * const declarationFileName = typedParserServicesTransformer({ context, node });
 * // Returns '/repo/node_modules/@types/node/globals.d.ts', or undefined if the symbol has no
 * // declaration (an unresolved identifier, or one declared in the same file)
 */
import { AST_NODE_TYPES, ESLintUtils } from '#gateway/npm/typescript-eslint__utils';
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
  const esNode = node as TSESTree.Node;
  const { parent } = esNode;
  // The VALUE side of an object-literal shorthand (`{ fetch }`) reads the outer binding, but
  // getSymbolAtLocation resolves both of its positions to the literal's own property. The checker's
  // shorthand lookup returns the outer binding, and returns undefined for a destructuring pattern
  // (`const { fetch } = x`), which falls back to the declared local.
  const shorthandValueSymbol =
    parent?.type === AST_NODE_TYPES.Property && parent.shorthand && parent.value === esNode
      ? services.program
          .getTypeChecker()
          .getShorthandAssignmentValueSymbol(services.esTreeNodeToTSNodeMap.get(parent))
      : undefined;
  const symbol = shorthandValueSymbol ?? services.getSymbolAtLocation(esNode);
  const fileName = symbol?.getDeclarations()?.[0]?.getSourceFile().fileName;
  return fileName === undefined ? undefined : filePathContract.parse(fileName);
};
