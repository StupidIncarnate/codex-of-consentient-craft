/**
 * PURPOSE: Layer helper for questGetNextStepBroker — returns true when at least one work item on the quest is not yet in a terminal status
 *
 * USAGE:
 * questHasIncompleteWorkLayerBroker({ quest });
 * // Returns: true if any workItem is pending/queued/in_progress
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

export const questHasIncompleteWorkLayerBroker = ({ quest }: { quest: Quest }): boolean =>
  quest.workItems.some((item) => !isTerminalWorkItemStatusGuard({ status: item.status }));
