/**
 * PURPOSE: Scans every monorepo source file for file-bus edges: a writer (`appendFile` or
 * `writeFile` from `#gateway/node/fs__promises`) and a reader (`tailFile` from `#gateway/node/fs`)
 * joined on the same literal path or the same computed path key. A file that tails a path is that
 * path's reader, so its own create-if-absent touch of the path never counts as the bus writer.
 * Every writer of a path gets its own edge.
 *
 * USAGE:
 * const edges = fileBusEdgesLayerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns FileBusEdge[] with paired=true when a writer and a reader share the same filePath
 *
 * WHEN-TO-USE: Building the file-bus section of the project-map EDGES footer
 * WHEN-NOT-TO-USE: When TypeScript AST-level accuracy is required (this is a regex v1 heuristic)
 */

import {
  fileBusEdgeContract,
  type FileBusEdge,
} from '../../../contracts/file-bus-edge/file-bus-edge-contract';
import { fileWriteCallsExtractTransformer } from '../../../transformers/file-write-calls-extract/file-write-calls-extract-transformer';
import { tailFileCallsExtractTransformer } from '../../../transformers/tail-file-calls-extract/tail-file-calls-extract-transformer';
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';

const PACKAGES_REL = 'packages';

export const fileBusEdgesLayerBroker = ({
  projectRoot,
}: {
  projectRoot: string;
}): FileBusEdge[] => {
  const packagesDir = `${projectRoot}/${PACKAGES_REL}`;
  const allFiles = listTsFilesLayerBroker({ dirPath: packagesDir });

  const writerEntries: { filePath: string; writerFile: string }[] = [];
  const readerEntries: { filePath: string; watcherFile: string }[] = [];

  for (const filePath of allFiles) {
    const source = readFileLayerBroker({ filePath });
    if (source !== undefined) {
      for (const call of fileWriteCallsExtractTransformer({ source })) {
        if (call.adapter !== 'ensureDir') {
          writerEntries.push({ filePath: call.filePathArg, writerFile: filePath });
        }
      }
      for (const call of tailFileCallsExtractTransformer({ source })) {
        readerEntries.push({ filePath: call.filePathArg, watcherFile: filePath });
      }
    }
  }

  const busPaths = new Set<string>([
    ...writerEntries.map((w) => w.filePath),
    ...readerEntries.map((r) => r.filePath),
  ]);

  const edges: FileBusEdge[] = [];
  for (const busPath of busPaths) {
    const watcherFile = readerEntries.find((r) => r.filePath === busPath)?.watcherFile ?? null;
    const writerFiles = new Set<string>(
      writerEntries
        .filter((w) => w.filePath === busPath && w.writerFile !== watcherFile)
        .map((w) => w.writerFile),
    );

    // One edge per writer: a path with several producers has several edges into the same reader.
    for (const writerFile of writerFiles.size === 0 ? [null] : writerFiles) {
      edges.push(
        fileBusEdgeContract.parse({
          filePath: busPath,
          writerFile,
          watcherFile,
          paired: writerFile !== null && watcherFile !== null,
        }),
      );
    }
  }

  return edges;
};
