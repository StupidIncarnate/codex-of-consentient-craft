/**
 * PURPOSE: Converts a PascalCase identifier to a kebab-case identifier
 *
 * USAGE:
 * pascalCaseToKebabCaseTransformer({ pascal: contentTextContract.parse('AppHomeResponder') });
 * // Returns 'app-home-responder' as ContentText
 *
 * WHEN-TO-USE: Mapping JSX component identifiers (PascalCase) to file basenames (kebab-case) for
 * cross-referencing route metadata against responder file imports
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

const PASCAL_BOUNDARY_PATTERN = /([A-Z])/gu;
const LEADING_DASH_PATTERN = /^-/u;

export const pascalCaseToKebabCaseTransformer = ({
  pascal,
}: {
  pascal: ContentText;
}): ContentText => {
  const kebab = String(pascal)
    .replace(PASCAL_BOUNDARY_PATTERN, '-$1')
    .toLowerCase()
    .replace(LEADING_DASH_PATTERN, '');
  return contentTextContract.parse(kebab);
};
