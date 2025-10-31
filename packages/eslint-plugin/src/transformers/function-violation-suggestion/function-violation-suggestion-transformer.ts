/**
 * PURPOSE: Generates helpful error messages for non-exported function violations with domain-specific guidance
 *
 * USAGE:
 * const message = functionViolationSuggestionTransformer({ functionType: 'guard' });
 * // Returns: "This appears to be a boolean check. Extract it to a new file in guards/ folder..."
 *
 * const transformerMessage = functionViolationSuggestionTransformer({ functionType: 'transformer' });
 * // Returns: "This appears to be a data transformation. Extract it to a new file in transformers/ folder..."
 */
import type { ErrorMessage } from '@questmaestro/shared/contracts';
import { errorMessageContract } from '@questmaestro/shared/contracts';

export const functionViolationSuggestionTransformer = ({
  functionType,
}: {
  functionType: 'guard' | 'transformer' | 'unknown';
}): ErrorMessage => {
  if (functionType === 'guard') {
    return errorMessageContract.parse(
      'This appears to be a boolean check. Extract it to a new file in guards/ folder with a DOMAIN-SPECIFIC name (e.g., guards/is-valid-user/is-valid-user-guard.ts). DO NOT use generic names like "helper", "util", "check". First, search the codebase to see if this functionality already exists before creating a new file.',
    );
  }

  if (functionType === 'transformer') {
    return errorMessageContract.parse(
      'This appears to be a data transformation. Extract it to a new file in transformers/ folder with a DOMAIN-SPECIFIC name (e.g., transformers/format-user-name/format-user-name-transformer.ts). DO NOT use generic names like "helper", "util", "formatter". First, search the codebase to see if this functionality already exists before creating a new file.',
    );
  }

  return errorMessageContract.parse(
    'Extract this function to a separate file according to project standards (guards/ for boolean checks, transformers/ for data transformations, brokers/ for business logic) with a DOMAIN-SPECIFIC name. DO NOT use generic names like "helper", "util", "process". First, search the codebase to see if this functionality already exists before creating a new file.',
  );
};
