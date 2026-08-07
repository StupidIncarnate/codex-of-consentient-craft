/**
 * PURPOSE: Validates a quest id and returns that quest's verification summary by delegating to
 * questGetSummaryBroker
 *
 * USAGE:
 * const summary = await QuestGetSummaryResponder({ questId: 'add-auth' });
 * // Returns QuestSummary — coverage per flow and track, mid-quest observables, unconfirmable
 * // verdicts, and the side-channel notes grouped by kind
 *
 * IT RETURNS THE STRUCTURE, NOT TEXT, and it does not wrap failures in a result envelope. The MCP
 * tool renders it for an agent and the web renders it for a person; both need the same fields, and
 * a responder that pre-rendered would force one of them to parse prose back apart. The same choice
 * `QuestGetServerConfigResponder` makes, for the same reason.
 *
 * An unknown quest id propagates the broker's throw. A summary is a claim about a real quest, so
 * there is no honest value to return when the quest cannot be found — an empty summary would read as
 * "nothing left to verify".
 */

import { questIdContract } from '@dungeonmaster/shared/contracts';
import type { QuestSummary } from '@dungeonmaster/shared/contracts';

import { questGetSummaryBroker } from '../../../brokers/quest/get-summary/quest-get-summary-broker';

export const QuestGetSummaryResponder = async ({
  questId,
}: {
  questId: string;
}): Promise<QuestSummary> => questGetSummaryBroker({ questId: questIdContract.parse(questId) });
