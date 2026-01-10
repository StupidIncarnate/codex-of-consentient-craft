/**
 * PURPOSE: Converts a proxy file path to its implementation file path by removing .proxy extension
 *
 * USAGE:
 * const implPath = proxyPathToImplementationPathTransformer({
 *   proxyPath: '/src/brokers/user/user-broker.proxy.ts'
 * });
 * // Returns: '/src/brokers/user/user-broker.ts'
 */
import { filePathContract } from '../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';

export const proxyPathToImplementationPathTransformer = ({
  proxyPath,
}: {
  proxyPath: string;
}): FilePath => {
  // Handle both .proxy.ts and .proxy.tsx extensions
  const implementationPath = proxyPath.replace(/\.proxy\.tsx?$/u, (match) =>
    match.endsWith('.tsx') ? '.tsx' : '.ts',
  );

  return filePathContract.parse(implementationPath);
};
