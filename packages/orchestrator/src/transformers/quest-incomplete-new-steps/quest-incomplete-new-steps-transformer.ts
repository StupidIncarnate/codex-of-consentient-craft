/**
 * PURPOSE: Returns descriptions of brand-new steps that fail full dependency-step validation
 *
 * USAGE:
 * questIncompleteNewStepsTransformer({ steps: validated.steps, existingStepIds });
 * // Returns ErrorMessage[] — e.g. ["step 'web-quest-delete-e2e' is a new step but is missing or has invalid required fields: assertions"].
 *
 * The modify-quest input contract accepts a step in either full shape OR partial-patch shape
 * (`{ id, ...changed-fields }`). A partial patch is only legitimate when it edits an EXISTING step.
 * When a brand-new step (id not yet on the quest) arrives missing required fields, it slips through
 * the partial branch and lands as an incomplete object — which later crashes the raw-input invariant
 * transformers with an opaque "Cannot read properties of undefined" error. This transformer catches
 * that case early and returns a clean, field-named failedCheck instead.
 */

import { dependencyStepContract, errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage, ItemWithId } from '@dungeonmaster/shared/contracts';

export const questIncompleteNewStepsTransformer = ({
  steps,
  existingStepIds,
}: {
  steps: readonly ItemWithId[];
  existingStepIds: ReadonlySet<string>;
}): ErrorMessage[] => {
  const offenders: ErrorMessage[] = [];

  for (const step of steps) {
    const id = String(step.id);
    if (step._delete === true) {
      continue;
    }
    if (existingStepIds.has(id)) {
      continue;
    }

    const parsed = dependencyStepContract.safeParse(step);
    if (!parsed.success) {
      const fields = [
        ...new Set(parsed.error.issues.map((issue) => issue.path.join('.') || '(root)')),
      ].join(', ');
      offenders.push(
        errorMessageContract.parse(
          `step '${id}' is a new step but is missing or has invalid required fields: ${fields}`,
        ),
      );
    }
  }

  return offenders;
};
