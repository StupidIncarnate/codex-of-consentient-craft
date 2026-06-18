/**
 * PURPOSE: Decides whether a DependencyStep is a reviewable implementation pair the Lawbringer parent
 * should fan a `lawbringer-minion` out against. True only when the step's focusFile is a concrete
 * source file — a whitespace-free path that resolves to a known folder type. Operational steps whose
 * focus is a prose instruction (`[command] …` / `[sweep-check] …` / `[verification] …`) contain
 * whitespace and are skipped; package-root barrels and non-source files (e.g. `package.json`) resolve
 * to no folder type and are skipped. This keeps the parent from briefing a minion on a step that has
 * no impl+test pair to review. It does NOT exclude flowrider-owned steps (those resolve to a folder
 * type) — that exclusion lives in stepsToPackageChunksTransformer, which the parent chunks through.
 *
 * USAGE:
 * isLawbringerReviewableStepGuard({ step });
 * // Returns true for a contracts/adapters/widgets/… source focusFile, false for a `[command]` step or package.json
 */

import type { DependencyStep } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { pathToFolderTypeTransformer } from '../../transformers/path-to-folder-type/path-to-folder-type-transformer';

export const isLawbringerReviewableStepGuard = ({ step }: { step?: DependencyStep }): boolean => {
  const filePath = step?.focusFile?.path;
  if (filePath === undefined) {
    return false;
  }

  if (/\s/u.test(String(filePath))) {
    return false;
  }

  const folderType = pathToFolderTypeTransformer({ filePath, folderConfigs: folderConfigStatics });
  return folderType !== undefined;
};
