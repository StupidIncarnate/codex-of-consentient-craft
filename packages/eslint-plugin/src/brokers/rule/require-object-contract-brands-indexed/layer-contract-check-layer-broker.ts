/**
 * PURPOSE: The layer half of `require-object-contract-brands-indexed`. A layer contract is its
 * parent's own nested object moved to another file, so its owner is the parent and its brand texts
 * derive from where the parent uses it: the parent's const, the key it sits under, then the layer's
 * own keys. Reports a brand whose text differs, and a contract file other than the parent that nests
 * the layer. Reads the parent's source and the contract index, so it runs in ward's lint pass only.
 * The importer check sees contract files only, since the index records how contracts nest one another.
 *
 * USAGE:
 * layerContractCheckLayerBroker({ context, program, filename });
 * // In quest-owner-layer-contract.ts, reports `.brand<'Owner'>()` and fixes it to `.brand<'QuestOwner'>()`
 * // when quest-contract.ts uses the layer as `owner: questOwnerLayerContract`
 */
import { contractIndexBuildBroker } from '@dungeonmaster/shared/brokers';
import {
  layerFileParentResolveTransformer,
  repoRootFromSourcePathTransformer,
} from '@dungeonmaster/shared/transformers';
import { readFileSyncIfExists } from '#gateway/node/fs';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { zodObjectBrandStatics } from '../../../statics/zod-object-brand/zod-object-brand-statics';
import { astBrandLiteralTransformer } from '../../../transformers/ast-brand-literal/ast-brand-literal-transformer';
import { astBrandPathTransformer } from '../../../transformers/ast-brand-path/ast-brand-path-transformer';
import { astCallMethodNameTransformer } from '../../../transformers/ast-call-method-name/ast-call-method-name-transformer';
import { astCollectNodesTransformer } from '../../../transformers/ast-collect-nodes/ast-collect-nodes-transformer';
import { astLayerParentUseTransformer } from '../../../transformers/ast-layer-parent-use/ast-layer-parent-use-transformer';
import { astProgramDeclaratorsTransformer } from '../../../transformers/ast-program-declarators/ast-program-declarators-transformer';
import { astZodRootMethodTransformer } from '../../../transformers/ast-zod-root-method/ast-zod-root-method-transformer';
import { brandTextDeriveTransformer } from '../../../transformers/brand-text-derive/brand-text-derive-transformer';

export const layerContractCheckLayerBroker = ({
  context,
  program,
  filename,
}: {
  context: TSESLint.RuleContext<string, unknown[]>;
  program: TSESTree.Program;
  filename: string;
}): void => {
  const rootDir = repoRootFromSourcePathTransformer({ filePath: filename });
  const parent = layerFileParentResolveTransformer({
    layerFilePath: filename,
  });
  if (rootDir === undefined || parent === null) {
    return;
  }

  const layerNames = astProgramDeclaratorsTransformer({ program, localOnly: false }).flatMap(
    (declarator) =>
      declarator.id.type === AST_NODE_TYPES.Identifier &&
      declarator.id.name.endsWith('LayerContract')
        ? [declarator.id.name]
        : [],
  );
  const [layerName] = layerNames;
  if (layerName === undefined) {
    return;
  }

  const entry = contractIndexBuildBroker({ rootDir }).find(
    (candidate) => candidate.filePath === filename,
  );
  for (const importer of entry?.nestedInFiles ?? []) {
    if (importer !== parent) {
      context.report({
        node: program,
        messageId: 'layerImportedElsewhere',
        data: { layer: layerName, file: importer, parent },
      });
    }
  }

  const parentSource = readFileSyncIfExists(parent);
  const usePath =
    parentSource === null
      ? null
      : astLayerParentUseTransformer({ source: parentSource, layerName });
  if (usePath === null) {
    return;
  }

  for (const node of astCollectNodesTransformer({
    node: program,
    type: AST_NODE_TYPES.CallExpression,
  })) {
    if (node.type !== AST_NODE_TYPES.CallExpression) {
      continue;
    }
    if (astCallMethodNameTransformer({ node }) !== 'brand') {
      continue;
    }

    const literal = astBrandLiteralTransformer({ node });
    const path = astBrandPathTransformer({ node });
    const [owner, ...keys] = path;
    const root = astZodRootMethodTransformer({ node });
    if (
      literal === null ||
      literal.type !== AST_NODE_TYPES.Literal ||
      typeof literal.value !== 'string' ||
      owner !== layerName ||
      literal.value.startsWith(zodObjectBrandStatics.gateway.brandPrefix) ||
      zodObjectBrandStatics.unbrandableRoots.some((name) => name === root)
    ) {
      continue;
    }

    const expected = brandTextDeriveTransformer({ path: [...usePath, ...keys] });
    if (literal.value !== expected) {
      context.report({
        node,
        messageId: 'layerBrandText',
        data: { layer: layerName, key: usePath.at(-1) ?? layerName, expected },
        fix: (fixer) => fixer.replaceText(literal, `'${expected}'`),
      });
    }
  }
};
