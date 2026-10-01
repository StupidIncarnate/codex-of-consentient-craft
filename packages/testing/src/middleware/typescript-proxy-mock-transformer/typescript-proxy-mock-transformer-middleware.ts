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

import { mockCallsToStatementsTransformer } from '../../transformers/mock-calls-to-statements/mock-calls-to-statements-transformer';
import { sourceFilePrependStatementsTransformer } from '../../transformers/source-file-prepend-statements/source-file-prepend-statements-transformer';
import { proxyMockCallsCollectMiddleware } from '../proxy-mock-calls-collect/proxy-mock-calls-collect-middleware';
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
  const mockCalls = proxyMockCallsCollectMiddleware({ sourceFile, program });

  if (mockCalls.length === 0) {
    return sourceFile;
  }

  const mockStatements = mockCallsToStatementsTransformer({
    mockCalls,
    nodeFactory,
  });

  return sourceFilePrependStatementsTransformer({
    sourceFile,
    statements: mockStatements,
    nodeFactory,
  });
};
