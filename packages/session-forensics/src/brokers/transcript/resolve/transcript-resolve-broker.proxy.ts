import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { PathSegmentStub } from '@dungeonmaster/shared/contracts/path-segment/path-segment.stub';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import type { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';

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
  // homedir() takes no argument, so every composed proxy stages it at the same address and the
  // latest wins. dungeonmasterHomeFindBrokerProxy stages a real-homedir passthrough in its own
  // constructor, so a parent composing both would read Jest's sandboxed HOME. Each setup method
  // below re-stages HOME_DIR, since setup runs after every sibling proxy is built.
  const stageHomeDir = (): void => {
    homedirHandle.calledWith([]).returns(HOME_DIR);
  };
  stageHomeDir();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. Every path this broker builds comes from HOME_DIR and the
  // caller's own ids, so the real join runs for real off them rather than being staged.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));

  // existsSync has no catch-all by design: every path it can be asked about here is exactly
  // staged below, true or false, so a broker that queries the wrong candidate throws instead of
  // silently reading "not found".
  existsProxy.returns({ path: FilePathStub({ value: PROJECTS_ROOT }), exists: false });

  const projectDirNames: PathSegment[] = [];
  const fileEntryNamesByProjectDir = new Map<PathSegment, PathSegment[]>();
  const sessionDirNamesByProjectDir = new Map<PathSegment, SessionId[]>();

  // Tracks every (projectDir, sessionId) pair a test has described, so every candidate main-session
  // path the broker could build from a KNOWN projectDir and a KNOWN sessionId gets an exact true or
  // false answer — not just the one pair the test cares about.
  const mainSessionIdsByProjectDir = new Map<PathSegment, Set<SessionId>>();
  const allMainSessionIds = new Set<SessionId>();

  const restageMainSessionExistence = (): void => {
    for (const projectDir of projectDirNames) {
      const presentHere = mainSessionIdsByProjectDir.get(projectDir) ?? new Set<SessionId>();
      for (const sessionId of allMainSessionIds) {
        existsProxy.returns({
          path: FilePathStub({ value: `${PROJECTS_ROOT}/${projectDir}/${sessionId}.jsonl` }),
          exists: presentHere.has(sessionId),
        });
      }
    }
  };

  // Same idea for sub-agent transcripts, keyed by (projectDir, sessionDir) since that pair, not
  // just the projectDir, is what the candidate path is built from.
  const subagentIdsByProjectDirAndSessionDir = new Map<
    PathSegment,
    Map<SessionId, Set<SessionId>>
  >();
  const allAgentIds = new Set<SessionId>();

  const restageSubagentExistence = (): void => {
    for (const [projectDir, sessionDirMap] of subagentIdsByProjectDirAndSessionDir) {
      for (const [sessionDirName, presentAgentIds] of sessionDirMap) {
        for (const agentId of allAgentIds) {
          existsProxy.returns({
            path: FilePathStub({
              value: `${PROJECTS_ROOT}/${projectDir}/${sessionDirName}/${SUBAGENTS_DIR_NAME}/${agentId}.jsonl`,
            }),
            exists: presentAgentIds.has(agentId),
          });
        }
      }
    }
  };

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
      stageHomeDir();
      registerProjectDir({ projectDirName: projectDir });

      const fileNames = fileEntryNamesByProjectDir.get(projectDir) ?? [];
      fileNames.push(PathSegmentStub({ value: `${sessionId}.jsonl` }));
      fileEntryNamesByProjectDir.set(projectDir, fileNames);
      refreshProjectDirListing({ projectDirName: projectDir });

      const presentHere = mainSessionIdsByProjectDir.get(projectDir) ?? new Set<SessionId>();
      presentHere.add(sessionId);
      mainSessionIdsByProjectDir.set(projectDir, presentHere);
      allMainSessionIds.add(sessionId);
      restageMainSessionExistence();
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
      stageHomeDir();
      registerProjectDir({ projectDirName: projectDir });

      const sessionDirNames = sessionDirNamesByProjectDir.get(projectDir) ?? [];
      if (!sessionDirNames.includes(sessionId)) {
        sessionDirNames.push(sessionId);
      }
      sessionDirNamesByProjectDir.set(projectDir, sessionDirNames);
      refreshProjectDirListing({ projectDirName: projectDir });

      const sessionDirMap =
        subagentIdsByProjectDirAndSessionDir.get(projectDir) ??
        new Map<SessionId, Set<SessionId>>();
      const presentAgentIds = sessionDirMap.get(sessionId) ?? new Set<SessionId>();
      presentAgentIds.add(agentId);
      sessionDirMap.set(sessionId, presentAgentIds);
      subagentIdsByProjectDirAndSessionDir.set(projectDir, sessionDirMap);
      allAgentIds.add(agentId);
      restageSubagentExistence();
    },
    setupNothing: (): void => {
      stageHomeDir();
      existsProxy.returns({ path: FilePathStub({ value: PROJECTS_ROOT }), exists: true });
      readdirProxy.returns({ path: FilePathStub({ value: PROJECTS_ROOT }), entries: [] });
    },
  };
};
