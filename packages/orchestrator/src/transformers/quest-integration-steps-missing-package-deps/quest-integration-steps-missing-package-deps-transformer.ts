/**
 * PURPOSE: Returns descriptions of integration-producing steps whose transitive dependsOn closure does not cover every other file-anchored step in the same /src/-prefixed package scope
 *
 * USAGE:
 * questIntegrationStepsMissingPackageDepsTransformer({steps});
 * // Returns ErrorMessage[] — e.g. ["step 'wire-flow' creates an integration file but does not (transitively) depend on step 'create-broker' in the same package scope"].
 *
 * Integration tests (.integration.test.ts) only pass once every other source file in the package exists.
 * Steps whose focusFile lives in a folder type with testType === 'integration' (currently flows/ and
 * startup/, derived dynamically from folderConfigStatics) must therefore transitively depend on every
 * other file-anchored step in the same package scope. Package scope is the substring of the path up to
 * and including the LAST '/src/' segment (or the path's dirname if '/src/' is absent). This supports
 * monorepo (`packages/<pkg>/src/...`), flat (`src/...`), and app (`apps/web/src/...`) layouts.
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { fileAnchoredStepsTransformer } from '../file-anchored-steps/file-anchored-steps-transformer';
import { pathToFolderTypeTransformer } from '../path-to-folder-type/path-to-folder-type-transformer';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

const SRC_SEGMENT = '/src/';

export const questIntegrationStepsMissingPackageDepsTransformer = ({
  steps,
}: {
  steps?: DependencyStep[];
}): ErrorMessage[] => {
  if (!steps || steps.length === 0) {
    return [];
  }

  const integrationFolderTypes = new Set<unknown>(
    Object.entries(folderConfigStatics)
      .filter(([, config]) => config.testType === 'integration')
      .map(([key]) => key),
  );

  const fileAnchored = fileAnchoredStepsTransformer({ steps });
  if (fileAnchored.length === 0) {
    return [];
  }

  const stepById = new Map<unknown, DependencyStep>();
  for (const step of steps) {
    stepById.set(String(step.id), step);
  }

  const fileAnchoredByScope = new Map<unknown, typeof fileAnchored>();
  const stepScope = new Map<unknown, unknown>();
  for (const step of fileAnchored) {
    const pathStr = String(step.focusFile.path);
    const lastSrcIndex = pathStr.lastIndexOf(SRC_SEGMENT);
    const key: unknown =
      lastSrcIndex === -1
        ? pathStr.startsWith('src/')
          ? 'src/'
          : (() => {
              const lastSlash = pathStr.lastIndexOf('/');
              return lastSlash === -1 ? '' : pathStr.slice(0, lastSlash + 1);
            })()
        : pathStr.slice(0, lastSrcIndex + SRC_SEGMENT.length);
    stepScope.set(String(step.id), key);
    const bucket = fileAnchoredByScope.get(key);
    if (bucket) {
      bucket.push(step);
    } else {
      fileAnchoredByScope.set(key, [step]);
    }
  }

  const offenders: ErrorMessage[] = [];

  for (const step of fileAnchored) {
    const folderType = pathToFolderTypeTransformer({
      filePath: step.focusFile.path,
      folderConfigs: folderConfigStatics,
    });
    if (folderType === undefined || !integrationFolderTypes.has(folderType)) {
      continue;
    }

    const scopeKey = stepScope.get(String(step.id));
    const peers = fileAnchoredByScope.get(scopeKey) ?? [];

    const closure = new Set<unknown>();
    const frontier: unknown[] = step.dependsOn.map((dep) => String(dep));
    for (; frontier.length > 0; ) {
      const nextId = frontier.shift();
      if (nextId === undefined || closure.has(nextId)) {
        continue;
      }
      closure.add(nextId);
      const depStep = stepById.get(nextId);
      if (!depStep) {
        continue;
      }
      for (const innerDep of depStep.dependsOn) {
        const innerId = String(innerDep);
        if (!closure.has(innerId)) {
          frontier.push(innerId);
        }
      }
    }

    for (const peer of peers) {
      const peerId = String(peer.id);
      if (peerId === String(step.id)) {
        continue;
      }
      if (!closure.has(peerId)) {
        offenders.push(
          errorMessageContract.parse(
            `step '${String(step.id)}' creates an integration file but does not (transitively) depend on step '${peerId}' in the same package scope`,
          ),
        );
      }
    }
  }

  return offenders;
};
