import { filePathContract } from '../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';

export const proxyPathToImplementationPathTransformer = ({
  proxyPath,
}: {
  proxyPath: string;
}): FilePath => {
  const implementationPath = proxyPath.replace(/\.proxy\.ts$/u, '.ts');

  return filePathContract.parse(implementationPath);
};
