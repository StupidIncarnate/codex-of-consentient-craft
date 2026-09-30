/**
 * PURPOSE: Converts a PascalCase identifier to a kebab-case identifier
 *
 * USAGE:
 * pascalCaseToKebabCaseTransformer({ pascal: 'AppHomeResponder' });
 * // Returns 'app-home-responder' as ContentText
 *
 * WHEN-TO-USE: Mapping JSX component identifiers (PascalCase) to file basenames (kebab-case) for
 * cross-referencing route metadata against responder file imports
 */

const PASCAL_BOUNDARY_PATTERN = /([A-Z])/gu;
const LEADING_DASH_PATTERN = /^-/u;

export const pascalCaseToKebabCaseTransformer = ({ pascal }: { pascal: string }): string => {
  const kebab = pascal
    .replace(PASCAL_BOUNDARY_PATTERN, '-$1')
    .toLowerCase()
    .replace(LEADING_DASH_PATTERN, '');
  return kebab;
};
