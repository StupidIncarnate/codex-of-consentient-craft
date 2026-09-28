/**
 * PURPOSE: Finds the local binding a source file gives a named export of one import source, so a
 * call scan can match `tailFile(` only where `tailFile` really came from `#gateway/node/fs` and
 * never a same-named local function. Handles `import { a as b }` and multi-line specifier lists.
 *
 * USAGE:
 * gatewayImportLocalNameFindTransformer({
 *   source: contentTextContract.parse("import { tailFile as tail } from '#gateway/node/fs';"),
 *   importSource: contentTextContract.parse('#gateway/node/fs'),
 *   importedName: contentTextContract.parse('tailFile'),
 * });
 * // Returns 'tail'; undefined when the source does not import it from that specifier
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

const REGEX_SPECIALS = /[.*+?^${}()|[\]\\/]/gu;

export const gatewayImportLocalNameFindTransformer = ({
  source,
  importSource,
  importedName,
}: {
  source: ContentText;
  importSource: ContentText;
  importedName: ContentText;
}): ContentText | undefined => {
  const escapedSource = String(importSource).replace(REGEX_SPECIALS, '\\$&');
  const importPattern = new RegExp(
    `import\\s+(?!type\\s)\\{([^}]*)\\}\\s+from\\s+['"]${escapedSource}['"]`,
    'gu',
  );
  const wanted = String(importedName);

  for (const match of String(source).matchAll(importPattern)) {
    const [, specifierList = ''] = match;
    for (const specifier of specifierList.split(',')) {
      const [imported = '', local] = specifier.trim().split(/\s+as\s+/u);
      if (imported === wanted) {
        return contentTextContract.parse(local ?? imported);
      }
    }
  }
  return undefined;
};
