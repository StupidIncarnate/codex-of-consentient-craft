/**
 * PURPOSE: Converts a WorkUnit into a formatted string for injection as $ARGUMENTS in agent prompt templates
 *
 * USAGE:
 * const args = workUnitToArgumentsTransformer({ workUnit });
 * // Returns ContentText formatted for the specific agent role
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { outcomeTypeDescriptionsStatics } from '@dungeonmaster/shared/statics';

import type { WorkUnit } from '../../contracts/work-unit/work-unit-contract';

export const workUnitToArgumentsTransformer = ({
  workUnit,
}: {
  workUnit: WorkUnit;
}): ContentText => {
  switch (workUnit.role) {
    case 'codeweaver': {
      const {
        step,
        questId,
        relatedContracts,
        relatedObservables,
        relatedDesignDecisions,
        relatedFlows,
      } = workUnit;
      const focusLine =
        step.focusFile === undefined
          ? step.focusAction === undefined
            ? 'Focus: (none)'
            : `Focus Action: [${step.focusAction.kind}] ${String(step.focusAction.description)}`
          : `Focus File: ${String(step.focusFile.path)}`;
      const parts: ContentText[] = [
        contentTextContract.parse(`Step: ${step.name}`),
        contentTextContract.parse(focusLine),
      ];

      if (step.exportName !== undefined) {
        parts.push(contentTextContract.parse(`Export Name: ${step.exportName}`));
      }

      if (step.accompanyingFiles.length > 0) {
        parts.push(contentTextContract.parse('Accompanying Files:'));
        for (const file of step.accompanyingFiles) {
          parts.push(contentTextContract.parse(`  - ${file.path}`));
        }
      }

      if (step.assertions.length > 0) {
        parts.push(contentTextContract.parse('Assertions:'));
        for (const assertion of step.assertions) {
          parts.push(contentTextContract.parse(`  - ${assertion.prefix}: ${assertion.expected}`));
        }
      }

      if (step.uses.length > 0) {
        parts.push(contentTextContract.parse('Uses:'));
        for (const ref of step.uses) {
          parts.push(contentTextContract.parse(`  - ${ref}`));
        }
      }

      if (relatedContracts.length > 0) {
        parts.push(contentTextContract.parse('Related Contracts:'));
        for (const contract of relatedContracts) {
          parts.push(contentTextContract.parse(`  - ${contract.name} (${contract.kind})`));
          for (const prop of contract.properties) {
            const typeSuffix = ` (${prop.type})`;
            const descSuffix = ` - ${prop.description}`;
            parts.push(contentTextContract.parse(`    - ${prop.name}${typeSuffix}${descSuffix}`));
          }
        }
      }

      if (relatedDesignDecisions.length > 0) {
        parts.push(contentTextContract.parse('Design Decisions:'));
        for (const decision of relatedDesignDecisions) {
          parts.push(contentTextContract.parse(`  - ${decision.title}: ${decision.rationale}`));
        }
      }

      if (relatedFlows.length > 0) {
        parts.push(contentTextContract.parse('Flows:'));
        for (const flow of relatedFlows) {
          const relevantNodes = flow.nodes
            .filter((node) => node.observables.length > 0)
            .map((node) => node.label);
          const nodesSuffix =
            relevantNodes.length > 0 ? ` (nodes: ${relevantNodes.join(', ')})` : '';
          parts.push(contentTextContract.parse(`  - ${flow.name}${nodesSuffix}`));
        }
      }

      if (relatedObservables.length > 0) {
        parts.push(contentTextContract.parse('Related Observables:'));
        for (const observable of relatedObservables) {
          parts.push(
            contentTextContract.parse(`    - ${observable.description} (${observable.type})`),
          );
        }
      }

      parts.push(contentTextContract.parse(`Quest ID: ${questId}`));

      return contentTextContract.parse(parts.join('\n'));
    }

    case 'siegemaster': {
      const { questId: siegeQuestId, relatedDesignDecisions, flow, devServerUrl } = workUnit;
      const siegeParts: ContentText[] = [
        contentTextContract.parse(`Quest ID: ${siegeQuestId}`),
        contentTextContract.parse(`Flow: ${flow.name}`),
        contentTextContract.parse(`  flowType: ${flow.flowType}`),
        contentTextContract.parse(`  entryPoint: ${flow.entryPoint}`),
      ];

      if (flow.nodes.length > 0) {
        siegeParts.push(contentTextContract.parse('Nodes:'));
        for (const node of flow.nodes) {
          siegeParts.push(
            contentTextContract.parse(`  - ${node.id} "${node.label}" [type: ${node.type}]`),
          );
          if (node.observables.length > 0) {
            siegeParts.push(contentTextContract.parse('    Observables:'));
            for (const observable of node.observables) {
              siegeParts.push(
                contentTextContract.parse(
                  `      - ${observable.id} (${observable.type}) ${observable.description}`,
                ),
              );
            }
          }
        }
      }

      if (flow.edges.length > 0) {
        siegeParts.push(contentTextContract.parse('Edges:'));
        for (const edge of flow.edges) {
          const edgeLabel = edge.label ?? '';
          siegeParts.push(
            contentTextContract.parse(`  - ${edge.from} --[${edgeLabel}]--> ${edge.to}`),
          );
        }
      }

      if (relatedDesignDecisions.length > 0) {
        siegeParts.push(contentTextContract.parse('Design Decisions:'));
        for (const decision of relatedDesignDecisions) {
          siegeParts.push(
            contentTextContract.parse(`  - ${decision.title}: ${decision.rationale}`),
          );
        }
      }

      if (devServerUrl !== undefined) {
        siegeParts.push(contentTextContract.parse(`Dev Server URL: ${devServerUrl}`));
      }

      siegeParts.push(contentTextContract.parse(''));
      siegeParts.push(contentTextContract.parse('Observable Type Reference:'));
      for (const [type, desc] of Object.entries(outcomeTypeDescriptionsStatics)) {
        siegeParts.push(contentTextContract.parse(`  - \`${type}\` — ${desc}`));
      }

      return contentTextContract.parse(siegeParts.join('\n'));
    }

    case 'lawbringer': {
      const { filePaths: lawbringerPaths } = workUnit;
      const lawParts: ContentText[] = [contentTextContract.parse('Files to Review:')];
      for (const fp of lawbringerPaths) {
        lawParts.push(contentTextContract.parse(`  - ${fp}`));
      }
      return contentTextContract.parse(lawParts.join('\n'));
    }

    case 'spiritmender': {
      const { filePaths: spiritPaths } = workUnit;
      const spiritParts: ContentText[] = [];

      if (workUnit.contextInstructions !== undefined) {
        spiritParts.push(contentTextContract.parse(workUnit.contextInstructions));
        spiritParts.push(contentTextContract.parse(''));
      }

      spiritParts.push(contentTextContract.parse('Files:'));
      for (const fp of spiritPaths) {
        spiritParts.push(contentTextContract.parse(`  - ${fp}`));
      }

      if (workUnit.errors !== undefined && workUnit.errors.length > 0) {
        spiritParts.push(contentTextContract.parse('Errors:'));
        for (const errorMsg of workUnit.errors) {
          spiritParts.push(contentTextContract.parse(`  - ${errorMsg}`));
        }
      }

      if (workUnit.verificationCommand === undefined) {
        spiritParts.push(
          contentTextContract.parse('Run npm run ward on the files to verify fixes.'),
        );
      } else {
        spiritParts.push(
          contentTextContract.parse(`Verification Command: ${workUnit.verificationCommand}`),
        );
      }

      return contentTextContract.parse(spiritParts.join('\n'));
    }

    case 'pathseeker': {
      const pathParts: ContentText[] = [contentTextContract.parse(`Quest ID: ${workUnit.questId}`)];

      if (workUnit.failureContext !== undefined) {
        pathParts.push(contentTextContract.parse(`\nFAILURE CONTEXT:\n${workUnit.failureContext}`));
      }

      return contentTextContract.parse(pathParts.join('\n'));
    }

    case 'blightwarden': {
      const {
        questId: blightQuestId,
        scopeSize,
        relatedDesignDecisions: blightDesignDecisions,
      } = workUnit;
      const blightParts: ContentText[] = [
        contentTextContract.parse(`Quest ID: ${blightQuestId}`),
      ];

      if (scopeSize !== undefined) {
        blightParts.push(contentTextContract.parse(`Scope Size: ${scopeSize}`));
      }

      if (blightDesignDecisions.length > 0) {
        blightParts.push(contentTextContract.parse('Design Decisions:'));
        for (const decision of blightDesignDecisions) {
          blightParts.push(
            contentTextContract.parse(`  - ${decision.title}: ${decision.rationale}`),
          );
        }
      }

      return contentTextContract.parse(blightParts.join('\n'));
    }

    default: {
      const exhaustiveCheck: never = workUnit;
      throw new Error(`Unknown role: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
};
