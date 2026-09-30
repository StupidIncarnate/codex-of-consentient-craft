/**
 * PURPOSE: Reports an object literal cast to a type imported from a package (the outside-type-cast check of enforce-stub-usage)
 *
 * USAGE:
 * outsideTypeCastReportLayerBroker({ node, imports, context });
 * // Reports messageId `outsideTypeCast` when node is `{ ... } as TSESTree.CallExpression` and TSESTree is imported from a package
 */
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import type { ModulePath } from '@dungeonmaster/shared/contracts';
import { isAstOutsideTypeCastGuard } from '../../../guards/is-ast-outside-type-cast/is-ast-outside-type-cast-guard';
import { astCastTargetRootNameTransformer } from '../../../transformers/ast-cast-target-root-name/ast-cast-target-root-name-transformer';

export const outsideTypeCastReportLayerBroker = ({
  node,
  imports,
  context,
}: {
  node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion;
  imports: Map<string, ModulePath>;
  context: TSESLint.RuleContext<string, unknown[]>;
}): void => {
  if (!isAstOutsideTypeCastGuard({ node, imports })) {
    return;
  }

  const typeName = astCastTargetRootNameTransformer({ node: node.typeAnnotation });

  context.report({
    node,
    messageId: 'outsideTypeCast',
    data: { typeName: String(typeName) },
  });
};
