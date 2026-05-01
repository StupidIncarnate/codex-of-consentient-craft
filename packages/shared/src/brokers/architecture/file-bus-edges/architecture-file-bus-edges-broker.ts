/**
 * PURPOSE: Scans all monorepo source files to produce paired file-bus edge records linking
 * fsAppendFileAdapter/fsWriteFileAdapter callers (writers) with fsWatchTailAdapter callers
 * (watchers), joining on resolved literal file paths or computed broker references.
 *
 * USAGE:
 * const edges = architectureFileBusEdgesBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns FileBusEdge[] with paired=true when a writer and watcher share the same filePath
 *
 * WHEN-TO-USE: Project-map side-channel renderer and EDGES footer that need file-bus edge records
 * WHEN-NOT-TO-USE: When TypeScript AST-level accuracy is required (regex v1 heuristic)
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import {
  fileBusEdgeContract,
  type FileBusEdge,
} from '../../../contracts/file-bus-edge/file-bus-edge-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { fileWriteCallsExtractTransformer } from '../../../transformers/file-write-calls-extract/file-write-calls-extract-transformer';
import { fsWatchTailCallsExtractTransformer } from '../../../transformers/fs-watch-tail-calls-extract/fs-watch-tail-calls-extract-transformer';
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';

const PACKAGES_REL = 'packages';

export const architectureFileBusEdgesBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): FileBusEdge[] => {
  const root = String(projectRoot);
  const packagesDir = absoluteFilePathContract.parse(`${root}/${PACKAGES_REL}`);
  const allFiles = listTsFilesLayerBroker({ dirPath: packagesDir });

  const writerEntries: { filePath: ContentText; writerFile: AbsoluteFilePath }[] = [];
  const watcherEntries: { filePath: ContentText; watcherFile: AbsoluteFilePath }[] = [];

  for (const filePath of allFiles) {
    if (!isNonTestFileGuard({ filePath })) {
      continue;
    }
    // Skip pure-helper folders that may contain the regex/literal patterns being scanned for
    // (e.g. shared/transformers/file-write-calls-extract-transformer.ts contains the writer
    // pattern). Per the brief, transformers/guards/contracts/statics never move data at
    // runtime, so any "match" inside them is a false positive.
    const filePathStr = String(filePath);
    if (
      filePathStr.includes('/transformers/') ||
      filePathStr.includes('/guards/') ||
      filePathStr.includes('/contracts/') ||
      filePathStr.includes('/statics/')
    ) {
      continue;
    }
    const source = readFileLayerBroker({ filePath });
    if (source === undefined) {
      continue;
    }

    for (const call of fileWriteCallsExtractTransformer({ source })) {
      writerEntries.push({ filePath: call.filePathArg, writerFile: filePath });
    }

    for (const call of fsWatchTailCallsExtractTransformer({ source })) {
      watcherEntries.push({ filePath: call.filePathArg, watcherFile: filePath });
    }
  }

  const seenPaths = new Set<ContentText>();
  for (const { filePath } of writerEntries) {
    seenPaths.add(filePath);
  }
  for (const { filePath } of watcherEntries) {
    const alreadySeen = [...seenPaths].some((p) => String(p) === String(filePath));
    if (!alreadySeen) {
      seenPaths.add(filePath);
    }
  }

  const edges: FileBusEdge[] = [];

  for (const filePath of seenPaths) {
    const matchingWriter = writerEntries.find((w) => String(w.filePath) === String(filePath));
    const writerFile = matchingWriter?.writerFile ?? null;

    const matchingWatcher = watcherEntries.find((w) => String(w.filePath) === String(filePath));
    const watcherFile = matchingWatcher?.watcherFile ?? null;

    const paired = writerFile !== null && watcherFile !== null;

    edges.push(fileBusEdgeContract.parse({ filePath, writerFile, watcherFile, paired }));
  }

  return edges;
};
