/**
 * PURPOSE: Returns descriptions of file-anchored steps whose accompanyingFiles are missing the companion files required by the step's folder type
 *
 * USAGE:
 * questStepCompanionFileMismatchTransformer({steps});
 * // Returns ErrorMessage[] — e.g. ["step 'create-login-broker' is missing required companion '.proxy.ts' for folder type 'brokers' (expected 'src/brokers/login/create/login-create-broker.proxy.ts')"].
 *
 * Folder type is inferred from step.focusFile.path via pathToFolderTypeTransformer. For folder types
 * with requireProxy (adapters, brokers, responders, widgets, bindings, state, middleware) the
 * step.accompanyingFiles must include `<focus-base>.proxy.ts` (or `.proxy.tsx` when the focus is .tsx).
 * For folder types with requireStub (contracts) the accompanyingFiles must include the colocated
 * `<contract-base>.stub.ts`. Steps using focusAction (no focusFile) are skipped — they have no
 * file-shape requirement.
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { fileAnchoredStepsTransformer } from '../file-anchored-steps/file-anchored-steps-transformer';
import { pathToFolderTypeTransformer } from '../path-to-folder-type/path-to-folder-type-transformer';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questStepCompanionFileMismatchTransformer = ({
  steps,
}: {
  steps?: DependencyStep[];
}): ErrorMessage[] => {
  if (!steps || steps.length === 0) {
    return [];
  }

  const fileSteps = fileAnchoredStepsTransformer({ steps });
  const offenders: ErrorMessage[] = [];

  for (const step of fileSteps) {
    const focusPath = String(step.focusFile.path);

    const folderType = pathToFolderTypeTransformer({
      filePath: step.focusFile.path,
      folderConfigs: folderConfigStatics,
    });
    if (folderType === undefined) {
      continue;
    }

    const config = folderConfigStatics[folderType as keyof typeof folderConfigStatics];
    const accompanyingPaths = new Set(step.accompanyingFiles.map((f) => String(f.path)));

    if (config.requireProxy) {
      const isTsx = focusPath.endsWith('.tsx');
      const ext = isTsx ? '.tsx' : '.ts';
      const base = focusPath.replace(/\.tsx?$/u, '');
      const expectedProxy = `${base}.proxy${ext}`;
      if (!accompanyingPaths.has(expectedProxy)) {
        offenders.push(
          errorMessageContract.parse(
            `step '${String(step.id)}' is missing required companion '.proxy${ext}' for folder type '${String(folderType)}' (expected '${expectedProxy}')`,
          ),
        );
      }
    }

    if (config.requireStub) {
      const lastSlash = focusPath.lastIndexOf('/');
      const dir = lastSlash === -1 ? '' : focusPath.slice(0, lastSlash);
      const fileName = lastSlash === -1 ? focusPath : focusPath.slice(lastSlash + 1);
      const contractBase = fileName.replace(/-contract\.ts$/u, '');
      const expectedStub =
        dir.length > 0 ? `${dir}/${contractBase}.stub.ts` : `${contractBase}.stub.ts`;
      if (!accompanyingPaths.has(expectedStub)) {
        offenders.push(
          errorMessageContract.parse(
            `step '${String(step.id)}' is missing required companion '.stub.ts' for folder type '${String(folderType)}' (expected '${expectedStub}')`,
          ),
        );
      }
    }
  }

  return offenders;
};
