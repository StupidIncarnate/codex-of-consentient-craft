/**
 * PURPOSE: Recursively walks an arbitrary statics-shaped object and returns a Map of every retained string value to its canonical dot-path within the source object (e.g. '.mcp.json' at locationsStatics.repoRoot.mcpJson maps to 'locationsStatics.repoRoot.mcpJson'). Used by the no-bare-location-literals rule to build its banned-literal set with reverse-lookup for error messages.
 *
 * USAGE:
 * locationLiteralKeyPathsTransformer({
 *   source: locationsStatics,
 *   rootName: 'locationsStatics',
 *   minRetainedLength: 8,
 * });
 * // Returns Map<PathSegment, Identifier> e.g. Map { '.mcp.json' => 'locationsStatics.repoRoot.mcpJson' }
 *
 * WHEN-TO-USE: Only the no-bare-location-literals rule should consume this. Filters out generic single-word literals via shouldRetainLocationLiteralGuard so JSDoc / unrelated string usage is not banned.
 *
 * NOTE: rule-broker imports `locationsStatics` from @dungeonmaster/shared/statics at module load. If the shared dist is stale this transformer simply walks the stale tree — caller is responsible for `npm run build --workspace=@dungeonmaster/shared` before lint runs (see plan/what-would-be-allowed-typed-stroustrup.md "Build-order requirement").
 */
import type { PathSegment, Identifier } from '@dungeonmaster/shared/contracts';
import { pathSegmentContract, identifierContract } from '@dungeonmaster/shared/contracts';
import { shouldRetainLocationLiteralGuard } from '../../guards/should-retain-location-literal/should-retain-location-literal-guard';

export const locationLiteralKeyPathsTransformer = ({
  source,
  rootName,
  minRetainedLength,
  accumulator,
}: {
  source: unknown;
  rootName: string;
  minRetainedLength: number;
  accumulator?: Map<PathSegment, Identifier>;
}): ReadonlyMap<PathSegment, Identifier> => {
  const out = accumulator ?? new Map<PathSegment, Identifier>();

  if (typeof source === 'string') {
    if (shouldRetainLocationLiteralGuard({ literal: source, minRetainedLength })) {
      const keyParsed = pathSegmentContract.parse(source);
      if (!out.has(keyParsed)) {
        out.set(keyParsed, identifierContract.parse(rootName));
      }
    }
    return out;
  }

  if (Array.isArray(source)) {
    source.forEach((item, index) => {
      locationLiteralKeyPathsTransformer({
        source: item,
        rootName: `${rootName}[${String(index)}]`,
        minRetainedLength,
        accumulator: out,
      });
    });
    return out;
  }

  if (typeof source === 'object' && source !== null) {
    for (const [key, child] of Object.entries(source)) {
      const childUnknown: unknown = child;
      locationLiteralKeyPathsTransformer({
        source: childUnknown,
        rootName: `${rootName}.${key}`,
        minRetainedLength,
        accumulator: out,
      });
    }
  }

  return out;
};
