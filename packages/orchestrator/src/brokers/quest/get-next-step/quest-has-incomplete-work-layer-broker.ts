/**
 * PURPOSE: Layer helper for questGetNextStepBroker — returns true when the quest still has work:
 * a non-terminal work item, OR an operations-ledger item that has not completed (the self-heal
 * window where every work item is terminal but advance has not created the next work item yet).
 *
 * USAGE:
 * questHasIncompleteWorkLayerBroker({ quest });
 * // Returns: true if any workItem is pending/queued/in_progress or any operation item is not complete
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

export const questHasIncompleteWorkLayerBroker = ({ quest }: { quest: Quest }): boolean =>
  quest.workItems.some((item) => !isTerminalWorkItemStatusGuard({ status: item.status })) ||
  quest.operations.some((operation) => operation.status !== 'complete');
