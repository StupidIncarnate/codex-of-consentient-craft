/**
 * PURPOSE: Extracts file-write gateway call sites (`appendFile`, `writeFile`, `ensureDir` from
 * `#gateway/node/fs__promises`) from TypeScript source text, matched by IMPORT SOURCE so a
 * same-named local function is ignored. The path is the first positional argument.
 *
 * USAGE:
 * const calls = fileWriteCallsExtractTransformer({
 *   source: contentTextContract.parse("import { appendFile } from '#gateway/node/fs__promises';\nawait appendFile('/a.jsonl', line);"),
 * });
 * // Returns [{ adapter: 'appendFile', filePathArg: '/a.jsonl' }]
 *
 * WHEN-TO-USE: State-writes and file-bus-edges brokers scanning source files for write call sites
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import {
  fileWriteCallContract,
  type FileWriteCall,
} from '../../contracts/file-write-call/file-write-call-contract';
import { projectMapStatics } from '../../statics/project-map/project-map-statics';
import { filePathArgResolveTransformer } from '../file-path-arg-resolve/file-path-arg-resolve-transformer';
import { gatewayImportLocalNameFindTransformer } from '../gateway-import-local-name-find/gateway-import-local-name-find-transformer';

// Capture groups: 1=local name 2=single-quoted 3=double-quoted 4=backtick-content 5=broker-name (has paren) 6=bare var
const backtickSegment = '`([^`]*)`';

export const fileWriteCallsExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): FileWriteCall[] => {
  const { importSource, importedNames } = projectMapStatics.fsWriteGatewayCalls;
  const importedByLocal = new Map<ContentText, ContentText>();
  for (const importedName of importedNames) {
    const imported = contentTextContract.parse(importedName);
    const localName = gatewayImportLocalNameFindTransformer({
      source,
      importSource: contentTextContract.parse(importSource),
      importedName: imported,
    });
    if (localName !== undefined) {
      importedByLocal.set(localName, imported);
    }
  }
  if (importedByLocal.size === 0) {
    return [];
  }

  const alternation = [...importedByLocal.keys()].join('|');
  const pattern = new RegExp(
    `\\b(${alternation})\\s*\\(\\s*(?:'([^']*)'|"([^"]*)"|${backtickSegment}|(\\w+)\\s*\\(|(\\w+)\\b)`,
    'gu',
  );
  const results: FileWriteCall[] = [];
  for (const match of String(source).matchAll(pattern)) {
    const [, matchedLocal = '', singleQuoted, doubleQuoted, backticked, brokerName, bareVar] =
      match;
    const adapter = importedByLocal.get(contentTextContract.parse(matchedLocal));
    const literal = singleQuoted ?? doubleQuoted ?? backticked;

    if (adapter !== undefined) {
      if (literal !== undefined) {
        results.push(
          fileWriteCallContract.parse({ adapter, filePathArg: contentTextContract.parse(literal) }),
        );
      } else if (brokerName !== undefined) {
        results.push(
          fileWriteCallContract.parse({
            adapter,
            filePathArg: contentTextContract.parse(`<computed: ${brokerName}>`),
          }),
        );
      } else if (bareVar !== undefined) {
        results.push(
          fileWriteCallContract.parse({
            adapter,
            filePathArg: filePathArgResolveTransformer({
              source,
              variableName: contentTextContract.parse(bareVar),
            }),
          }),
        );
      }
    }
  }
  return results;
};
