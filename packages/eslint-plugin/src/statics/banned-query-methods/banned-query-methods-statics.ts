/**
 * PURPOSE: Defines banned testing-library query methods that should use testid or role queries instead
 *
 * USAGE:
 * import { bannedQueryMethodsStatics } from './statics/banned-query-methods/banned-query-methods-statics';
 * const isBanned = bannedQueryMethodsStatics.screenMethods.includes('getByText');
 * // Returns true
 *
 * WHEN-TO-USE: When implementing ESLint rules that enforce testid-based queries in React component tests
 */
const prefixes = ['get', 'getAll', 'query', 'queryAll', 'find', 'findAll'] as const;

const bannedSuffixes = [
  'ByText',
  'ByAltText',
  'ByTitle',
  'ByPlaceholderText',
  'ByDisplayValue',
  'ByLabelText',
] as const;

const screenMethods = prefixes.flatMap((prefix) =>
  bannedSuffixes.map((suffix) => `${prefix}${suffix}`),
);

const screenMethodSet = new Set(screenMethods);

const replacementRecord = Object.fromEntries(
  prefixes.flatMap((prefix) =>
    bannedSuffixes.map((suffix) => [`${prefix}${suffix}`, `${prefix}ByTestId`]),
  ),
);

export const bannedQueryMethodsStatics = {
  prefixes,
  bannedSuffixes,
  screenMethods,
  screenMethodSet,
  replacementRecord,
  containerMethods: ['querySelector', 'querySelectorAll'],
  containerMethodSet: new Set(['querySelector', 'querySelectorAll']),
} as const;
