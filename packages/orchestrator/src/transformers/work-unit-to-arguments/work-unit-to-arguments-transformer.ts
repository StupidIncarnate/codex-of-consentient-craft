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
      const { step, questId, relatedContracts, relatedObservables } = workUnit;
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
          parts.push(
            contentTextContract.parse(`    - ${observable.description} (${observable.type})`),
          );
        }
      }

      parts.push(contentTextContract.parse(`Quest ID: ${questId}`));

      return contentTextContract.parse(parts.join('\n'));
    }

    case 'siegemaster': {
      const { questId: siegeQuestId, observables } = workUnit;
      const siegeParts: ContentText[] = [contentTextContract.parse(`Quest ID: ${siegeQuestId}`)];

      siegeParts.push(contentTextContract.parse('Observable Type Reference:'));
      for (const [type, desc] of Object.entries(outcomeTypeDescriptionsStatics)) {
        siegeParts.push(contentTextContract.parse(`  - \`${type}\` — ${desc}`));
      }

      if (observables.length > 0) {
        siegeParts.push(contentTextContract.parse('Observables:'));
        for (const observable of observables) {
          siegeParts.push(
            contentTextContract.parse(`    - ${observable.description} (${observable.type})`),
          );
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
      const pathParts: ContentText[] = [contentTextContract.parse(`Quest ID: ${workUnit.questId}`)];

      if (workUnit.failureContext !== undefined) {
        pathParts.push(contentTextContract.parse(`\nFAILURE CONTEXT:\n${workUnit.failureContext}`));
      }

      return contentTextContract.parse(pathParts.join('\n'));
    }

    default: {
      const exhaustiveCheck: never = workUnit;
      throw new Error(`Unknown role: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
};
