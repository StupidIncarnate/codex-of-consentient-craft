/**
 * PURPOSE: Scan directory tree for files and extract their metadata (PURPOSE, USAGE, RELATED, signatures)
 *
 * USAGE:
 * const results = await fileScannerBroker({ path: FilePathStub({ value: 'src/guards' }), fileType: FileTypeStub({ value: 'guard' }) });
 * // Returns array of FileMetadata with extracted metadata and signatures
 *
 * RELATED: metadata-extractor-transformer, signature-extractor-transformer, file-type-detector-transformer
 */

import { globFindAdapter } from '../../../adapters/glob/find/glob-find-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { metadataExtractorTransformer } from '../../../transformers/metadata-extractor/metadata-extractor-transformer';
import { signatureExtractorTransformer } from '../../../transformers/signature-extractor/signature-extractor-transformer';
import { fileTypeDetectorTransformer } from '../../../transformers/file-type-detector/file-type-detector-transformer';
import { functionNameExtractorTransformer } from '../../../transformers/function-name-extractor/function-name-extractor-transformer';
import { globPatternContract } from '../../../contracts/glob-pattern/glob-pattern-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { fileMetadataContract } from '../../../contracts/file-metadata/file-metadata-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { FileType } from '../../../contracts/file-type/file-type-contract';
import type { FileMetadata } from '../../../contracts/file-metadata/file-metadata-contract';

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
  // 1. Find files
  const pattern = path
    ? globPatternContract.parse(`${path}/**/*.{ts,tsx}`)
    : globPatternContract.parse('**/*.{ts,tsx}');

  const cwdPath = filePathContract.parse(process.cwd());
  const files = await globFindAdapter({ pattern, cwd: cwdPath });

  // 2. Filter by file type if provided
  const filteredFiles = fileType
    ? files.filter((f) => {
        const detectedType = fileTypeDetectorTransformer({ filepath: f });
        return detectedType === fileType;
      })
    : files;

  // 3. Extract metadata from each file (parallel for performance)
  const metadataPromises = filteredFiles.map(async (filepath) => {
    // Read file
    const contents = await fsReadFileAdapter({ filepath });

    // Extract metadata
    const metadata = metadataExtractorTransformer({ fileContents: contents });
    if (!metadata) {
      return null; // Skip files without metadata
    }

    // Extract function name
    const functionName = functionNameExtractorTransformer({ filepath });

    // Extract signature
    const signature = signatureExtractorTransformer({
      fileContents: contents,
      functionName,
    });
    if (!signature) {
      return null; // Skip files without function exports
    }

    // Detect file type
    const detectedFileType = fileTypeDetectorTransformer({ filepath });

    return fileMetadataContract.parse({
      name: functionName,
      path: filepath,
      fileType: detectedFileType,
      purpose: metadata.purpose,
      signature,
      usage: metadata.usage,
      related: metadata.related,
      metadata: metadata.metadata,
    });
  });

  const allResults = await Promise.all(metadataPromises);
  const results = allResults.filter((r): r is FileMetadata => r !== null);

  // 4. Filter by name if provided
  if (name) {
    return results.filter((r) => r.name === name);
  }

  // 5. Filter by search if provided
  if (search) {
    const lowerSearch = search.toLowerCase();
    return results.filter(
      (r) =>
        r.purpose.toLowerCase().includes(lowerSearch) || r.name.toLowerCase().includes(lowerSearch),
    );
  }

  return results;
};
