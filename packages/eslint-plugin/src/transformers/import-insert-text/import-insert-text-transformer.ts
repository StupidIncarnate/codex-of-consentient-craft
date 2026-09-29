/**
 * PURPOSE: Writes the text a fix inserts to import one name: `, Name` after the last specifier of an
 * existing import of the same module and kind, else a whole import statement. Pair it with
 * astImportInsertAnchorTransformer, which finds where the text goes.
 *
 * USAGE:
 * importInsertTextTransformer({ anchor, name: 'Quest', source: '../quest/quest-contract', importKind: 'type' });
 * // Returns ", Quest" after a specifier anchor, "\nimport type { Quest } from '../quest/quest-contract';" after an import, and the same statement with its own trailing newline when the file has no import
 */
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const importInsertTextTransformer = ({
  anchor,
  name,
  source,
  importKind,
}: {
  anchor: Tsestree | null;
  name: string;
  source: string;
  importKind: 'type' | 'value';
}): ContentText => {
  if (anchor?.type === 'ImportSpecifier') {
    return contentTextContract.parse(`, ${name}`);
  }

  const statement = `import ${importKind === 'type' ? 'type ' : ''}{ ${name} } from '${source}';`;
  return contentTextContract.parse(anchor === null ? `${statement}\n` : `\n${statement}`);
};
