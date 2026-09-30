import { gatewaySubpathBarrelParseContract } from '../../contracts/gateway-subpath-barrel-parse/gateway-subpath-barrel-parse-contract';
import type { GatewaySubpathBarrelParse } from '../../contracts/gateway-subpath-barrel-parse/gateway-subpath-barrel-parse-contract';
/**
 * PURPOSE: Reads one gateway subpath's own entry-point barrel (e.g. `fs/fs.ts`) and recovers, from
 * its TEXT, the two facts the discovery tools need to describe it: the real module it passes
 * through (the target of its own `export * from '<module>';` line, when it has one) and the names
 * it adds on top (every `export { name } from './wrapper-folder/...'` line, which is how the
 * per-wrapper folder layout re-exports each of "our" functions). A line whose `from` target is NOT
 * relative (`export { default } from 'zod';`) is forwarding the SAME real module the file already
 * passes through, not a wrapper, so it is excluded — otherwise a pure pass-through subpath like
 * `#gateway/npm/zod` would misreport `default` as one of our own wrappers. A subpath with no
 * `export * from` line (`bin/*`, whose barrel re-exports only our own wrapper functions around a
 * spawned program, and `browser/*`, whose pass-throughs read `globalThis` directly rather than
 * re-exporting a module) has no real module to report — this is a difference in the CODE those
 * folders write, not a gap in this parser.
 *
 * USAGE:
 * gatewaySubpathBarrelParseTransformer({ barrelContent: ContentTextStub({ value: "export * from 'fs';\nexport { existsSync } from './exists-sync/exists-sync';" }) });
 * // Returns { realModule: 'fs', wrapperNames: ['existsSync'] }
 */


const STAR_EXPORT_PATTERN = /^export \* from ['"]([^'"]+)['"];?\s*$/u;
const NAMED_EXPORT_PATTERN = /^export \{\s*([^}]+?)\s*\} from ['"](\.[^'"]+)['"];?\s*$/u;
const ALIAS_MARKER = ' as ';
const EXPORT_TYPE_PREFIX = 'export type';

export const gatewaySubpathBarrelParseTransformer = ({
  barrelContent,
}: {
  barrelContent: string;
}): GatewaySubpathBarrelParse => {
  const lines = String(barrelContent)
    .split('\n')
    .map((line) => line.trim());

  const starLine = lines.find((line) => STAR_EXPORT_PATTERN.test(line));
  const starMatch = starLine === undefined ? null : STAR_EXPORT_PATTERN.exec(starLine);
  const realModule = starMatch === null ? undefined : (starMatch[1] ?? '');

  const wrapperNames = lines
    .filter((line) => !line.startsWith(EXPORT_TYPE_PREFIX))
    .flatMap((line) => {
      const namedMatch = NAMED_EXPORT_PATTERN.exec(line);
      if (namedMatch === null) {
        return [];
      }

      return (namedMatch[1] ?? '')
        .split(',')
        .map((clause) => {
          const aliasIndex = clause.indexOf(ALIAS_MARKER);
          return aliasIndex === -1
            ? clause.trim()
            : clause.slice(aliasIndex + ALIAS_MARKER.length).trim();
        })
        .filter((name) => name.length > 0)
        .map((name) => name);
    });

  return gatewaySubpathBarrelParseContract.parse({
    ...(realModule !== undefined && { realModule }),
    wrapperNames,
  });
};
