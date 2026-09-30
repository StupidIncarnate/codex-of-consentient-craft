/**
 * PURPOSE: Renders an instance's evidence listing as the indented file tree `status --instance`
 * prints under its EVIDENCE DIR row — one line per directory (`runs/`) and one per file
 * (`step1.png (50000 bytes)`), each nested two spaces deeper than its parent, every path relative to
 * the EVIDENCE DIR printed above it so the tree stays narrow. Relies on `files` arriving in walk
 * order (each directory's entries contiguous), which is what `instanceEvidenceListingContract`
 * promises; a directory line is printed the first time a file under it appears. Reach for this over
 * joining `files` by hand: the JSON form carries the absolute paths, and this is the one place the
 * human form turns them into a tree.
 *
 * USAGE:
 * evidenceTreeRenderTransformer({ listing: InstanceEvidenceListingStub() });
 * // Returns ['api-server.log (2048 bytes)']
 */

import type { InstanceEvidenceListing } from '../../contracts/instance-evidence-listing/instance-evidence-listing-contract';
import { statusTableStatics } from '../../statics/status-table/status-table-statics';

export const evidenceTreeRenderTransformer = ({
  listing,
}: {
  listing: InstanceEvidenceListing;
}): readonly string[] => {
  const { indent } = statusTableStatics.evidenceTree;
  const dirPrefix = `${listing.dir.path}/`;

  const segmentLists = listing.files.map((file) => ({
    segments: (file.path.startsWith(dirPrefix)
      ? file.path.slice(dirPrefix.length)
      : file.path
    ).split('/'),
    bytes: file.bytes,
  }));

  return segmentLists.flatMap(({ segments, bytes }, fileIndex) => {
    const dirSegments = segments.slice(0, -1);
    const fileName = segments[segments.length - 1] ?? '';
    const previousDirSegments = segmentLists[fileIndex - 1]?.segments.slice(0, -1) ?? [];
    const firstNewDepth = dirSegments.findIndex(
      (segment, depth) => previousDirSegments[depth] !== segment,
    );
    const newDirLines =
      firstNewDepth === -1
        ? []
        : dirSegments
            .slice(firstNewDepth)
            .map((segment, offset) => `${indent.repeat(firstNewDepth + offset)}${segment}/`);

    return [
      ...newDirLines,
      `${indent.repeat(dirSegments.length)}${fileName} (${String(bytes)} bytes)`,
    ];
  });
};
