/**
 * PURPOSE: Recursively collects jest.mock() calls from a proxy file and its dependencies
 *
 * USAGE:
 * const mockCalls = proxyMockCollectorMiddleware({
 *   proxyFilePath: filePathContract.parse('/src/test.proxy.ts'),
 *   program: typescriptProgram
 * });
 * // Returns array of MockCall objects from all proxy files in the chain
 */

import { typescriptSourceFileGetterAdapter } from '../../adapters/typescript/source-file-getter/typescript-source-file-getter-adapter';
import { typescriptAstToMockCallsAdapter } from '../../adapters/typescript/ast-to-mock-calls/typescript-ast-to-mock-calls-adapter';
import { typescriptAstToProxyImportsAdapter } from '../../adapters/typescript/ast-to-proxy-imports/typescript-ast-to-proxy-imports-adapter';
import { importPathResolverMiddleware } from '../import-path-resolver/import-path-resolver-middleware';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { MockCall } from '../../contracts/mock-call/mock-call-contract';
import type { TypescriptProgram } from '../../contracts/typescript-program/typescript-program-contract';

export const proxyMockCollectorMiddleware = ({
  proxyFilePath,
  program,
}: {
  proxyFilePath: FilePath;
  program: TypescriptProgram;
}): MockCall[] => {
  const visitedFiles = new Set<FilePath>();
  const mockCalls: MockCall[] = [];
  const filesToProcess: FilePath[] = [proxyFilePath];

  while (filesToProcess.length > 0) {
    const filePath = filesToProcess.pop();
    if (!filePath || visitedFiles.has(filePath)) {
      continue;
    }
    visitedFiles.add(filePath);

    const sourceFile = typescriptSourceFileGetterAdapter({ program, filePath });
    if (!sourceFile) {
      continue;
    }

    const mocks = typescriptAstToMockCallsAdapter({ sourceFile });
    mockCalls.push(...mocks);

    const proxyImports = typescriptAstToProxyImportsAdapter({ sourceFile });
    for (const proxyImport of proxyImports) {
      const nextProxyPath = importPathResolverMiddleware({
        sourceFilePath: filePath,
        importPath: proxyImport,
      });
      if (nextProxyPath) {
        filesToProcess.push(nextProxyPath);
      }
    }
  }

  return mockCalls;
};
