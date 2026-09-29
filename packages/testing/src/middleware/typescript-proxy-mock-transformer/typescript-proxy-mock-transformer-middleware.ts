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
import { filePathContract } from '../../contracts/file-path/file-path-contract';
import type { TypescriptProgram } from '../../contracts/typescript-program/typescript-program-contract';
import type { TypescriptSourceFile } from '../../contracts/typescript-source-file/typescript-source-file-contract';
import type { TypescriptNodeFactory } from '../../contracts/typescript-node-factory/typescript-node-factory-contract';
import type { MockCall } from '../../contracts/mock-call/mock-call-contract';

export const typescriptProxyMockTransformerMiddleware = ({
  sourceFile,
  program,
  nodeFactory,
}: {
  sourceFile: TypescriptSourceFile;
  program: TypescriptProgram;
  nodeFactory: TypescriptNodeFactory;
}): TypescriptSourceFile => {
  const mockCalls: MockCall[] = [];

  const proxyEdges = astProxyImportsTransformer({ sourceFile });

  for (const edge of proxyEdges) {
    const sourceFilePath = filePathContract.parse(sourceFile.fileName);
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
