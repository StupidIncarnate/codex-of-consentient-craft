/**
 * PURPOSE: Extracts file-write adapter call sites from TypeScript source text using regex
 *
 * USAGE:
 * const calls = fileWriteCallsExtractTransformer({
 *   source: contentTextContract.parse('await fsWriteFileAdapter({ filePath: questPathBroker(id), ... })'),
 * });
 * // Returns [{ adapter: 'fsWriteFileAdapter', filePathArg: '<computed: questPathBroker>' }]
 *
 * WHEN-TO-USE: State-writes broker scanning source files for fsAppendFileAdapter,
 * fsWriteFileAdapter, and fsMkdirAdapter call sites to extract their filePath arguments
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import type { FileWriteCall } from '../../contracts/file-write-call/file-write-call-contract';
import { projectMapStatics } from '../../statics/project-map/project-map-statics';

// Matches: fsXxxAdapter({ filePath: 'literal' }) or fsXxxAdapter({ filePath: brokerName(...) })
// Capture groups: 1=adapterName 2=single-quoted 3=double-quoted 4=backtick-content 5=broker-name
// Adapter names sourced from projectMapStatics.fsWriteAdapterNames
const adapterAlternation = projectMapStatics.fsWriteAdapterNames.join('|');
const backtickSegment = '`([^`]*)`';
const FS_WRITE_PATTERN = new RegExp(
  `\\b(${adapterAlternation})\\s*\\(\\s*\\{[^}]*?filePath\\s*:\\s*(?:'([^']*)'|"([^"]*)"|${backtickSegment}|(\\w+)\\s*\\()`,
  'gu',
);

export const fileWriteCallsExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): FileWriteCall[] => {
  const results: FileWriteCall[] = [];
  FS_WRITE_PATTERN.lastIndex = 0;
  let match = FS_WRITE_PATTERN.exec(String(source));
  while (match !== null) {
    const [, adapterName, singleQuoted, doubleQuoted, backticked, brokerName] = match;
    if (adapterName === undefined) {
      match = FS_WRITE_PATTERN.exec(String(source));
      continue;
    }

    const computedArg = brokerName === undefined ? undefined : `<computed: ${brokerName}>`;
    const rawArg = singleQuoted ?? doubleQuoted ?? backticked ?? computedArg;

    if (rawArg === undefined) {
      match = FS_WRITE_PATTERN.exec(String(source));
      continue;
    }

    const filePathArg = contentTextContract.parse(rawArg);

    results.push({
      adapter: contentTextContract.parse(adapterName),
      filePathArg,
    });
    match = FS_WRITE_PATTERN.exec(String(source));
  }
  return results;
};
