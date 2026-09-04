/**
 * PURPOSE: A forensic reader only has a bare session or sub-agent id copied out of a quest file —
 * Claude Code writes one project directory per working directory, so the id alone carries no path.
 * This is the search that turns the id into a transcript path by walking every project directory
 * shared's per-guild location brokers cannot help with, since they all require a known guild path.
 *
 * USAGE:
 * transcriptResolveBroker({ target: SessionIdStub({ value: 'abc-123' }) });
 * // Returns the absolute path to the matching transcript .jsonl, or undefined when no project (or,
 * // for a sub-agent, no session) directory holds a matching file
 */

import {
  osUserHomedirAdapter,
  pathJoinAdapter,
  fsExistsSyncAdapter,
  fsReaddirWithTypesAdapter,
} from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, SessionId } from '@dungeonmaster/shared/contracts';

const SUBAGENT_TARGET_PREFIX = 'agent-';

export const transcriptResolveBroker = ({
  target,
  parentSessionId,
}: {
  target: SessionId;
  parentSessionId?: SessionId;
}): AbsoluteFilePath | undefined => {
  const projectsRoot = absoluteFilePathContract.parse(
    pathJoinAdapter({
      paths: [
        osUserHomedirAdapter(),
        locationsStatics.userHome.claude.dir,
        locationsStatics.userHome.claude.projectsDir,
      ],
    }),
  );

  if (!fsExistsSyncAdapter({ filePath: filePathContract.parse(projectsRoot) })) {
    return undefined;
  }

  const projectDirs = fsReaddirWithTypesAdapter({ dirPath: projectsRoot })
    .filter((entry) => entry.isDirectory())
    .map((entry) =>
      absoluteFilePathContract.parse(pathJoinAdapter({ paths: [projectsRoot, entry.name] })),
    );

  if (!target.startsWith(SUBAGENT_TARGET_PREFIX)) {
    return projectDirs
      .map((projectDir) =>
        absoluteFilePathContract.parse(pathJoinAdapter({ paths: [projectDir, `${target}.jsonl`] })),
      )
      .find((candidate) => fsExistsSyncAdapter({ filePath: filePathContract.parse(candidate) }));
  }

  if (parentSessionId !== undefined) {
    return projectDirs
      .map((projectDir) =>
        absoluteFilePathContract.parse(
          pathJoinAdapter({
            paths: [
              projectDir,
              parentSessionId,
              locationsStatics.userHome.claude.subagentsDir,
              `${target}.jsonl`,
            ],
          }),
        ),
      )
      .find((candidate) => fsExistsSyncAdapter({ filePath: filePathContract.parse(candidate) }));
  }

  return projectDirs
    .flatMap((projectDir) =>
      fsReaddirWithTypesAdapter({ dirPath: projectDir })
        .filter((entry) => entry.isDirectory())
        .map((sessionEntry) =>
          absoluteFilePathContract.parse(
            pathJoinAdapter({
              paths: [
                projectDir,
                sessionEntry.name,
                locationsStatics.userHome.claude.subagentsDir,
                `${target}.jsonl`,
              ],
            }),
          ),
        ),
    )
    .find((candidate) => fsExistsSyncAdapter({ filePath: filePathContract.parse(candidate) }));
};
