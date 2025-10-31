/**
 * PURPOSE: Converts a test file path to the expected colocated proxy import path
 *
 * USAGE:
 * const proxyPath = testFilePathToColocatedProxyPathTransformer({
 *   testFilePath: '/src/brokers/user/user-broker.test.ts'
 * });
 * // Returns: './user-broker.proxy'
 *
 * const integrationProxy = testFilePathToColocatedProxyPathTransformer({
 *   testFilePath: '/src/adapters/http/http-adapter.integration.test.ts'
 * });
 * // Returns: './http-adapter.proxy'
 */
import type { FilePath } from '@questmaestro/shared/contracts';
import { filePathContract } from '@questmaestro/shared/contracts';

export const testFilePathToColocatedProxyPathTransformer = ({
  testFilePath,
}: {
  testFilePath: FilePath;
}): FilePath => {
  // Remove .test.ts, .test.tsx, .spec.ts, .integration.test.ts extensions
  const withoutTestExtension = testFilePath
    .replace(/\.integration\.test\.(ts|tsx)$/u, '')
    .replace(/\.test\.(ts|tsx)$/u, '')
    .replace(/\.spec\.(ts|tsx)$/u, '');

  // Get just the base filename
  const baseFileName = withoutTestExtension.split('/').pop() ?? '';

  // Return relative path to colocated proxy
  return filePathContract.parse(`./${baseFileName}.proxy`);
};
