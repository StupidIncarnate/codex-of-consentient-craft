import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { PathSegmentStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import type { SessionIdStub } from '@dungeonmaster/shared/contracts';

type PathSegment = ReturnType<typeof PathSegmentStub>;
type SessionId = ReturnType<typeof SessionIdStub>;

const HOME_DIR = '/home/user';
const PROJECTS_ROOT = `${HOME_DIR}/.claude/projects`;
const SUBAGENTS_DIR_NAME = 'subagents';

export const transcriptResolveBrokerProxy = (): {
  setupSessionAt: (params: { projectDir: PathSegment; sessionId: SessionId }) => void;
  setupSubagentAt: (params: {
    projectDir: PathSegment;
    sessionId: SessionId;
    agentId: SessionId;
  }) => void;
  setupNothing: () => void;
} => {
  const existsProxy = existsSyncProxy();
  const readdirProxy = readdirEntriesSyncProxy();
  const homedirHandle = registerMock({ fn: homedir });
  homedirHandle.calledWith([]).returns(HOME_DIR);
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. Every path this broker builds comes from HOME_DIR and the
  // caller's own ids, so the real join runs for real off them rather than being staged.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));

  // existsSync has no catch-all by design; this mirrors the real function's own "false on
  // anything unresolved" semantics — every exact path staged true below is more specific and wins.
  existsProxy.returnsMatchingPath({ path: (): boolean => true, exists: false });

  const projectDirNames: PathSegment[] = [];
  const fileEntryNamesByProjectDir = new Map<PathSegment, PathSegment[]>();
  const sessionDirNamesByProjectDir = new Map<PathSegment, SessionId[]>();

  const refreshProjectsRootListing = (): void => {
    existsProxy.returns({ path: FilePathStub({ value: PROJECTS_ROOT }), exists: true });
    readdirProxy.returns({
      path: FilePathStub({ value: PROJECTS_ROOT }),
      entries: projectDirNames.map((name) => ({ name, kind: 'directory' as const })),
    });
  };

  const refreshProjectDirListing = ({ projectDirName }: { projectDirName: PathSegment }): void => {
    const fileNames = fileEntryNamesByProjectDir.get(projectDirName) ?? [];
    const sessionDirNames = sessionDirNamesByProjectDir.get(projectDirName) ?? [];
    readdirProxy.returns({
      path: FilePathStub({ value: `${PROJECTS_ROOT}/${projectDirName}` }),
      entries: [
        ...fileNames.map((name) => ({ name, kind: 'file' as const })),
        ...sessionDirNames.map((name) => ({ name, kind: 'directory' as const })),
      ],
    });
  };

  const registerProjectDir = ({ projectDirName }: { projectDirName: PathSegment }): void => {
    if (!projectDirNames.includes(projectDirName)) {
      projectDirNames.push(projectDirName);
    }
    refreshProjectsRootListing();
  };

  return {
    setupSessionAt: ({
      projectDir,
      sessionId,
    }: {
      projectDir: PathSegment;
      sessionId: SessionId;
    }): void => {
      registerProjectDir({ projectDirName: projectDir });

      const fileNames = fileEntryNamesByProjectDir.get(projectDir) ?? [];
      fileNames.push(PathSegmentStub({ value: `${sessionId}.jsonl` }));
      fileEntryNamesByProjectDir.set(projectDir, fileNames);
      refreshProjectDirListing({ projectDirName: projectDir });

      existsProxy.returns({
        path: FilePathStub({ value: `${PROJECTS_ROOT}/${projectDir}/${sessionId}.jsonl` }),
        exists: true,
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
      registerProjectDir({ projectDirName: projectDir });

      const sessionDirNames = sessionDirNamesByProjectDir.get(projectDir) ?? [];
      if (!sessionDirNames.includes(sessionId)) {
        sessionDirNames.push(sessionId);
      }
      sessionDirNamesByProjectDir.set(projectDir, sessionDirNames);
      refreshProjectDirListing({ projectDirName: projectDir });

      existsProxy.returns({
        path: FilePathStub({
          value: `${PROJECTS_ROOT}/${projectDir}/${sessionId}/${SUBAGENTS_DIR_NAME}/${agentId}.jsonl`,
        }),
        exists: true,
      });
    },
    setupNothing: (): void => {
      existsProxy.returns({ path: FilePathStub({ value: PROJECTS_ROOT }), exists: true });
      readdirProxy.returns({ path: FilePathStub({ value: PROJECTS_ROOT }), entries: [] });
    },
  };
};
