/**
 * PURPOSE: Filters a quest to include only the specified sections, replacing excluded sections with empty arrays
 *
 * USAGE:
 * questSectionFilterTransformer({ quest, sections: ['requirements', 'observables'] });
 * // Returns quest with only requirements and observables populated; all other array sections are empty arrays
 *
 * questSectionFilterTransformer({ quest });
 * // Returns the quest unchanged when sections is undefined
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

import { questSectionContract } from '../../contracts/quest-section/quest-section-contract';
import type { QuestSection } from '../../contracts/quest-section/quest-section-contract';

export const questSectionFilterTransformer = ({
  quest,
  sections,
}: {
  quest: Quest;
  sections?: QuestSection[];
}): Quest => {
  if (sections === undefined) {
    return quest;
  }

  const sectionsSet = new Set(sections);

  const filtered = { ...quest };

  for (const section of questSectionContract.options) {
    if (!sectionsSet.has(section)) {
      filtered[section] = [] as never;
    }
  }

  return filtered;
};
