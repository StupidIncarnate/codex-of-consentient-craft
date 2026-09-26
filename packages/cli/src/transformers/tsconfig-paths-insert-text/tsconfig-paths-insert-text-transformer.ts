/**
 * PURPOSE: The pure splice half of merging gateway `paths` entries into a tsconfig — given where
 * `typescriptTsconfigPathsLocateAdapter` says to insert and which entries are wanted, returns updated
 * text touching NOTHING else in the file, so every existing comment survives untouched. Returns the
 * ORIGINAL `tsconfigText` unchanged (same value) when every wanted entry is already present, or when
 * `compilerOptions` itself is missing — a caller compares old and new text to decide whether to write.
 *
 * USAGE:
 * tsconfigPathsInsertTextTransformer({
 *   tsconfigText: '{"compilerOptions": {"paths": {}}}',
 *   descriptor: TsconfigPathsLocateResultStub({situation: 'hasPaths', insertPos: 33, indent: '      ', needsLeadingComma: false, existingKeys: []}),
 *   entries: TsconfigPathsMapStub(),
 * });
 * // Returns the text with the missing entries spliced in at insertPos
 */

import { fileContentsContract, type FileContents } from '@dungeonmaster/shared/contracts';
import type { TsconfigPathsLocateResult } from '../../contracts/tsconfig-paths-locate-result/tsconfig-paths-locate-result-contract';
import type { TsconfigPathsMap } from '../../contracts/tsconfig-paths-map/tsconfig-paths-map-contract';

export const tsconfigPathsInsertTextTransformer = ({
  tsconfigText,
  descriptor,
  entries,
}: {
  tsconfigText: string;
  descriptor: TsconfigPathsLocateResult;
  entries: TsconfigPathsMap;
}): FileContents => {
  if (descriptor.situation === 'missingCompilerOptions') {
    return fileContentsContract.parse(tsconfigText);
  }

  const existingKeys = descriptor.situation === 'hasPaths' ? descriptor.existingKeys : [];
  const missingEntries = Object.entries(entries).filter(
    (entry) => !existingKeys.some((existingKey) => String(existingKey) === entry[0]),
  );

  if (missingEntries.length === 0) {
    return fileContentsContract.parse(tsconfigText);
  }

  const entryLines = missingEntries.map((entry, index) => {
    const [entryKey, entryValue] = entry;
    return `"${entryKey}": [${(entryValue ?? []).map((item) => JSON.stringify(item)).join(', ')}]${
      index < missingEntries.length - 1 ? ',' : ''
    }`;
  });

  const leadingComma = descriptor.needsLeadingComma ? ',' : '';

  if (descriptor.situation === 'hasPaths') {
    const insertionText = `${leadingComma}\n${entryLines
      .map((line) => `${descriptor.indent}${line}`)
      .join('\n')}`;

    return fileContentsContract.parse(
      tsconfigText.slice(0, descriptor.insertPos) +
        insertionText +
        tsconfigText.slice(descriptor.insertPos),
    );
  }

  const innerIndent = `${descriptor.indent}  `;
  const pathsBlock = `"paths": {\n${entryLines
    .map((line) => `${innerIndent}${line}`)
    .join('\n')}\n${descriptor.indent}}`;
  const insertionText = `${leadingComma}\n${descriptor.indent}${pathsBlock}`;

  return fileContentsContract.parse(
    tsconfigText.slice(0, descriptor.insertPos) +
      insertionText +
      tsconfigText.slice(descriptor.insertPos),
  );
};
