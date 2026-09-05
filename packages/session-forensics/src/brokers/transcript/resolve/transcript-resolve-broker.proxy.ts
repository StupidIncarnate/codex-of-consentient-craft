import type { Dirent } from 'fs';
import {
  osUserHomedirAdapterProxy,
  fsExistsSyncAdapterProxy,
  fsReaddirWithTypesAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import type { SessionIdStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';

type PathSegment = ReturnType<typeof PathSegmentStub>;
type SessionId = ReturnType<typeof SessionIdStub>;

const HOME_DIR = AbsoluteFilePathStub({ value: '/home/user' });
const PROJECTS_ROOT = AbsoluteFilePathStub({ value: `${HOME_DIR}/.claude/projects` });
const SUBAGENTS_DIR_NAME = 'subagents';

const makeDirDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    isDirectory: () => true,
    isFile: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const transcriptResolveBrokerProxy = (): {
  setupSessionAt: (params: { projectDir: PathSegment; sessionId: SessionId }) => void;
  setupSubagentAt: (params: {
    projectDir: PathSegment;
    sessionId: SessionId;
    agentId: SessionId;
  }) => void;
  setupNothing: () => void;
} => {
  const homedirProxy = osUserHomedirAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  // The broker's own pathJoinAdapter calls run for real (the shared proxy's default is a
  // requireActual passthrough) — this child proxy exists only to satisfy
  // enforce-proxy-child-creation; every absolute path this proxy cares about is staged directly
  // through the homedir/readdir/exists mocks below instead.
  pathJoinAdapterProxy();

  homedirProxy.returns({ path: HOME_DIR });

  const projectDirNames: PathSegment[] = [];
  const sessionDirNamesByProjectDir = new Map<PathSegment, SessionId[]>();

  const refreshProjectDirsListing = (): void => {
    existsProxy.returns({ filePath: FilePathStub({ value: PROJECTS_ROOT }), result: true });
    readdirProxy.returns({
      dirPath: PROJECTS_ROOT,
      entries: projectDirNames.map((name) => makeDirDirent({ name })),
    });
  };

  return {
    // A project dir "having no matching file" for a target is modeled by staging some OTHER
    // sessionId there — the only way to put a dir on the projectsRoot listing through this API
    // without also making it the match.
    setupSessionAt: ({
      projectDir,
      sessionId,
    }: {
      projectDir: PathSegment;
      sessionId: SessionId;
    }): void => {
      if (!projectDirNames.includes(projectDir)) {
        projectDirNames.push(projectDir);
      }
      refreshProjectDirsListing();
      existsProxy.returns({
        filePath: FilePathStub({ value: `${PROJECTS_ROOT}/${projectDir}/${sessionId}.jsonl` }),
        result: true,
      });
    },
    setupSubagentAt: ({
      projectDir,
      sessionId,
      agentId,
    }: {
      projectDir: PathSegment;
      sessionId: SessionId;
      agentId: SessionId;
    }): void => {
      if (!projectDirNames.includes(projectDir)) {
        projectDirNames.push(projectDir);
      }
      refreshProjectDirsListing();

      const sessionDirNames = sessionDirNamesByProjectDir.get(projectDir) ?? [];
      if (!sessionDirNames.includes(sessionId)) {
        sessionDirNames.push(sessionId);
      }
      sessionDirNamesByProjectDir.set(projectDir, sessionDirNames);
      readdirProxy.returns({
        dirPath: AbsoluteFilePathStub({ value: `${PROJECTS_ROOT}/${projectDir}` }),
        entries: sessionDirNames.map((name) => makeDirDirent({ name })),
      });

      existsProxy.returns({
        filePath: FilePathStub({
          value: `${PROJECTS_ROOT}/${projectDir}/${sessionId}/${SUBAGENTS_DIR_NAME}/${agentId}.jsonl`,
        }),
        result: true,
      });
    },
    // Stages the projects root as existing but empty — an exhaustive search that finds nothing,
    // as opposed to the root not existing at all (the untouched default proxy state).
    setupNothing: (): void => {
      existsProxy.returns({ filePath: FilePathStub({ value: PROJECTS_ROOT }), result: true });
    },
  };
};
