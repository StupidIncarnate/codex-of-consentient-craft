/**
 * PURPOSE: Resolves a user-provided glob pattern into a fully-qualified glob suffix for file scanning
 *
 * USAGE:
 * const suffix = globResolveTransformer({ glob: DiscoverInputStub({ glob: 'packages/mcp/src' }).glob });
 * // Returns 'packages/mcp/src/**\/*' for directory-like input
 */

import type { DiscoverInput } from '../../contracts/discover-input/discover-input-contract';

type InputGlob = NonNullable<DiscoverInput['glob']>;

const FILE_EXTENSION_PATTERN = /\.\w+$/u;
const HAS_WILDCARD_PATTERN = /[*?{]/u;

export const globResolveTransformer = ({ glob }: { glob?: InputGlob }): string => {
  if (!glob) {
    return '**/*';
  }

  const globStr = String(glob);

  // If glob has a file extension, use as-is
  if (FILE_EXTENSION_PATTERN.test(globStr)) {
    return globStr;
  }

  // If glob already contains wildcards, use as-is
  if (HAS_WILDCARD_PATTERN.test(globStr)) {
    return globStr;
  }

  // Directory-like: append /**/*
  return `${globStr}/**/*`;
};
