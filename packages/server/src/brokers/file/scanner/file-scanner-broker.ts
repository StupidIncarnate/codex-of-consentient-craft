/**
 * PURPOSE: Scan directory tree for files and extract their metadata (PURPOSE, USAGE, signatures)
 *
 * USAGE:
 * const results = await fileScannerBroker({ path: FilePathStub({ value: 'src/guards' }), fileType: FileTypeStub({ value: 'guard' }) });
 * // Returns array of FileMetadata with extracted metadata and signatures
 */

import { globFindAdapter } from '../../../adapters/glob/find/glob-find-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { sharedPackageResolveAdapter } from '../../../adapters/shared-package/resolve/shared-package-resolve-adapter';
import { fileExtensionsStatics } from '@dungeonmaster/shared/statics';
import { metadataExtractorTransformer } from '../../../transformers/metadata-extractor/metadata-extractor-transformer';
import { signatureExtractorTransformer } from '../../../transformers/signature-extractor/signature-extractor-transformer';
import { fileTypeDetectorTransformer } from '../../../transformers/file-type-detector/file-type-detector-transformer';
import { functionNameExtractorTransformer } from '../../../transformers/function-name-extractor/function-name-extractor-transformer';
import { fileBasePathTransformer } from '../../../transformers/file-base-path/file-base-path-transformer';
import { pathToRelativeTransformer } from '../../../transformers/path-to-relative/path-to-relative-transformer';
import { pathToBasenameTransformer } from '../../../transformers/path-to-basename/path-to-basename-transformer';
import { hasExportedFunctionGuard } from '../../../guards/has-exported-function/has-exported-function-guard';
import { isMultiDotFileGuard } from '../../../guards/is-multi-dot-file/is-multi-dot-file-guard';
import { globPatternContract } from '../../../contracts/glob-pattern/glob-pattern-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { fileMetadataContract } from '../../../contracts/file-metadata/file-metadata-contract';
import { fileWithSourceContract } from '../../../contracts/file-with-source/file-with-source-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { FileType } from '../../../contracts/file-type/file-type-contract';
import type { FileMetadata } from '../../../contracts/file-metadata/file-metadata-contract';
import type { FileWithSource } from '../../../contracts/file-with-source/file-with-source-contract';

type FileSource = 'project' | 'shared';

