/**
 * PURPOSE: `packageScaffoldFilesTransformer` needs camelCase, PascalCase, AND UPPER_SNAKE_CASE
 * from one kebab-case `directoryName` in a single pass. `eslint-plugin`'s
 * `kebabToCamelCaseTransformer` / `kebabToPascalCaseTransformer` cover the first two but live in
 * a package this one may not reach into (only a package's own root barrels are public), and
 * neither derives the UPPER_SNAKE_CASE test-id form the seed templates also need.
 *
 * USAGE:
 * kebabCaseVariantsTransformer({ kebab: 'foo-bar' });
 * // Returns { camel: 'fooBar', pascal: 'FooBar', testId: 'FOO_BAR' }
 */
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { identifierContract } from '@dungeonmaster/shared/contracts';

export const kebabCaseVariantsTransformer = ({
  kebab,
}: {
  kebab: string;
}): { camel: Identifier; pascal: Identifier; testId: Identifier } => {
  const camel = kebab.replace(/-([a-z0-9])/gu, (match) => {
    const [, letter] = match.split('');
    return (letter ?? '').toUpperCase();
  });
  const pascal = camel.length > 0 ? camel.charAt(0).toUpperCase() + camel.slice(1) : camel;
  const testId = kebab.replaceAll('-', '_').toUpperCase();

  return {
    camel: identifierContract.parse(camel),
    pascal: identifierContract.parse(pascal),
    testId: identifierContract.parse(testId),
  };
};
