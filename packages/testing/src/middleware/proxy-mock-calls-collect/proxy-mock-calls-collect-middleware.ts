/**
 * PURPOSE: Collects the merged jest.mock() calls a test file's proxy imports reach, walking every
 * proxy file and barrel on that chain. These calls are the only thing besides the test file's own
 * text that the proxy-mock hoister's output depends on, so the hoister and the transform cache key
 * both read them from here.
 *
 * USAGE:
 * const mockCalls = proxyMockCallsCollectMiddleware({ sourceFile, program });
 * // Returns MockCall[], merged by module, in a stable order
 */

import { importPathResolverMiddleware } from '../import-path-resolver/import-path-resolver-middleware';
import { proxyMockCollectorMiddleware } from '../proxy-mock-collector/proxy-mock-collector-middleware';
import { astProxyImportsTransformer } from '../../transformers/ast-proxy-imports/ast-proxy-imports-transformer';
import { mockCallsMergeByModuleTransformer } from '../../transformers/mock-calls-merge-by-module/mock-calls-merge-by-module-transformer';
import type { MockCall } from '../../contracts/mock-call/mock-call-contract';
import type * as ts from '#gateway/npm/typescript';

export const proxyMockCallsCollectMiddleware = ({
  sourceFile,
  program,
}: {
  sourceFile: ts.SourceFile;
  program: ts.Program | undefined;
}): MockCall[] => {
  const mockCalls: MockCall[] = [];

  for (const edge of astProxyImportsTransformer({ sourceFile })) {
    const proxyPath = importPathResolverMiddleware({
      sourceFilePath: sourceFile.fileName,
      importPath: edge.importPath,
    });
    if (proxyPath) {
      mockCalls.push(
        ...proxyMockCollectorMiddleware({
          proxyFilePath: proxyPath,
          program,
          requestedNames: edge.names,
        }),
      );
    }
  }

  if (mockCalls.length === 0) {
    return [];
  }

  return mockCallsMergeByModuleTransformer({ mockCalls });
};
