/**
 * PURPOSE: `packageScaffoldFilesTransformer` needs camelCase, PascalCase, AND UPPER_SNAKE_CASE
 * from one kebab-case `directoryName` in a single pass. `eslint-plugin`'s
 * `kebabToCamelCaseTransformer` / `kebabToPascalCaseTransformer` cover the first two but live in
 * a package this one may not reach into (only a package's own folder-type barrels are public), and
 * neither derives the UPPER_SNAKE_CASE test-id form the seed templates also need.
 *
 * USAGE:
 * kebabCaseVariantsTransformer({ kebab: 'foo-bar' });
 * // Returns { camel: 'fooBar', pascal: 'FooBar', testId: 'FOO_BAR' }
 */

export const kebabCaseVariantsTransformer = ({
  kebab,
}: {
  kebab: string;
}): { camel: string; pascal: string; testId: string } => {
  const camel = kebab.replace(/-([a-z0-9])/gu, (match) => {
    const [, letter] = match.split('');
    return (letter ?? '').toUpperCase();
  });
  const pascal = camel.length > 0 ? camel.charAt(0).toUpperCase() + camel.slice(1) : camel;
  const testId = kebab.replaceAll('-', '_').toUpperCase();

  return {
    camel: camel,
    pascal: pascal,
    testId: testId,
  };
};
