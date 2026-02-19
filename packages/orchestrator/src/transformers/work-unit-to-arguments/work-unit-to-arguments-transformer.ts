/**
 * PURPOSE: Converts a WorkUnit into a formatted string for injection as $ARGUMENTS in agent prompt templates
 *
 * USAGE:
 * const args = workUnitToArgumentsTransformer({ workUnit });
 * // Returns ContentText formatted for the specific agent role
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { WorkUnit } from '../../contracts/work-unit/work-unit-contract';

export const workUnitToArgumentsTransformer = ({
  workUnit,
}: {
  workUnit: WorkUnit;
}): ContentText => {
  switch (workUnit.role) {
    case 'codeweaver': {
      const { step, questId, relatedContracts, relatedObservables, relatedRequirements } = workUnit;
      const parts: ContentText[] = [
        contentTextContract.parse(`Step: ${step.name}`),
        contentTextContract.parse(`Description: ${step.description}`),
      ];

      if (step.exportName !== undefined) {
        parts.push(contentTextContract.parse(`Export Name: ${step.exportName}`));
      }

      if (step.filesToCreate.length > 0) {
        parts.push(contentTextContract.parse('Files to Create:'));
        for (const filePath of step.filesToCreate) {
          parts.push(contentTextContract.parse(`  - ${filePath}`));
        }
      }

      if (step.filesToModify.length > 0) {
        parts.push(contentTextContract.parse('Files to Modify:'));
        for (const filePath of step.filesToModify) {
          parts.push(contentTextContract.parse(`  - ${filePath}`));
        }
      }

      if (relatedContracts.length > 0) {
        parts.push(contentTextContract.parse('Related Contracts:'));
        for (const contract of relatedContracts) {
          parts.push(contentTextContract.parse(`  - ${contract.name} (${contract.kind})`));
          for (const prop of contract.properties) {
            const typeSuffix = prop.type === undefined ? '' : ` (${prop.type})`;
            const descSuffix = prop.description === undefined ? '' : ` - ${prop.description}`;
            parts.push(contentTextContract.parse(`    - ${prop.name}${typeSuffix}${descSuffix}`));
          }
        }
      }

      if (relatedObservables.length > 0) {
        parts.push(contentTextContract.parse('Related Observables:'));
        for (const observable of relatedObservables) {
          parts.push(contentTextContract.parse(`  - Trigger: ${observable.trigger}`));
          if (observable.verification.length > 0) {
            parts.push(contentTextContract.parse('    Verification:'));
            for (const verificationStep of observable.verification) {
              const targetSuffix = verificationStep.target === undefined ? '' : ` ${verificationStep.target}`;
              const valueSuffix = verificationStep.value === undefined ? '' : ` = ${verificationStep.value}`;
              const conditionSuffix = verificationStep.condition === undefined ? '' : ` [${verificationStep.condition}]`;
              const typeSuffix = verificationStep.type === undefined ? '' : ` (${verificationStep.type})`;
              parts.push(
                contentTextContract.parse(
                  `      - ${verificationStep.action}${targetSuffix}${valueSuffix}${conditionSuffix}${typeSuffix}`,
                ),
              );
            }
          }
          for (const outcome of observable.outcomes) {
            parts.push(contentTextContract.parse(`    - ${outcome.type}: ${outcome.description}`));
          }
        }
      }

      if (relatedRequirements.length > 0) {
        parts.push(contentTextContract.parse('Related Requirements:'));
        for (const requirement of relatedRequirements) {
          parts.push(
            contentTextContract.parse(`  - ${requirement.name}: ${requirement.description}`),
          );
        }
      }

      parts.push(contentTextContract.parse(`Quest ID: ${questId}`));

      return contentTextContract.parse(parts.join('\n'));
    }

    case 'siegemaster': {
      const { questId: siegeQuestId, observables, contexts } = workUnit;
      const siegeParts: ContentText[] = [contentTextContract.parse(`Quest ID: ${siegeQuestId}`)];

      if (observables.length > 0) {
        siegeParts.push(contentTextContract.parse('Observables:'));
        for (const observable of observables) {
          siegeParts.push(
            contentTextContract.parse(`  - [${observable.contextId}] ${observable.trigger}`),
          );
          if (observable.verification.length > 0) {
            siegeParts.push(contentTextContract.parse('    Verification:'));
            for (const verificationStep of observable.verification) {
              const targetSuffix = verificationStep.target === undefined ? '' : ` ${verificationStep.target}`;
              const valueSuffix = verificationStep.value === undefined ? '' : ` = ${verificationStep.value}`;
              const conditionSuffix = verificationStep.condition === undefined ? '' : ` [${verificationStep.condition}]`;
              const typeSuffix = verificationStep.type === undefined ? '' : ` (${verificationStep.type})`;
              siegeParts.push(
                contentTextContract.parse(
                  `      - ${verificationStep.action}${targetSuffix}${valueSuffix}${conditionSuffix}${typeSuffix}`,
                ),
              );
            }
          }
          for (const outcome of observable.outcomes) {
            siegeParts.push(
              contentTextContract.parse(`    - ${outcome.type}: ${outcome.description}`),
            );
          }
        }
      }

      if (contexts.length > 0) {
        siegeParts.push(contentTextContract.parse('Contexts:'));
        for (const context of contexts) {
          siegeParts.push(contentTextContract.parse(`  - ${context.name}: ${context.description}`));
        }
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

      spiritParts.push(contentTextContract.parse('Run npm run ward on the files to verify fixes.'));

      return contentTextContract.parse(spiritParts.join('\n'));
    }

    case 'pathseeker': {
      return contentTextContract.parse(`Quest ID: ${workUnit.questId}`);
    }

    default: {
      const exhaustiveCheck: never = workUnit;
      throw new Error(`Unknown role: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
};
