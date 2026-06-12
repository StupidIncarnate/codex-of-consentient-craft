/**
 * PURPOSE: Builds the fully-substituted agent prompt the MCP `get-agent-prompt` tool serves
 * for a Task-dispatched sub-agent. Resolves `workItem.relatedDataItems` into the quest-level
 * objects (steps/flow), constructs a role-specific WorkUnit, then substitutes `$ARGUMENTS`
 * in the role's prompt template.
 *
 * **Path discrimination — minion vs role:** the agent name is run through
 * `workItemRoleContract.safeParse`. If it succeeds, the agent has its own work item with a
 * matching role. Most roles get the full WorkUnit substitution; the lighter-weight roles that
 * read the quest directly (the five `blightwarden-*-minion` finders and `pesteater`) take a
 * minimal "Quest ID + Work Item ID" substitution branch instead. If safeParse fails (e.g.
 * `chaoswhisperer-gap-minion`), the agent is parent-dispatched via the Agent tool — its
 * `workItemId` param is the parent's work item id — and it also receives the minimal
 * substitution.
 *
 * USAGE:
 * const { prompt } = workItemToPromptTransformer({ quest, workItem, agentName });
 * // Returns ContentText prompt with $ARGUMENTS replaced by role-specific context
 */

import {
  contentTextContract,
  workItemRoleContract,
  type ContentText,
  type ErrorMessage,
  type Quest,
  type StepFileReference,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';

import { agentPromptNameContract } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { isBlightwardenMinionRoleGuard } from '../../guards/is-blightwarden-minion-role/is-blightwarden-minion-role-guard';
import type { DevCommand } from '../../contracts/dev-command/dev-command-contract';
import type { DevServerUrl } from '../../contracts/dev-server-url/dev-server-url-contract';
import {
  workUnitContract,
  type SpiritmenderWorkUnit,
  type WorkUnit,
} from '../../contracts/work-unit/work-unit-contract';
import { agentNameToPromptTransformer } from '../agent-name-to-prompt/agent-name-to-prompt-transformer';
import { buildWorkUnitForRoleTransformer } from '../build-work-unit-for-role/build-work-unit-for-role-transformer';
import { resolveRelatedDataItemTransformer } from '../resolve-related-data-item/resolve-related-data-item-transformer';
import { roleToPromptTemplateTransformer } from '../role-to-prompt-template/role-to-prompt-template-transformer';
import { workUnitToArgumentsTransformer } from '../work-unit-to-arguments/work-unit-to-arguments-transformer';

export const workItemToPromptTransformer = ({
  quest,
  workItem,
  agentName,
  spiritmenderBatch,
  siegeDevServer,
}: {
  quest: Quest;
  workItem: WorkItem;
  agentName: string;
  // Batch-based recovery spiritmenders carry NO steps/<id> relatedDataItem — the broker reads
  // their sidecar and passes the parsed batch in. When present, the spiritmender WorkUnit is
  // built from this instead of from a step reference. The transformer itself reads no files.
  spiritmenderBatch?: {
    filePaths: SpiritmenderWorkUnit['filePaths'];
    errors?: ErrorMessage[];
    verificationCommand?: NonNullable<SpiritmenderWorkUnit['verificationCommand']>;
    contextInstructions?: NonNullable<SpiritmenderWorkUnit['contextInstructions']>;
  };
  // Runtime-flow siege dev-server config, resolved by the broker from .dungeonmaster.json. Only
  // populated onto the WorkUnit when the resolved flow is a runtime flow.
  siegeDevServer?: {
    devCommand: DevCommand;
    devServerUrl: DevServerUrl;
  };
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

  // Blightwarden minions own their work items (role path) but are report-only finders that read
  // the diff + quest themselves — no steps/flows refs to resolve into a WorkUnit. Substitute only
  // Quest ID + Work Item ID; the minion prompt does the rest via get-quest / git diff.
  if (isBlightwardenMinionRoleGuard({ role: workItem.role })) {
    const { prompt: template } = agentNameToPromptTransformer({ agent: parsedAgent });
    const minionArguments = `Quest ID: ${String(quest.id)}\nWork Item ID: ${String(workItem.id)}`;
    return {
      prompt: contentTextContract.parse(template.replace('$ARGUMENTS', minionArguments)),
    };
  }

  // Bug Hunt: PestEater owns its work item (so it routes through the role path) but reads the
  // bug report from the quest itself — it has no steps/flows refs to resolve into a WorkUnit.
  // Substitute only Quest ID + Work Item ID, like the minion path.
  if (workItem.role === 'pesteater') {
    const { prompt: template } = agentNameToPromptTransformer({ agent: parsedAgent });
    const pesteaterArguments = `Quest ID: ${String(quest.id)}\nWork Item ID: ${String(workItem.id)}`;
    return {
      prompt: contentTextContract.parse(template.replace('$ARGUMENTS', pesteaterArguments)),
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
        // Bug-hunt lawbringer: no per-step refs to resolve — review the whole branch diff.
        return workUnitContract.parse({
          role: 'lawbringer',
          reviewMode: 'whole-diff',
          questId: quest.id,
          ...overrideField,
        });
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
      // Batch-based recovery path: the broker read the sidecar and supplied the batch directly.
      // These spiritmenders carry no relatedDataItems by design.
      if (spiritmenderBatch !== undefined) {
        return buildWorkUnitForRoleTransformer({
          role: 'spiritmender',
          filePaths: spiritmenderBatch.filePaths,
          ...(spiritmenderBatch.errors === undefined ? {} : { errors: spiritmenderBatch.errors }),
          ...(spiritmenderBatch.verificationCommand === undefined
            ? {}
            : { verificationCommand: spiritmenderBatch.verificationCommand }),
          ...(spiritmenderBatch.contextInstructions === undefined
            ? {}
            : { contextInstructions: spiritmenderBatch.contextInstructions }),
          ...overrideField,
        });
      }
      // Step-derived path: a single steps/<id> reference names the file to repair.
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
      // Dev-server config only applies to runtime flows. Operational flows get no server: the
      // siege agent verifies post-execution state without one.
      const siegeRuntimeDevServer =
        siegeDevServer !== undefined && resolved.item.flowType === 'runtime'
          ? siegeDevServer
          : undefined;
      return buildWorkUnitForRoleTransformer({
        role: 'siegemaster',
        flow: resolved.item,
        quest,
        ...(siegeRuntimeDevServer === undefined
          ? {}
          : {
              devCommand: siegeRuntimeDevServer.devCommand,
              devServerUrl: siegeRuntimeDevServer.devServerUrl,
            }),
        ...overrideField,
      });
    }

    if (workItem.role === 'flowrider') {
      if (workItem.relatedDataItems.length === 0) {
        throw new Error(
          `workItemToPromptTransformer: flowrider work item ${String(workItem.id)} has no relatedDataItems`,
        );
      }
      // Flowrider's relatedDataItems carry exactly one flows/<id> ref (the flow it tests) plus
      // the flow/startup steps/<id> refs it must implement. Resolve the flow for context and
      // collect each step's focusFile path into focusFiles (the files this role creates).
      const resolvedItems = workItem.relatedDataItems.map((ref) =>
        resolveRelatedDataItemTransformer({ ref, quest }),
      );
      for (const resolved of resolvedItems) {
        if (resolved.collection !== 'flows' && resolved.collection !== 'steps') {
          throw new Error(
            `workItemToPromptTransformer: flowrider work item ${String(workItem.id)} expected flows or steps reference, got ${resolved.collection}`,
          );
        }
      }
      const flowResolved = resolvedItems.find((resolved) => resolved.collection === 'flows');
      if (flowResolved === undefined) {
        throw new Error(
          `workItemToPromptTransformer: flowrider work item ${String(workItem.id)} has no flows reference`,
        );
      }
      const resolvedFlow = flowResolved.item;
      const focusFiles: StepFileReference['path'][] = resolvedItems.flatMap((resolved) =>
        resolved.collection === 'steps' && resolved.item.focusFile !== undefined
          ? [resolved.item.focusFile.path]
          : [],
      );
      // Dev-server config only applies to runtime flows (same as siegemaster).
      const flowriderRuntimeDevServer =
        siegeDevServer !== undefined && resolvedFlow.flowType === 'runtime'
          ? siegeDevServer
          : undefined;
      return buildWorkUnitForRoleTransformer({
        role: 'flowrider',
        flow: resolvedFlow,
        quest,
        focusFiles,
        ...(flowriderRuntimeDevServer === undefined
          ? {}
          : {
              devCommand: flowriderRuntimeDevServer.devCommand,
              devServerUrl: flowriderRuntimeDevServer.devServerUrl,
            }),
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
      workItem.role === 'pathseeker-assertion-correctness'
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
    workItem.role === 'pathseeker-assertion-correctness'
      ? workItem.role
      : workUnit.role;
  const template = roleToPromptTemplateTransformer({ role: templateRole });
  const argumentsText = workUnitToArgumentsTransformer({ workUnit });

  return {
    prompt: contentTextContract.parse(template.replace('$ARGUMENTS', argumentsText)),
  };
};
