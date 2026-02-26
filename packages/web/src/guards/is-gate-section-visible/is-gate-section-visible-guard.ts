/**
 * PURPOSE: Checks if a quest spec panel section is visible for a given quest status
 *
 * USAGE:
 * isGateSectionVisibleGuard({status: 'flows_approved', section: 'requirements'});
 * // Returns true because requirements are visible after flows are approved
 */

import type { QuestStatus } from '@dungeonmaster/shared/contracts';

import type { GateSectionKey } from '../../contracts/gate-section-key/gate-section-key-contract';
import { questGateSectionsStatics } from '../../statics/quest-gate-sections/quest-gate-sections-statics';

export const isGateSectionVisibleGuard = ({
  status,
  section,
}: {
  status?: QuestStatus;
  section?: GateSectionKey;
}): boolean => {
  if (!status || !section) {
    return false;
  }

  const visibleSections: readonly GateSectionKey[] = questGateSectionsStatics.sections[status];
  return visibleSections.includes(section);
};
