/**
 * PURPOSE: Renders the shared "Flow Context" $ARGUMENTS block for the per-flow roles (siegemaster and
 * flowrider) — Quest ID, flow header, nodes with observables, edges, design decisions, optional Focus
 * Files + dev-server lines, and the observable-type reference glossary. Siegemaster omits Focus Files;
 * flowrider includes them.
 *
 * USAGE:
 * flowContextToArgumentsTransformer({ questId, flow, relatedDesignDecisions, focusFiles, devServerUrl, devCommand });
 * // Returns ContentText for injection as $ARGUMENTS in the siegemaster / flowrider prompt templates
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type {
  ContentText,
  DesignDecision,
  Flow,
  QuestId,
  StepFileReference,
} from '@dungeonmaster/shared/contracts';
import { outcomeTypeDescriptionsStatics } from '@dungeonmaster/shared/statics';

import type { SiegemasterWorkUnit } from '../../contracts/work-unit/work-unit-contract';

type DevServerUrl = NonNullable<SiegemasterWorkUnit['devServerUrl']>;
type DevCommand = NonNullable<SiegemasterWorkUnit['devCommand']>;
type StepFilePath = StepFileReference['path'];

export const flowContextToArgumentsTransformer = ({
  questId,
  flow,
  relatedDesignDecisions,
  focusFiles,
  devServerUrl,
  devCommand,
}: {
  questId: QuestId;
  flow: Flow;
  relatedDesignDecisions: DesignDecision[];
  focusFiles?: StepFilePath[];
  devServerUrl?: DevServerUrl;
  devCommand?: DevCommand;
}): ContentText => {
  const parts: ContentText[] = [
    contentTextContract.parse(`Quest ID: ${questId}`),
    contentTextContract.parse(`Flow: ${flow.name}`),
    contentTextContract.parse(`  flowType: ${flow.flowType}`),
    contentTextContract.parse(`  entryPoint: ${flow.entryPoint}`),
  ];

  if (flow.nodes.length > 0) {
    parts.push(contentTextContract.parse('Nodes:'));
    for (const node of flow.nodes) {
      parts.push(contentTextContract.parse(`  - ${node.id} "${node.label}" [type: ${node.type}]`));
      if (node.observables.length > 0) {
        parts.push(contentTextContract.parse('    Observables:'));
        for (const observable of node.observables) {
          parts.push(
            contentTextContract.parse(
              `      - ${observable.id} (${observable.type}) ${observable.description}`,
            ),
          );
        }
      }
    }
  }

  if (flow.edges.length > 0) {
    parts.push(contentTextContract.parse('Edges:'));
    for (const edge of flow.edges) {
      const edgeLabel = edge.label ?? '';
      parts.push(contentTextContract.parse(`  - ${edge.from} --[${edgeLabel}]--> ${edge.to}`));
    }
  }

  if (relatedDesignDecisions.length > 0) {
    parts.push(contentTextContract.parse('Design Decisions:'));
    for (const decision of relatedDesignDecisions) {
      parts.push(contentTextContract.parse(`  - ${decision.title}: ${decision.rationale}`));
    }
  }

  if (focusFiles !== undefined && focusFiles.length > 0) {
    parts.push(contentTextContract.parse('Focus Files:'));
    for (const fp of focusFiles) {
      parts.push(contentTextContract.parse(`  - ${fp}`));
    }
  }

  if (devServerUrl !== undefined) {
    parts.push(contentTextContract.parse(`Dev Server URL: ${devServerUrl}`));
  }

  if (devCommand !== undefined) {
    parts.push(contentTextContract.parse(`Dev Command: ${devCommand}`));
  }

  parts.push(contentTextContract.parse(''));
  parts.push(contentTextContract.parse('Observable Type Reference:'));
  for (const [type, desc] of Object.entries(outcomeTypeDescriptionsStatics)) {
    parts.push(contentTextContract.parse(`  - \`${type}\` — ${desc}`));
  }

  return contentTextContract.parse(parts.join('\n'));
};
