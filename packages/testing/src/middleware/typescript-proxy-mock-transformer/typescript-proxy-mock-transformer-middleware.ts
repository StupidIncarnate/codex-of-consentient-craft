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

import { typescriptAstToProxyImportsAdapter } from '../../adapters/typescript/ast-to-proxy-imports/typescript-ast-to-proxy-imports-adapter';
import { typescriptMockCallsToStatementsAdapter } from '../../adapters/typescript/mock-calls-to-statements/typescript-mock-calls-to-statements-adapter';
import { typescriptSourceFileWithPrependedStatementsAdapter } from '../../adapters/typescript/source-file-with-prepended-statements/typescript-source-file-with-prepended-statements-adapter';
import { importPathResolverMiddleware } from '../import-path-resolver/import-path-resolver-middleware';
import { proxyMockCollectorMiddleware } from '../proxy-mock-collector/proxy-mock-collector-middleware';
import { filePathContract } from '../../contracts/file-path/file-path-contract';
import type { TypescriptProgram } from '../../contracts/typescript-program/typescript-program-contract';
import type { TypescriptSourceFile } from '../../contracts/typescript-source-file/typescript-source-file-contract';
import type { TypescriptNodeFactory } from '../../contracts/typescript-node-factory/typescript-node-factory-contract';
import type { MockCall } from '../../contracts/mock-call/mock-call-contract';
import type { ModuleName } from '../../contracts/module-name/module-name-contract';

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

  const proxyImports = typescriptAstToProxyImportsAdapter({ sourceFile });

  for (const proxyImport of proxyImports) {
    const sourceFilePath = filePathContract.parse(sourceFile.fileName);
    const proxyPath = importPathResolverMiddleware({
      sourceFilePath,
      importPath: proxyImport,
    });
    if (proxyPath) {
      const mocks = proxyMockCollectorMiddleware({
        proxyFilePath: proxyPath,
        program,
      });
      mockCalls.push(...mocks);
    }
  }

  if (mockCalls.length === 0) {
    return sourceFile;
  }

  // Deduplicate mocks by module name. When both an auto-mock and a factory-mock exist
  // for the same module, the factory-mock wins because it preserves real exports and only
  // replaces specific functions. Auto-mocking a barrel (e.g., @dungeonmaster/shared/adapters)
  // breaks all callers that depend on real implementations of other exports.
  const mocksByModule = new Map<ModuleName, MockCall>();
  for (const mock of mockCalls) {
    const existing = mocksByModule.get(mock.moduleName);
    // Keep the mock with a factory, or the first occurrence if neither has a factory
    if (!existing || (mock.factory && !existing.factory)) {
      mocksByModule.set(mock.moduleName, mock);
    }
  }
  const deduplicatedMocks = [...mocksByModule.values()];

  const mockStatements = typescriptMockCallsToStatementsAdapter({
    mockCalls: deduplicatedMocks,
    nodeFactory,
  });

  return typescriptSourceFileWithPrependedStatementsAdapter({
    sourceFile,
    statements: mockStatements,
    nodeFactory,
  });
};
