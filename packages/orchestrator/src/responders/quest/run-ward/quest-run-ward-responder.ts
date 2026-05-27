/**
 * PURPOSE: Responder for the MCP run-ward tool — delegates to questRunWardBroker
 *
 * USAGE:
 * const result = await QuestRunWardResponder({ questId, workItemId, mode: 'changed' });
 * // Returns: QuestRunWardResult — { success, exitCode, wardResultId, lastWardRunId? }
 */

import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import { questRunWardBroker } from '../../../brokers/quest/run-ward/quest-run-ward-broker';
import type { QuestRunWardResult } from '../../../contracts/quest-run-ward-result/quest-run-ward-result-contract';

export const QuestRunWardResponder = async ({
  questId,
  workItemId,
  mode,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  mode: 'changed' | 'full';
}): Promise<QuestRunWardResult> => questRunWardBroker({ questId, workItemId, mode });