export const fileScannerBroker = async ({
  path,
  fileType,
  search,
  name,
}: {
  path?: FilePath;
  fileType?: FileType;
  search?: string;
  name?: string;
}): Promise<readonly FileMetadata[]> => {
  // 1. Get scan roots: project + shared package (if available)
  const cwdPath = filePathContract.parse(process.cwd());
  const sharedPath = sharedPackageResolveAdapter();

  // Build list of roots to scan with their source type
  const scanRoots: { root: FilePath; source: FileSource }[] = [
    { root: cwdPath, source: 'project' },
  ];

  if (sharedPath !== null) {
    scanRoots.push({
      root: filePathContract.parse(sharedPath),
      source: 'shared',
    });
  }

  // 2. Scan all roots in parallel and collect files with their source
  const scanPromises = scanRoots.map(async ({ root, source }) => {
    // For shared package, only scan the src directory structure
    // For project, respect the path parameter
    const scanPath =
      source === 'shared' ? root : path ? filePathContract.parse(`${root}/${path}`) : root;

    const pattern = globPatternContract.parse(`${scanPath}/**/${fileExtensionsStatics.globs.all}`);
    const files = await globFindAdapter({ pattern, cwd: root });

    return files.map((filepath) =>
      fileWithSourceContract.parse({
        filepath,
        source,
        basePath: absoluteFilePathContract.parse(root),
      }),
    );
  });

  const scanResults = await Promise.all(scanPromises);
  const allFilesWithSource: FileWithSource[] = scanResults.flat();

  // 3. Filter by file type if provided
  const filteredFiles = fileType
    ? allFilesWithSource.filter(({ filepath }) => {
        const detectedType = fileTypeDetectorTransformer({ filepath });
        return detectedType === fileType;
      })
    : allFilesWithSource;

  // 4. Extract metadata from each file (parallel for performance)
  const metadataPromises = filteredFiles.map(async ({ filepath, source, basePath }) => {
    // Read file
    const contents = await fsReadFileAdapter({ filepath });

    // Check if this is a multi-dot file (.test.ts, .proxy.ts, etc.)
    const isMultiDot = isMultiDotFileGuard({ filepath });

    // For implementation files (non-multi-dot), require exported function
    if (!isMultiDot) {
      const hasExport = hasExportedFunctionGuard({ fileContents: contents });
      if (!hasExport) {
        return null; // Skip implementation files without exported functions
      }
    }

    // Extract function name
    const functionName = functionNameExtractorTransformer({ filepath });

    // Extract signature (optional - may not match pattern)
    const signature = signatureExtractorTransformer({
      fileContents: contents,
      functionName,
    });

    // Extract metadata (optional)
    const metadata = metadataExtractorTransformer({ fileContents: contents });

    // Detect file type
    const detectedFileType = fileTypeDetectorTransformer({ filepath });

    // For shared package files, transform absolute path to @dungeonmaster/shared/...
    const displayPath =
      source === 'shared'
        ? absoluteFilePathContract.parse(filepath.replace(basePath, '@dungeonmaster/shared'))
        : filepath;

    return fileMetadataContract.parse({
      name: functionName,
      path: displayPath,
      fileType: detectedFileType,
      purpose: metadata?.purpose,
      signature: signature ?? undefined,
      usage: metadata?.usage,
      metadata: metadata?.metadata,
      relatedFiles: [],
      source,
    });
  });

  const allResults = await Promise.all(metadataPromises);
  const filesWithMetadata = allResults.filter((r): r is FileMetadata => r !== null);

  // 5. Separate implementation files from multi-dot files (.test.ts, .proxy.ts, etc.)
  const implementationFiles = filesWithMetadata.filter(
    (file) => !isMultiDotFileGuard({ filepath: file.path }),
  );
  const multiDotFiles = filesWithMetadata.filter((file) =>
    isMultiDotFileGuard({ filepath: file.path }),
  );

  // 6. Build a map of base paths to multi-dot files for quick lookup
  const multiDotFilesByBase = new Map<FileMetadata['path'], FileMetadata['path'][]>();
  for (const file of multiDotFiles) {
    const basePath = fileBasePathTransformer({ filepath: file.path });
    const existing = multiDotFilesByBase.get(basePath) ?? [];
    multiDotFilesByBase.set(basePath, [...existing, file.path]);
  }

  // 7. Add related files to implementation files and make paths relative
  const results = implementationFiles.map((file) => {
    const basePath = fileBasePathTransformer({ filepath: file.path });
    const related = multiDotFilesByBase.get(basePath) ?? [];

    // For project files, convert to relative paths
    // For shared files, keep @dungeonmaster/shared/... format
    const relativePath =
      file.source === 'shared' ? file.path : pathToRelativeTransformer({ filepath: file.path });

    const relatedFilenames = related
      .map((relatedPath) => pathToBasenameTransformer({ filepath: relatedPath }))
      .sort(); // Sort alphabetically for consistent output

    return fileMetadataContract.parse({
      ...file,
      path: relativePath,
      relatedFiles: relatedFilenames,
    });
  });

  // 8. Filter by name if provided
  if (name) {
    return results.filter((r) => r.name === name);
  }

  // 9. Filter by search if provided
  const finalResults = search
    ? results.filter((r) => {
        const lowerSearch = search.toLowerCase();
        return (
          (r.purpose && r.purpose.toLowerCase().includes(lowerSearch)) ||
          r.name.toLowerCase().includes(lowerSearch)
        );
      })
    : results;

  // 10. Sort alphabetically by name for consistent output
  return finalResults.sort((a, b) => a.name.localeCompare(b.name));
};
