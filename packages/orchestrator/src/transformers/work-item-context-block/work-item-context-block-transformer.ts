/**
 * PURPOSE: Builds the work-item context block appended to an agent prompt when a sub-agent calls
 * get-agent-prompt with both questId and workItemId. Provides the minimum identity the sub-agent
 * needs to call signal-back: questId, workItemId, role, and any slice/package info attached to
 * the quest/work item. Richer interpolation (the linked operation item's scope, contracts, file
 * paths) is added separately by workItemToPromptTransformer, which resolves the work item's
 * `operations/<id>` ref.
 *
 * USAGE:
 * const block = workItemContextBlockTransformer({ quest, workItem });
 * // Returns a multi-line PromptText starting with the statics separator + heading
 */

import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

import {
  promptTextContract,
  type PromptText,
} from '../../contracts/prompt-text/prompt-text-contract';
import { workItemContextBlockStatics } from '../../statics/work-item-context-block/work-item-context-block-statics';
import { questPackageEntriesToTextTransformer } from '../quest-package-entries-to-text/quest-package-entries-to-text-transformer';

export const workItemContextBlockTransformer = ({
  quest,
  workItem,
}: {
  quest: Quest;
  workItem: WorkItem;
}): PromptText => {
  const { separator, heading, labels } = workItemContextBlockStatics;
  const lines = [
    '',
    separator,
    '',
    heading,
    '',
    `${labels.questId} ${quest.id}`,
    `${labels.workItemId} ${workItem.id}`,
    `${labels.role} ${workItem.role}`,
  ];

  if (quest.packagesAffected.length > 0) {
    lines.push(
      `${labels.packagesAffected} ${String(questPackageEntriesToTextTransformer({ entries: quest.packagesAffected }))}`,
    );
  }

  // The work item's OWN slice, narrower than the quest-wide list above and the reason this block
  // exists at all: it is the only place a session is told which of the affected packages are its.
  if (workItem.packageNames !== undefined && workItem.packageNames.length > 0) {
    lines.push(
      `${labels.packageNames} ${workItem.packageNames.map((name) => String(name)).join(', ')}`,
    );
  }

  if (workItem.wardMode !== undefined) {
    lines.push(`${labels.wardMode} ${workItem.wardMode}`);
  }

  return promptTextContract.parse(lines.join('\n'));
};
