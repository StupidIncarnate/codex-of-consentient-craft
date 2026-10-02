/**
 * PURPOSE: Orders project folders for parallel dispatch, placing packages with unknown execution cost first
 * and sorting known packages by total predicted duration descending.
 * Reach for this rather than promisePoolTransformer's input order to minimize tail latency across worker pools.
 *
 * USAGE:
 * packageDispatchOrderTransformer({ projectFolders: [folder], predictions, checkTypes: ['unit'] });
 * // Returns sorted ProjectFolder[] with unknown cost packages first, then longest predicted packages
 */

import type { ProjectFolder } from '../../contracts/project-folder/project-folder-contract';
import type { CheckType } from '../../contracts/check-type/check-type-contract';
import type { DurationPredictions } from '../duration-predict/duration-predict-transformer';

export const packageDispatchOrderTransformer = ({
  projectFolders,
  predictions,
  checkTypes,
}: {
  projectFolders: readonly ProjectFolder[];
  predictions: DurationPredictions;
  checkTypes: readonly CheckType[];
}): ProjectFolder[] => {
  const unknowns: ProjectFolder[] = [];
  const knowns: { folder: ProjectFolder; totalDuration: number }[] = [];

  for (const folder of projectFolders) {
    const packagePredictions = predictions.get(folder.name);
    let isMissing = false;
    let totalDuration = 0;

    for (const checkType of checkTypes) {
      const prediction = packagePredictions?.get(checkType);
      if (prediction === undefined) {
        isMissing = true;
        break;
      }
      totalDuration += prediction.durationMs;
    }

    if (isMissing) {
      unknowns.push(folder);
    } else {
      knowns.push({ folder, totalDuration });
    }
  }

  knowns.sort((left, right) => right.totalDuration - left.totalDuration);

  return [...unknowns, ...knowns.map((entry) => entry.folder)];
};
