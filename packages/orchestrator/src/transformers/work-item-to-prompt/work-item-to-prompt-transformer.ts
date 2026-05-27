/**
 * PURPOSE: Builds the fully-substituted agent prompt the MCP `get-agent-prompt` tool serves
 * for a Task-dispatched sub-agent. Resolves `workItem.relatedDataItems` into the quest-level
 * objects (steps/flow), constructs a role-specific WorkUnit, then substitutes `$ARGUMENTS`
 * in the role's prompt template.
 *
 * **Path discrimination — minion vs role:** the agent name is run through
 * `workItemRoleContract.safeParse`. If it succeeds, the agent has its own work item with a
 * matching role and gets the full WorkUnit substitution. If it fails (e.g.
 * `chaoswhisperer-gap-minion`, `blightwarden-*-minion`), the agent is parent-dispatched via
 * the Agent tool — its `workItemId` param is the parent's work item id — and it receives a
 * minimal "Quest ID + Work Item ID" substitution. This discriminator is self-maintaining:
 * adding a new role to `workItemRoleContract` automatically routes it through the WorkUnit
 * path; new minions stay outside that enum and route through the minion path.
 *
 * USAGE:
 * const { prompt } = workItemToPromptTransformer({ quest, workItem, agentName });
 * // Returns ContentText prompt with $ARGUMENTS replaced by role-specific context
 */

