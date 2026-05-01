/**
 * PURPOSE: Returns true when a filename matches the startup file pattern (start-*.ts) and is not a test/proxy/stub
 *
 * USAGE:
 * matchesStartupFileNameGuard({ name: 'start-my-app.ts' });
 * // Returns true — matches the startup file pattern
 *
 * matchesStartupFileNameGuard({ name: 'start-my-app.integration.test.ts' });
 * // Returns false — test files are excluded so detection signals come from real source
 */

import { projectMapStatics } from '../../statics/project-map/project-map-statics';

const STARTUP_FILE_PATTERN = /^start-.+\.ts$/u;

export const matchesStartupFileNameGuard = ({ name }: { name?: string }): boolean => {
  if (name === undefined) return false;
  if (!STARTUP_FILE_PATTERN.test(name)) return false;
  return !projectMapStatics.testFileSuffixes.some((suffix) => name.endsWith(suffix));
};
