/**
 * PURPOSE: Checks if an assertion casts an object literal to a type imported from a package
 *
 * USAGE:
 * if (isAstOutsideTypeCastGuard({ node: assertionNode, imports })) {
 *   // `{ type: 'CallExpression' } as TSESTree.CallExpression` where TSESTree comes from a package
 * }
 * // Returns false for a cast to never, const, unknown or a locally declared type, and for a clone built only from stub spreads
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import type { Identifier, ModulePath } from '@dungeonmaster/shared/contracts';
import { astCastTargetRootNameTransformer } from '../../transformers/ast-cast-target-root-name/ast-cast-target-root-name-transformer';
import { isAstObjectStubSpreadGuard } from '../is-ast-object-stub-spread/is-ast-object-stub-spread-guard';
import { isNpmPackageImportGuard } from '../is-npm-package-import/is-npm-package-import-guard';

export const isAstOutsideTypeCastGuard = ({
  node,
  imports,
}: {
  node?: TSESTree.Node | null | undefined;
  imports?: Map<Identifier, ModulePath> | undefined;
}): boolean => {
  if (
    imports === undefined ||
    (node?.type !== AST_NODE_TYPES.TSAsExpression && node?.type !== AST_NODE_TYPES.TSTypeAssertion)
  ) {
    return false;
  }

  const rootName = astCastTargetRootNameTransformer({ node: node.typeAnnotation });

  if (rootName === null) {
    return false;
  }

  const importSource = imports.get(rootName);

  if (importSource === undefined || !isNpmPackageImportGuard({ importSource })) {
    return false;
  }

  // Look through `as unknown as` and `<unknown>` chains to the value that was cast
  let value: TSESTree.Node = node.expression;
  while (
    value.type === AST_NODE_TYPES.TSAsExpression ||
    value.type === AST_NODE_TYPES.TSTypeAssertion
  ) {
    value = value.expression;
  }

  if (value.type !== AST_NODE_TYPES.ObjectExpression) {
    return false;
  }

  return !isAstObjectStubSpreadGuard({ node: value });
};
