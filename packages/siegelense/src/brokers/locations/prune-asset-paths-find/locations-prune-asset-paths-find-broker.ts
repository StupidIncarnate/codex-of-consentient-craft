/**
 * PURPOSE: Resolves every instance-level evidence file `prune` has to weigh and may have to unlink,
 * plus the `runs/` directory it lists to find the rest. Nothing here is discovered by walking: the
 * only adapter this package has for a directory answers file NAMES with no dirent, so a generic
 * walk cannot tell a directory from a file and would have to guess at what it was about to delete.
 * Resolving each name instead makes the set of files `prune` can reach a CLOSED, readable list —
 * which is the property that matters for the one call in this tool that deletes. Reach for this over
 * `locationsBufferPathsFindBroker`: that one answers the three buffers `results` reads back, while
 * this answers every file the retention window applies to, buffers included.
 *
 * USAGE:
 * locationsPruneAssetPathsFindBroker({ evidencePath });
 * // Returns { runsDir, logs, transcripts } — absolute paths, none guaranteed to exist
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { locationsBufferPathsFindBroker } from '../buffer-paths-find/locations-buffer-paths-find-broker';

export const locationsPruneAssetPathsFindBroker = ({
  evidencePath,
}: {
  evidencePath: AbsoluteFilePath;
}): {
  runsDir: AbsoluteFilePath;
  logs: readonly AbsoluteFilePath[];
  transcripts: readonly AbsoluteFilePath[];
} => {
  const buffers = locationsBufferPathsFindBroker({ evidencePath });

  const names = [
    locationsStatics.siegelense.apiLog,
    locationsStatics.siegelense.webLog,
    locationsStatics.siegelense.driverLog,
    locationsStatics.siegelense.heartbeat,
    locationsStatics.siegelense.bootFailure,
    locationsStatics.siegelense.shutdownReason,
  ];

  return {
    runsDir: absoluteFilePathContract.parse(
      pathJoinAdapter({ paths: [evidencePath, locationsStatics.siegelense.runsDir] }),
    ),
    // The process's own record of what it did — the two server logs, the driver log, and the three
    // small state files a post-mortem reads for WHY an instance stopped.
    logs: names.map((name) =>
      absoluteFilePathContract.parse(pathJoinAdapter({ paths: [evidencePath, name] })),
    ),
    // The three instance-level capture buffers. They span every run rather than one, which is why
    // they sit beside the logs here rather than under `runs/`.
    transcripts: [buffers.console, buffers.network, buffers.websocket],
  };
};
