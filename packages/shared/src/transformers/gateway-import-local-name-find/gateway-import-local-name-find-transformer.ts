/**
 * PURPOSE: Finds the local binding a source file gives a named export of one import source, so a
 * call scan can match `tailFile(` only where `tailFile` really came from `#gateway/node/fs` and
 * never a same-named local function. Handles `import { a as b }` and multi-line specifier lists.
 *
 * USAGE:
 * gatewayImportLocalNameFindTransformer({
 *   source: "import { tailFile as tail } from '#gateway/node/fs';",
 *   importSource: '#gateway/node/fs',
 *   importedName: 'tailFile',
 * });
 * // Returns 'tail'; undefined when the source does not import it from that specifier
 */

const REGEX_SPECIALS = /[.*+?^${}()|[\]\\/]/gu;

export const gatewayImportLocalNameFindTransformer = ({
  source,
  importSource,
  importedName,
}: {
  source: string;
  importSource: string;
  importedName: string;
}): string | undefined => {
  const escapedSource = importSource.replace(REGEX_SPECIALS, '\\$&');
  const importPattern = new RegExp(
    `import\\s+(?!type\\s)\\{([^}]*)\\}\\s+from\\s+['"]${escapedSource}['"]`,
    'gu',
  );
  const wanted = importedName;

  for (const match of source.matchAll(importPattern)) {
    const [, specifierList = ''] = match;
    for (const specifier of specifierList.split(',')) {
      const [imported = '', local] = specifier.trim().split(/\s+as\s+/u);
      if (imported === wanted) {
        return local ?? imported;
      }
    }
  }
  return undefined;
};
