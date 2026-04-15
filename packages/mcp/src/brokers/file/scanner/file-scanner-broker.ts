/**
 * PURPOSE: Scan directory tree for files, optionally grep contents, and extract metadata when available
 *
 * USAGE:
 * const results = await fileScannerBroker({ glob: DiscoverInputStub({ glob: '**\/*.ts' }).glob });
 * // Returns array of FileMetadata for all matched files with optional metadata enrichment
 */

import { globFindAdapter } from '../../../adapters/glob/find/glob-find-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { sharedPackageResolveAdapter } from '../../../adapters/shared-package/resolve/shared-package-resolve-adapter';
import { metadataExtractorTransformer } from '../../../transformers/metadata-extractor/metadata-extractor-transformer';
import { signatureExtractorTransformer } from '../../../transformers/signature-extractor/signature-extractor-transformer';
import { fileTypeDetectorTransformer } from '../../../transformers/file-type-detector/file-type-detector-transformer';
import { functionNameExtractorTransformer } from '../../../transformers/function-name-extractor/function-name-extractor-transformer';
import { fileBasePathTransformer } from '../../../transformers/file-base-path/file-base-path-transformer';
import { pathToRelativeTransformer } from '../../../transformers/path-to-relative/path-to-relative-transformer';
import { pathToBasenameTransformer } from '../../../transformers/path-to-basename/path-to-basename-transformer';
import { contentGrepTransformer } from '../../../transformers/content-grep/content-grep-transformer';
import { globResolveTransformer } from '../../../transformers/glob-resolve/glob-resolve-transformer';
import { isMultiDotFileGuard } from '../../../guards/is-multi-dot-file/is-multi-dot-file-guard';
import { globPatternContract, pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { PathSegment } from '@dungeonmaster/shared/contracts';
import { fileMetadataContract } from '../../../contracts/file-metadata/file-metadata-contract';
import type { FileMetadata } from '../../../contracts/file-metadata/file-metadata-contract';
import type { DiscoverInput } from '../../../contracts/discover-input/discover-input-contract';

type GlobPattern = NonNullable<DiscoverInput['glob']>;
type GrepPattern = NonNullable<DiscoverInput['grep']>;
type ContextLines = NonNullable<DiscoverInput['context']>;

export const fileScannerBroker = async ({
  glob,
  grep,
  context,
}: {
  glob?: GlobPattern;
  grep?: GrepPattern;
  context?: ContextLines;
}): Promise<readonly FileMetadata[]> => {
  // 1. Resolve glob pattern and scan from cwd + shared package
  const cwdPath = pathSegmentContract.parse(process.cwd());
  const globSuffix = globResolveTransformer({ ...(glob && { glob }) });
  const pattern = globPatternContract.parse(`${cwdPath}/${globSuffix}`);
  const projectFiles = await globFindAdapter({ pattern, cwd: cwdPath });

  // Also scan @dungeonmaster/shared for broad (unscoped) globs starting with **
  const isBroadGlob = globSuffix.startsWith('**');
  const sharedPath = isBroadGlob ? sharedPackageResolveAdapter() : null;
  const sharedFilePaths: PathSegment[] = [];
  const sharedBasePathStr = sharedPath ? pathSegmentContract.parse(sharedPath) : null;
  if (sharedBasePathStr !== null) {
    const sharedPattern = globPatternContract.parse(`${sharedBasePathStr}/${globSuffix}`);
    const foundSharedFiles = await globFindAdapter({
      pattern: sharedPattern,
      cwd: sharedBasePathStr,
    });
    sharedFilePaths.push(...foundSharedFiles);
  }

  // Build a set of shared file paths for later path conversion
  const sharedFileSet = new Set<FileMetadata['path']>(
    sharedFilePaths.map((fp) => pathSegmentContract.parse(fp)),
  );

  // Combine project files and shared files, deduped by absolute path.
  // A broad glob run from the monorepo root can hit the same shared source both
  // via the cwd scan and the secondary shared-path scan — dedup prevents doubled results.
  const seenPaths = new Set<PathSegment>();
  const allFilePaths: PathSegment[] = [];
  for (const fp of [...projectFiles, ...sharedFilePaths]) {
    if (seenPaths.has(fp)) continue;
    seenPaths.add(fp);
    allFilePaths.push(fp);
  }

  // 2. Extract metadata from each file (parallel for performance)
  const metadataPromises = allFilePaths.map(async (filepath) => {
    const contents = await fsReadFileAdapter({ filepath });

    // Grep integration: if grep provided, record whether content matches
    const hits: FileMetadata['hits'] = grep
      ? contentGrepTransformer({
          contents,
          pattern: grep,
          ...(context !== undefined && { context }),
        })
      : undefined;

    const matchesGrep = !grep || (hits !== undefined && hits.length > 0);

    // Extract function name
    const functionName = functionNameExtractorTransformer({ filepath });

    // Extract signature (try-optional)
    const signature: FileMetadata['signature'] = (() => {
      try {
        return (
          signatureExtractorTransformer({
            fileContents: contents,
            functionName,
          }) ?? undefined
        );
      } catch {
        return undefined;
      }
    })();

    // Extract metadata (try-optional)
    const metadata: ReturnType<typeof metadataExtractorTransformer> = (() => {
      try {
        return metadataExtractorTransformer({ fileContents: contents });
      } catch {
        return null;
      }
    })();

    // Detect file type
    const detectedFileType = fileTypeDetectorTransformer({ filepath });

    const fileMetadata = fileMetadataContract.parse({
      name: functionName,
      path: filepath,
      fileType: detectedFileType,
      purpose: metadata?.purpose,
      signature,
      usage: metadata?.usage,
      metadata: metadata?.metadata,
      relatedFiles: [],
      ...(matchesGrep && hits && { hits }),
    });

    return { fileMetadata, matchesGrep };
  });

  // Use allSettled so that one unreadable file (e.g. broken symlink, permission error)
  // doesn't abort the entire scan. Rejected reads are silently dropped; callers still
  // get partial results for the files that were readable.
  const settled = await Promise.allSettled(metadataPromises);
  const allResults = settled
    .filter(
      (r): r is PromiseFulfilledResult<{ fileMetadata: FileMetadata; matchesGrep: boolean }> =>
        r.status === 'fulfilled',
    )
    .map((r) => r.value);

  // 2a. Filter by grep, but also keep implementation files whose multi-dot siblings matched.
  // This ensures the LLM always sees the real entry file alongside proxy/test hits.
  const matchedBasePaths = new Set<FileMetadata['path']>();
  for (const { fileMetadata, matchesGrep } of allResults) {
    if (matchesGrep && isMultiDotFileGuard({ filepath: fileMetadata.path })) {
      matchedBasePaths.add(fileBasePathTransformer({ filepath: fileMetadata.path }));
    }
  }

  const filesWithMetadata = allResults
    .filter(({ fileMetadata, matchesGrep }) => {
      if (matchesGrep) {
        return true;
      }
      if (isMultiDotFileGuard({ filepath: fileMetadata.path })) {
        return false;
      }
      return matchedBasePaths.has(fileBasePathTransformer({ filepath: fileMetadata.path }));
    })
    .map(({ fileMetadata }) => fileMetadata);

  // 3. Separate implementation files from multi-dot files for companion linking
  const implementationFiles = filesWithMetadata.filter(
    (file) => !isMultiDotFileGuard({ filepath: file.path }),
  );
  const multiDotFiles = filesWithMetadata.filter((file) =>
    isMultiDotFileGuard({ filepath: file.path }),
  );

  // 4. Build a map of base paths to multi-dot files for quick lookup
  const multiDotFilesByBase = new Map<FileMetadata['path'], FileMetadata['path'][]>();
  for (const file of multiDotFiles) {
    const basePath = fileBasePathTransformer({ filepath: file.path });
    const existing = multiDotFilesByBase.get(basePath) ?? [];
    multiDotFilesByBase.set(basePath, [...existing, file.path]);
  }

  // 5. Enrich implementation files with related files and make paths relative
  const enrichedImplementationFiles = implementationFiles.map((file) => {
    const basePath = fileBasePathTransformer({ filepath: file.path });
    const related = multiDotFilesByBase.get(basePath) ?? [];

    // For shared files, convert absolute path to @dungeonmaster/shared/... format
    const isShared = sharedFileSet.has(file.path);
    const displayPath =
      isShared && sharedBasePathStr
        ? pathSegmentContract.parse(file.path.replace(sharedBasePathStr, '@dungeonmaster/shared'))
        : pathToRelativeTransformer({ filepath: file.path });

    const relatedFilenames = related
      .map((relatedPath) => pathToBasenameTransformer({ filepath: relatedPath }))
      .sort();

    return fileMetadataContract.parse({
      ...file,
      path: displayPath,
      relatedFiles: relatedFilenames,
    });
  });

  // 6. Multi-dot files appear as regular results too (with relative paths)
  const enrichedMultiDotFiles = multiDotFiles.map((file) => {
    const isShared = sharedFileSet.has(file.path);
    const displayPath =
      isShared && sharedBasePathStr
        ? pathSegmentContract.parse(file.path.replace(sharedBasePathStr, '@dungeonmaster/shared'))
        : pathToRelativeTransformer({ filepath: file.path });

    return fileMetadataContract.parse({
      ...file,
      path: displayPath,
    });
  });

  // 7. Combine and sort alphabetically by name
  const results = [...enrichedImplementationFiles, ...enrichedMultiDotFiles];

  return results.sort((a, b) => a.name.localeCompare(b.name));
};
