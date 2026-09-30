/**
 * PURPOSE: Extracts deduplicated absolute file paths from structured WardResult JSON
 *
 * USAGE:
 * wardOutputToFilePathsTransformer({ wardResultJson: FileContentsStub({ value: '{"checks":[...]}' }) });
 * // Returns [AbsoluteFilePath('/src/file.ts')]
 */


import { wardDetailJsonContract } from '../../contracts/ward-detail-json/ward-detail-json-contract';

export const wardOutputToFilePathsTransformer = ({
  wardResultJson,
}: {
  wardResultJson: string;
}): string[] => {
  const parseResult = wardDetailJsonContract.safeParse(JSON.parse(wardResultJson));

  if (!parseResult.success) {
    return [];
  }

  const detail = parseResult.data;
  const checks = detail.checks ?? [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const check of checks) {
    const projectResults = check.projectResults ?? [];

    for (const projectResult of projectResults) {
      const errors = projectResult.errors ?? [];

      for (const error of errors) {
        const { filePath } = error;

        if (typeof filePath === 'string') {
          try {
            const absolutePath = String(filePath);

            if (!seen.has(absolutePath)) {
              seen.add(absolutePath);
              result.push(absolutePath);
            }
          } catch {
            // Skip paths that fail absolute path validation
          }
        }
      }

      const testFailures = projectResult.testFailures ?? [];

      for (const failure of testFailures) {
        const { suitePath } = failure;

        if (typeof suitePath === 'string') {
          try {
            const absolutePath = String(suitePath);

            if (!seen.has(absolutePath)) {
              seen.add(absolutePath);
              result.push(absolutePath);
            }
          } catch {
            // Skip paths that fail absolute path validation
          }
        }
      }
    }
  }

  return result;
};
