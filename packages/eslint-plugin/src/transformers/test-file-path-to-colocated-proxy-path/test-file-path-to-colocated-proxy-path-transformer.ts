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
