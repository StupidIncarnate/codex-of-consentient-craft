/**
 * PURPOSE: Filters a quest to include only the specified sections, replacing excluded array sections with empty arrays and the excluded planningNotes object with its default empty shape
 *
 * USAGE:
 * questSectionFilterTransformer({ quest, sections: ['flows', 'planningNotes'] });
 * // Returns quest with only flows and planningNotes populated; other array sections are empty arrays and planningNotes defaults when excluded
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
    if (sectionsSet.has(section)) {
      continue;
    }
    if (section === 'planningNotes') {
      filtered.planningNotes = {
        surfaceReports: [],
        blightReports: [],
      } as Quest['planningNotes'];
      continue;
    }
    filtered[section] = [] as never;
  }

  return filtered;
};
