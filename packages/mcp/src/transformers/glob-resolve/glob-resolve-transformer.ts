/**
 * PURPOSE: Resolves a user-provided glob pattern into a fully-qualified glob suffix for file scanning
 *
 * USAGE:
 * const suffix = globResolveTransformer({ glob: DiscoverInputStub({ glob: 'packages/mcp/src' }).glob });
 * // Returns 'packages/mcp/src/**\/*' for directory-like input
 */

import { globPatternContract } from '../../contracts/glob-pattern/glob-pattern-contract';
import type { GlobPattern } from '../../contracts/glob-pattern/glob-pattern-contract';
import type { DiscoverInput } from '../../contracts/discover-input/discover-input-contract';

type InputGlob = NonNullable<DiscoverInput['glob']>;

const FILE_EXTENSION_PATTERN = /\.\w+$/u;
const HAS_WILDCARD_PATTERN = /[*?{]/u;

export const globResolveTransformer = ({ glob }: { glob?: InputGlob }): GlobPattern => {
  if (!glob) {
    return globPatternContract.parse('**/*');
  }

  const globStr = String(glob);

  // If glob has a file extension, use as-is
  if (FILE_EXTENSION_PATTERN.test(globStr)) {
    return globPatternContract.parse(globStr);
  }

  // If glob already contains wildcards, use as-is
  if (HAS_WILDCARD_PATTERN.test(globStr)) {
    return globPatternContract.parse(globStr);
  }

  // Directory-like: append /**/*
  return globPatternContract.parse(`${globStr}/**/*`);
};
