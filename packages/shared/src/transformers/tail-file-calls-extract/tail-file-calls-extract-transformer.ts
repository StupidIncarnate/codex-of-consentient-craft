/**
 * PURPOSE: Extracts `tailFile({ path, ... })` call sites from TypeScript source text, matched by
 * IMPORT SOURCE — only a `tailFile` bound from `#gateway/node/fs` counts, so a same-named local
 * function is ignored. Returns the literal path argument or a computed reference.
 *
 * USAGE:
 * const calls = tailFileCallsExtractTransformer({
 *   source: contentTextContract.parse("import { tailFile } from '#gateway/node/fs';\ntailFile({ path: '/a.jsonl', onLine });"),
 * });
 * // Returns [{ filePathArg: '/a.jsonl' }]
 *
 * WHEN-TO-USE: File-bus-edges broker pairing tail (reader) call sites with write-side call sites
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import {
  tailFileCallContract,
  type TailFileCall,
} from '../../contracts/tail-file-call/tail-file-call-contract';
import { projectMapStatics } from '../../statics/project-map/project-map-statics';
import { filePathArgResolveTransformer } from '../file-path-arg-resolve/file-path-arg-resolve-transformer';
import { gatewayImportLocalNameFindTransformer } from '../gateway-import-local-name-find/gateway-import-local-name-find-transformer';

// Capture groups: 1=single-quoted 2=double-quoted 3=backtick-content 4=broker-name (has paren) 5=bare var
const backtickSegment = '`([^`]*)`';

export const tailFileCallsExtractTransformer = ({
  source,
}: {
  source: string;
}): TailFileCall[] => {
  const { importSource, importedName } = projectMapStatics.fsTailGatewayCall;
  const localName = gatewayImportLocalNameFindTransformer({
    source,
    importSource: importSource,
    importedName: importedName,
  });
  if (localName === undefined) {
    return [];
  }

  const pattern = new RegExp(
    `\\b${String(localName)}\\s*\\(\\s*\\{[^}]*?\\bpath\\s*:\\s*(?:'([^']*)'|"([^"]*)"|${backtickSegment}|(\\w+)\\s*\\(|(\\w+)\\b)`,
    'gu',
  );
  const results: TailFileCall[] = [];
  for (const match of String(source).matchAll(pattern)) {
    const [, singleQuoted, doubleQuoted, backticked, brokerName, bareVar] = match;
    const literal = singleQuoted ?? doubleQuoted ?? backticked;

    if (literal !== undefined) {
      results.push(tailFileCallContract.parse({ filePathArg: literal }));
    } else if (brokerName !== undefined) {
      results.push(
        tailFileCallContract.parse({
          filePathArg: `<computed: ${brokerName}>`,
        }),
      );
    } else if (bareVar !== undefined) {
      results.push(
        tailFileCallContract.parse({
          filePathArg: filePathArgResolveTransformer({
            source,
            variableName: bareVar,
          }),
        }),
      );
    }
  }
  return results;
};
