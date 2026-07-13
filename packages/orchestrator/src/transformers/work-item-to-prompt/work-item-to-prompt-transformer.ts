/**
 * PURPOSE: Builds the fully-substituted agent prompt the MCP `get-agent-prompt` tool serves
 * for a dispatched agent session. Resolves the work item's `operations/<id>` ref into its
 * operation item and substitutes `$ARGUMENTS` in the role's prompt template with the operation
 * context: the item being worked, the full operations ledger (the agent verifies it is the right
 * next step against git before trusting it), and role-specific extras (dev server for
 * flowrider/siegemaster, the failed ward result for spiritmender).
 *
 * **Path discrimination — minion vs role:** the agent name is run through
 * `workItemRoleContract.safeParse`. If it fails (e.g. `chaoswhisperer-gap-minion`,
 * `codeweaver-minion`), the agent is parent-dispatched via the Agent tool — its `workItemId`
 * param is the parent's work item id — and receives a minimal "Quest ID + Work Item ID"
 * substitution; the parent briefs task context inline. Blightwarden minions and pesteater own
 * their work items but read the quest/diff themselves, so they also take the minimal branch.
 *
 * USAGE:
 * const { prompt } = workItemToPromptTransformer({ quest, workItem, agentName });
 * // Returns ContentText prompt with $ARGUMENTS replaced by operation-relay context
 */

import {
  contentTextContract,
  workItemRoleContract,
  type ContentText,
  type Quest,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';

import { agentPromptNameContract } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { isBlightwardenMinionRoleGuard } from '../../guards/is-blightwarden-minion-role/is-blightwarden-minion-role-guard';
import type { DevCommand } from '../../contracts/dev-command/dev-command-contract';
import type { DevServerUrl } from '../../contracts/dev-server-url/dev-server-url-contract';
import { agentNameToPromptTransformer } from '../agent-name-to-prompt/agent-name-to-prompt-transformer';
import { roleToPromptTemplateTransformer } from '../role-to-prompt-template/role-to-prompt-template-transformer';

export const workItemToPromptTransformer = ({
  quest,
  workItem,
  agentName,
  devServer,
}: {
  quest: Quest;
  workItem: WorkItem;
  agentName: string;
  // Dev-server config for flowrider/siegemaster, resolved by the broker from .dungeonmaster.json.
  devServer?: {
    devCommand: DevCommand;
    devServerUrl: DevServerUrl;
  };
}): { prompt: ContentText } => {
  const parsedAgent = agentPromptNameContract.parse(agentName);
  const minionArguments = `Quest ID: ${String(quest.id)}\nWork Item ID: ${String(workItem.id)}`;

  // Minion path: agent name does not correspond to a WorkItemRole — it's parent-dispatched
  // via the Agent tool, with the parent's workItemId echoed in the get-agent-prompt call.
  const isWorkItemRole = workItemRoleContract.safeParse(parsedAgent).success;
  if (!isWorkItemRole) {
    const { prompt: template } = agentNameToPromptTransformer({ agent: parsedAgent });
    return {
      prompt: contentTextContract.parse(template.replace('$ARGUMENTS', minionArguments)),
    };
  }

  // Blightwarden minions own their work items (role path) but are report-only finders that read
  // the diff + quest themselves. PestEater reads the bug report from the quest itself. Both get
  // the minimal substitution.
  if (isBlightwardenMinionRoleGuard({ role: workItem.role }) || workItem.role === 'pesteater') {
    const { prompt: template } = agentNameToPromptTransformer({ agent: parsedAgent });
    return {
      prompt: contentTextContract.parse(template.replace('$ARGUMENTS', minionArguments)),
    };
  }

  if (workItem.role === 'ward') {
    throw new Error(
      `workItemToPromptTransformer: ward work items are dispatched via the run-ward MCP tool, not via get-agent-prompt`,
    );
  }

  if (workItem.role === 'chaoswhisperer' || workItem.role === 'glyphsmith') {
    // chaoswhisperer runs as the /dumpster-create slash command body; glyphsmith runs through
    // the chat-broker design flow. Neither has a dispatch-loop lifecycle.
    throw new Error(
      `workItemToPromptTransformer: role ${workItem.role} is not served by get-agent-prompt`,
    );
  }

  // Relay path: resolve the work item's linked operation item and hand the agent its operation
  // plus the full ledger, so it can verify "this is the right next step" against git.
  const linkedRef = workItem.relatedDataItems
    .map((ref) => String(ref))
    .find((ref) => ref.startsWith('operations/'));
  const linkedOperation = quest.operations.find(
    (operation) => String(operation.id) === (linkedRef?.split('/')[1] ?? ''),
  );
  if (linkedOperation === undefined) {
    throw new Error(
      `workItemToPromptTransformer: ${workItem.role} work item ${String(workItem.id)} has no resolvable operations/<id> reference`,
    );
  }

  const ledgerLines = quest.operations.map((operation, index) => {
    const marker =
      operation.status === 'complete' ? '[x]' : operation.status === 'in_progress' ? '[>]' : '[ ]';
    const wardMode = operation.wardMode === undefined ? '' : ` ${operation.wardMode}`;
    const yours = operation.id === linkedOperation.id ? '  <-- YOUR OPERATION ITEM' : '';
    return contentTextContract.parse(
      `${String(index + 1)}. ${marker} [${operation.role}${wardMode}] ${String(operation.text)}${yours}`,
    );
  });

  const parts: ContentText[] = [
    contentTextContract.parse(`Quest ID: ${String(quest.id)}`),
    contentTextContract.parse(`Work Item ID: ${String(workItem.id)}`),
    contentTextContract.parse(`Operation Item ID: ${String(linkedOperation.id)}`),
    contentTextContract.parse(
      `Your operation item: [${linkedOperation.role}] ${String(linkedOperation.text)}`,
    ),
    contentTextContract.parse(''),
    contentTextContract.parse('Operations ledger (in order):'),
    ...ledgerLines,
  ];

  if (
    (workItem.role === 'flowrider' || workItem.role === 'siegemaster') &&
    devServer !== undefined
  ) {
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(`Dev Server Command: ${String(devServer.devCommand)}`),
      contentTextContract.parse(`Dev Server URL: ${String(devServer.devServerUrl)}`),
    );
  }

  if (workItem.role === 'spiritmender') {
    const latestFailedWard = [...quest.wardResults]
      .filter((wardResult) => wardResult.exitCode !== 0)
      .at(-1);
    if (latestFailedWard !== undefined) {
      parts.push(
        contentTextContract.parse(''),
        contentTextContract.parse(
          `Failed ward result: ${String(latestFailedWard.id)} (mode: ${String(latestFailedWard.wardMode)}${latestFailedWard.runId === undefined ? '' : `, runId: ${String(latestFailedWard.runId)}`})`,
        ),
        contentTextContract.parse(
          `Ward detail blob: <questFolder>/ward-results/${String(latestFailedWard.id)}.json`,
        ),
      );
    }
  }

  const template = roleToPromptTemplateTransformer({ role: workItem.role });

  return {
    prompt: contentTextContract.parse(template.replace('$ARGUMENTS', parts.join('\n'))),
  };
};
