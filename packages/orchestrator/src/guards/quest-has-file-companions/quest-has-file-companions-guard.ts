/**
 * PURPOSE: Validates that steps creating implementation files also list required companion files derived from folderConfigStatics
 *
 * USAGE:
 * questHasFileCompanionsGuard({steps});
 * // Returns true if every focusFile has its required companion files in accompanyingFiles, false otherwise
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { focusFileToTestPathTransformer } from '../../transformers/focus-file-to-test-path/focus-file-to-test-path-transformer';
import { pathToFolderTypeTransformer } from '../../transformers/path-to-folder-type/path-to-folder-type-transformer';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questHasFileCompanionsGuard = ({ steps }: { steps?: DependencyStep[] }): boolean => {
  if (!steps) {
    return false;
  }

  for (const step of steps) {
    const focusPath = step.focusFile.path;

    if (step.focusFile.action !== 'create') {
      continue;
    }

    const folderType = pathToFolderTypeTransformer({
      filePath: focusPath,
      folderConfigs: folderConfigStatics,
    });
    if (!folderType) {
      continue;
    }

    const config = folderConfigStatics[folderType as keyof typeof folderConfigStatics];
    const accompanyingPaths = new Set(step.accompanyingFiles.map((f) => String(f.path)));

    const expectedTestPath = focusFileToTestPathTransformer({
      focusPath,
      testType: config.testType,
    });
    if (expectedTestPath && !accompanyingPaths.has(String(expectedTestPath))) {
      return false;
    }

    if (config.requireProxy) {
      const pathStr = String(focusPath);
      const base = pathStr.replace(/\.tsx?$/u, '');
      const ext = pathStr.endsWith('.tsx') ? '.tsx' : '.ts';
      const proxyFile = `${base}.proxy${ext}`;
      if (!accompanyingPaths.has(proxyFile)) {
        return false;
      }
    }

    if (config.requireStub) {
      const pathStr = String(focusPath);
      const dir = pathStr.slice(0, pathStr.lastIndexOf('/'));
      const fileName = pathStr.slice(pathStr.lastIndexOf('/') + 1);
      const contractBase = fileName.replace(/-contract\.ts$/u, '');
      const stubFile = `${dir}/${contractBase}.stub.ts`;
      if (!accompanyingPaths.has(stubFile)) {
        return false;
      }
    }
  }

  return true;
};
