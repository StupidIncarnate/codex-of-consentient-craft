/**
 * PURPOSE: Applies wanted `compilerOptions` values to a tsconfig's TEXT at the positions
 * `tsconfigCompilerOptionsLocateTransformer` reported: an option holding another value has
 * just that value replaced, a missing option is appended after the last one, and every other
 * character — comments, spacing, key order — stays as it was. An option already holding the wanted
 * value is left alone, so a second run changes nothing. A file with no `compilerOptions` block is
 * returned unchanged.
 *
 * USAGE:
 * tsconfigCompilerOptionsSetTextTransformer({ tsconfigText, descriptor, options: TsconfigCompilerOptionsStub({ module: 'node16' }) });
 * // Returns the text with "module" set to "node16"
 */

import { fileContentsContract, type FileContents } from '@dungeonmaster/shared/contracts';
import type { TsconfigCompilerOptionsLocateResult } from '../../contracts/tsconfig-compiler-options-locate-result/tsconfig-compiler-options-locate-result-contract';
import type { TsconfigCompilerOptions } from '../../contracts/tsconfig-compiler-options/tsconfig-compiler-options-contract';

const NESTED_INDENT_WIDTH = 2;

export const tsconfigCompilerOptionsSetTextTransformer = ({
  tsconfigText,
  descriptor,
  options,
}: {
  tsconfigText: string;
  descriptor: TsconfigCompilerOptionsLocateResult;
  options: TsconfigCompilerOptions;
}): FileContents => {
  if (descriptor.situation === 'missingCompilerOptions') {
    return fileContentsContract.parse(tsconfigText);
  }

  const entries = Object.entries(options).map(([key, value]) => ({
    key,
    text:
      typeof value === 'string'
        ? JSON.stringify(value)
        : `[${value.map((item) => JSON.stringify(item)).join(', ')}]`,
  }));

  const replacements = entries.flatMap((entry) => {
    const found = descriptor.existing.find((option) => String(option.key) === entry.key);
    if (found === undefined) {
      return [];
    }
    const current = tsconfigText.slice(found.valueStart, found.valueEnd).replace(/\s+/gu, '');
    return current === entry.text.replace(/\s+/gu, '')
      ? []
      : [{ start: Number(found.valueStart), end: Number(found.valueEnd), text: entry.text }];
  });

  const missing = entries.filter(
    (entry) => !descriptor.existing.some((option) => String(option.key) === entry.key),
  );

  const closingIndent =
    descriptor.existing.length === 0 ? `\n${descriptor.indent.slice(0, -NESTED_INDENT_WIDTH)}` : '';
  const insertions =
    missing.length === 0
      ? []
      : [
          {
            start: Number(descriptor.insertPos),
            end: Number(descriptor.insertPos),
            text: `${descriptor.needsLeadingComma ? ',' : ''}\n${missing
              .map((entry) => `${descriptor.indent}"${entry.key}": ${entry.text}`)
              .join(',\n')}${closingIndent}`,
          },
        ];

  const edits = [...replacements, ...insertions].sort((left, right) => right.start - left.start);

  return fileContentsContract.parse(
    edits.reduce(
      (text, edit) => text.slice(0, edit.start) + edit.text + text.slice(edit.end),
      tsconfigText,
    ),
  );
};
