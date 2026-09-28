/**
 * PURPOSE: A forensic reader starts with only a bare session or sub-agent id, copied out of a
 * quest file. Claude Code writes one project directory per working directory, so the id alone
 * carries no path to its transcript. The location brokers in `@dungeonmaster/shared` cannot
 * resolve it either, because every one of them needs a known guild path first. This broker
 * resolves the id on its own, by walking every project directory.
 *
 * USAGE:
 * transcriptResolveBroker({ target: SessionIdStub({ value: 'abc-123' }) });
 * // Returns the absolute path to the matching transcript .jsonl. Returns undefined when no
 * // project directory holds a match, or, for a sub-agent id, when no session directory holds one.
 */

import { existsSync, readdirEntriesSync } from '#gateway/node/fs';
import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, SessionId } from '@dungeonmaster/shared/contracts';

const SUBAGENT_TARGET_PREFIX = 'agent-';

export const transcriptResolveBroker = ({
  target,
  parentSessionId,
}: {
  target: SessionId;
  parentSessionId?: SessionId;
}): AbsoluteFilePath | undefined => {
  const projectsRoot = join(
    homedir(),
    locationsStatics.userHome.claude.dir,
    locationsStatics.userHome.claude.projectsDir,
  );

  if (!existsSync(projectsRoot)) {
    return undefined;
  }

  const projectDirs = readdirEntriesSync(projectsRoot)
    .filter((entry) => entry.kind === 'directory')
    .map((entry) => join(projectsRoot, entry.name));

  if (!target.startsWith(SUBAGENT_TARGET_PREFIX)) {
    const matched = projectDirs
      .map((projectDir) => join(projectDir, `${target}.jsonl`))
      .find((candidate) => existsSync(candidate));
    return matched === undefined ? undefined : absoluteFilePathContract.parse(matched);
  }

  if (parentSessionId !== undefined) {
    const matched = projectDirs
      .map((projectDir) =>
        join(
          projectDir,
          parentSessionId,
          locationsStatics.userHome.claude.subagentsDir,
          `${target}.jsonl`,
        ),
      )
      .find((candidate) => existsSync(candidate));
    return matched === undefined ? undefined : absoluteFilePathContract.parse(matched);
  }

  const matched = projectDirs
    .flatMap((projectDir) =>
      readdirEntriesSync(projectDir)
        .filter((entry) => entry.kind === 'directory')
        .map((sessionEntry) =>
          join(
            projectDir,
            sessionEntry.name,
            locationsStatics.userHome.claude.subagentsDir,
            `${target}.jsonl`,
          ),
        ),
    )
    .find((candidate) => existsSync(candidate));
  return matched === undefined ? undefined : absoluteFilePathContract.parse(matched);
};
