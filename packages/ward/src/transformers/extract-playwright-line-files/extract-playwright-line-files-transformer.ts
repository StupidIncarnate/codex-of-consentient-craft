/**
 * PURPOSE: Extracts unique spec file paths from Playwright line reporter output as a fallback when JSON report is unavailable
 *
 * USAGE:
 * extractPlaywrightLineFilesTransformer({ output: errorMessageContract.parse('[1/5] [chromium] › e2e/web/smoke.spec.ts:20:7 › Smoke › test') });
 * // Returns ['e2e/web/smoke.spec.ts']
 */

import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import {
  gitRelativePathContract,
  type GitRelativePath,
} from '../../contracts/git-relative-path/git-relative-path-contract';

const LINE_REPORTER_PATTERN = /› ([\w/./-]+\.spec\.ts):\d+/gu;

export const extractPlaywrightLineFilesTransformer = ({
  output,
}: {
  output: ErrorMessage;
}): GitRelativePath[] => {
  const seen = new Set<GitRelativePath>();
  let match = LINE_REPORTER_PATTERN.exec(output);
  while (match !== null) {
    const [, filePath] = match;
    if (filePath !== undefined) {
      seen.add(gitRelativePathContract.parse(filePath));
    }
    match = LINE_REPORTER_PATTERN.exec(output);
  }
  return [...seen];
};