import {
  contentTextContract,
  workItemRoleContract,
  type ContentText,
  type Quest,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';

import { agentPromptNameContract } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { workUnitContract, type WorkUnit } from '../../contracts/work-unit/work-unit-contract';
import { agentNameToPromptTransformer } from '../agent-name-to-prompt/agent-name-to-prompt-transformer';
import { buildWorkUnitForRoleTransformer } from '../build-work-unit-for-role/build-work-unit-for-role-transformer';
import { resolveRelatedDataItemTransformer } from '../resolve-related-data-item/resolve-related-data-item-transformer';
import { roleToPromptTemplateTransformer } from '../role-to-prompt-template/role-to-prompt-template-transformer';
import { workUnitToArgumentsTransformer } from '../work-unit-to-arguments/work-unit-to-arguments-transformer';

export const workItemToPromptTransformer = ({
  quest,
  workItem,
  agentName,
}: {
  quest: Quest;
  workItem: WorkItem;
  agentName: string;
}): { prompt: ContentText } => {
  const parsedAgent = agentPromptNameContract.parse(agentName);
  const overrideField =
    workItem.smoketestPromptOverride === undefined
      ? {}
      : { smoketestPromptOverride: workItem.smoketestPromptOverride };

  // Minion path: agent name does not correspond to a WorkItemRole — it's parent-dispatched
  // via Agent() tool, with the parent's workItemId echoed in the get-agent-prompt call.
  // Template only needs Quest ID + Work Item ID.
  const isWorkItemRole = workItemRoleContract.safeParse(parsedAgent).success;
  if (!isWorkItemRole) {
    const { prompt: template } = agentNameToPromptTransformer({ agent: parsedAgent });
    const minionArguments = `Quest ID: ${String(quest.id)}\nWork Item ID: ${String(workItem.id)}`;
    return {
      prompt: contentTextContract.parse(template.replace('$ARGUMENTS', minionArguments)),
    };
  }

  // Role path: agent has its own work item with matching role; build a WorkUnit from the
  // work item's relatedDataItems + the quest's accumulated context.
  const workUnit: WorkUnit = ((): WorkUnit => {
    if (workItem.role === 'codeweaver') {
      if (workItem.relatedDataItems.length === 0) {
        throw new Error(
          `workItemToPromptTransformer: codeweaver work item ${String(workItem.id)} has no relatedDataItems`,
        );
      }
      const steps = workItem.relatedDataItems.map((ref) => {
        const resolved = resolveRelatedDataItemTransformer({ ref, quest });
        if (resolved.collection !== 'steps') {
          throw new Error(
            `workItemToPromptTransformer: codeweaver work item ${String(workItem.id)} expected steps reference, got ${resolved.collection}`,
          );
        }
        return resolved.item;
      });
      return buildWorkUnitForRoleTransformer({
        role: 'codeweaver',
        steps,
        quest,
        ...overrideField,
      });
    }

    if (workItem.role === 'lawbringer') {
      if (workItem.relatedDataItems.length === 0) {
        throw new Error(
          `workItemToPromptTransformer: lawbringer work item ${String(workItem.id)} has no relatedDataItems`,
        );
      }
      const steps = workItem.relatedDataItems.map((ref) => {
        const resolved = resolveRelatedDataItemTransformer({ ref, quest });
        if (resolved.collection !== 'steps') {
          throw new Error(
            `workItemToPromptTransformer: lawbringer work item ${String(workItem.id)} expected steps reference, got ${resolved.collection}`,
          );
        }
        return resolved.item;
      });
      return buildWorkUnitForRoleTransformer({
        role: 'lawbringer',
        steps,
        ...overrideField,
      });
    }

    if (workItem.role === 'spiritmender') {
      const [ref] = workItem.relatedDataItems;
      if (ref === undefined) {
        throw new Error(
          `workItemToPromptTransformer: spiritmender work item ${String(workItem.id)} has no relatedDataItems`,
        );
      }
      const resolved = resolveRelatedDataItemTransformer({ ref, quest });
      if (resolved.collection !== 'steps') {
        throw new Error(
          `workItemToPromptTransformer: spiritmender work item ${String(workItem.id)} expected steps reference, got ${resolved.collection}`,
        );
      }
      return buildWorkUnitForRoleTransformer({
        role: 'spiritmender',
        step: resolved.item,
        ...overrideField,
      });
    }

    if (workItem.role === 'siegemaster') {
      const [ref] = workItem.relatedDataItems;
      if (ref === undefined) {
        throw new Error(
          `workItemToPromptTransformer: siegemaster work item ${String(workItem.id)} has no relatedDataItems`,
        );
      }
      const resolved = resolveRelatedDataItemTransformer({ ref, quest });
      if (resolved.collection !== 'flows') {
        throw new Error(
          `workItemToPromptTransformer: siegemaster work item ${String(workItem.id)} expected flows reference, got ${resolved.collection}`,
        );
      }
      return buildWorkUnitForRoleTransformer({
        role: 'siegemaster',
        flow: resolved.item,
        quest,
        ...overrideField,
      });
    }

    if (workItem.role === 'blightwarden') {
      const scopeSize = quest.planningNotes.scopeClassification?.size;
      return workUnitContract.parse({
        role: 'blightwarden',
        questId: quest.id,
        relatedDesignDecisions: quest.designDecisions,
        ...(scopeSize === undefined ? {} : { scopeSize }),
        ...overrideField,
      });
    }

    if (workItem.role === 'pathseeker-surface') {
      const slice = quest.planningNotes.scopeClassification?.slices.find(
        (s) => s.name === workItem.sliceName,
      );
      return workUnitContract.parse({
        role: 'pathseeker',
        questId: quest.id,
        ...(slice === undefined ? {} : { slice }),
        ...overrideField,
      });
    }

    if (
      workItem.role === 'pathseeker' ||
      workItem.role === 'pathseeker-dedup' ||
      workItem.role === 'pathseeker-assertion-correctness' ||
      workItem.role === 'pathseeker-walk'
    ) {
      return workUnitContract.parse({
        role: 'pathseeker',
        questId: quest.id,
        ...overrideField,
      });
    }

    if (workItem.role === 'ward') {
      throw new Error(
        `workItemToPromptTransformer: ward work items are dispatched via the run-ward MCP tool, not via get-agent-prompt`,
      );
    }

    // Remaining roles (chaoswhisperer, glyphsmith) are not served by get-agent-prompt.
    // chaoswhisperer runs as the /dumpster-create slash command body; glyphsmith runs
    // through the chat-broker design flow. Neither has a Task()-spawn lifecycle.
    throw new Error(
      `workItemToPromptTransformer: role ${workItem.role} is not served by get-agent-prompt`,
    );
  })();

  // Prompt template comes from the work item's role (e.g. pathseeker-surface gets the
  // surface template, not the generic pathseeker one). The WorkUnit's role is unified
  // to 'pathseeker' for the 4 variants — that drives $ARGUMENTS content shape — but
  // the template selection is per-WorkItem-role.
  const templateRole =
    workItem.role === 'pathseeker' ||
    workItem.role === 'pathseeker-surface' ||
    workItem.role === 'pathseeker-dedup' ||
    workItem.role === 'pathseeker-assertion-correctness' ||
    workItem.role === 'pathseeker-walk'
      ? workItem.role
      : workUnit.role;
  const template = roleToPromptTemplateTransformer({ role: templateRole });
  const argumentsText = workUnitToArgumentsTransformer({ workUnit });

  return {
    prompt: contentTextContract.parse(template.replace('$ARGUMENTS', argumentsText)),
  };
};
