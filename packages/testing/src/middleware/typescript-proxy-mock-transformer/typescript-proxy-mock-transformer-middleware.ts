/**
 * PURPOSE: Orchestrates the TypeScript AST transformation to hoist jest.mock() calls from proxy files
 *
 * USAGE:
 * const transformedSourceFile = typescriptProxyMockTransformerMiddleware({
 *   sourceFile,
 *   program,
 *   nodeFactory
 * });
 * // Returns transformed source file with hoisted jest.mock() calls
 */

import { astProxyImportsTransformer } from '../../transformers/ast-proxy-imports/ast-proxy-imports-transformer';
import { mockCallsToStatementsTransformer } from '../../transformers/mock-calls-to-statements/mock-calls-to-statements-transformer';
import { sourceFilePrependStatementsTransformer } from '../../transformers/source-file-prepend-statements/source-file-prepend-statements-transformer';
import { importPathResolverMiddleware } from '../import-path-resolver/import-path-resolver-middleware';
import { proxyMockCollectorMiddleware } from '../proxy-mock-collector/proxy-mock-collector-middleware';
import { mockCallsMergeByModuleTransformer } from '../../transformers/mock-calls-merge-by-module/mock-calls-merge-by-module-transformer';
import type { MockCall } from '../../contracts/mock-call/mock-call-contract';
import type * as ts from '#gateway/npm/typescript';

export const typescriptProxyMockTransformerMiddleware = ({
  sourceFile,
  program,
  nodeFactory,
}: {
  sourceFile: ts.SourceFile;
  program: ts.Program | undefined;
  nodeFactory: ts.NodeFactory;
}): ts.SourceFile => {
  const mockCalls: MockCall[] = [];

  const proxyEdges = astProxyImportsTransformer({ sourceFile });

  for (const edge of proxyEdges) {
    const sourceFilePath = sourceFile.fileName;
    const proxyPath = importPathResolverMiddleware({
      sourceFilePath,
      importPath: edge.importPath,
    });
    if (proxyPath) {
      const mocks = proxyMockCollectorMiddleware({
        proxyFilePath: proxyPath,
        program,
        requestedNames: edge.names,
      });
      mockCalls.push(...mocks);
    }
  }

  if (mockCalls.length === 0) {
    return sourceFile;
  }

  const deduplicatedMocks = mockCallsMergeByModuleTransformer({ mockCalls });

  const mockStatements = mockCallsToStatementsTransformer({
    mockCalls: deduplicatedMocks,
    nodeFactory,
  });

  return sourceFilePrependStatementsTransformer({
    sourceFile,
    statements: mockStatements,
    nodeFactory,
  });
};
