/**
 * PURPOSE: Validates test project data properties for integration testing
 *
 * USAGE:
 * testProjectContract.parse({projectPath: '/tmp/test-123', projectName: 'test-123', rootDir: '/tmp/test-123'});
 * // Returns validated TestProjectData with branded types
 */

import { z } from 'zod';

export const testProjectContract = z.object({
  projectPath: z.string().brand<'ProjectPath'>(),
  projectName: z.string().brand<'ProjectName'>(),
  rootDir: z.string().brand<'RootDir'>(),
});

export type TestProjectData = z.infer<typeof testProjectContract>;

export type TestProject = TestProjectData & {
  installQuestmaestro: (...args: unknown[]) => unknown;
  hasCommand: (...args: unknown[]) => unknown;
  fileExists: (...args: unknown[]) => unknown;
  readFile: (...args: unknown[]) => unknown;
  writeFile: (...args: unknown[]) => unknown;
  deleteFile: (...args: unknown[]) => unknown;
  getConfig: (...args: unknown[]) => unknown;
  getPackageJson: (...args: unknown[]) => unknown;
  getQuestFiles: (...args: unknown[]) => unknown;
  executeCommand: (...args: unknown[]) => unknown;
  cleanup: (...args: unknown[]) => unknown;
};
