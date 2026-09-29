/**
 * PURPOSE: Reports one import or `export ... from` node of a production file that reaches a stub or a proxy, by its specifier or, for a workspace or relative module, by the name it pulls in. An npm package's own `createProxy` is not ours, so its names are never checked.
 *
 * USAGE:
 * reportTestSupportLayerBroker({ node, context, verb: 'imported' });
 * // Returns true when it reported
 */
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isNpmPackageGuard } from '../../../guards/is-npm-package/is-npm-package-guard';
import { isStubOrProxyImportGuard } from '../../../guards/is-stub-or-proxy-import/is-stub-or-proxy-import-guard';
import { isStubOrProxyNameGuard } from '../../../guards/is-stub-or-proxy-name/is-stub-or-proxy-name-guard';

export const reportTestSupportLayerBroker = ({
  node,
  context,
  verb,
}: {
  node:
    TSESTree.ExportAllDeclaration | TSESTree.ExportNamedDeclaration | TSESTree.ImportDeclaration;
  context: TSESLint.RuleContext<string, unknown[]>;
  verb: 'imported' | 'exported';
}): boolean => {
  const source = node.source?.value;

  if (typeof source !== 'string') {
    return false;
  }

  if (isStubOrProxyImportGuard({ importSource: source })) {
    context.report({
      node,
      messageId: 'testSupportInProduction',
      data: { what: source, verb },
    });
    return true;
  }

  if (isNpmPackageGuard({ importSource: source })) {
    return false;
  }

  const specifiers = 'specifiers' in node ? node.specifiers : [];
  const offending = specifiers.flatMap((specifier) => {
    const reference = 'imported' in specifier ? specifier.imported : specifier.local;
    const name = 'name' in reference ? reference.name : undefined;
    return isStubOrProxyNameGuard({ name }) ? [{ specifier, name }] : [];
  });

  for (const { specifier, name } of offending) {
    context.report({
      node: specifier,
      messageId: 'testSupportInProduction',
      data: { what: String(name), verb },
    });
  }

  return offending.length > 0;
};
