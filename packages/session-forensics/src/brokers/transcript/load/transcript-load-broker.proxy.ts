import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import type { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import type { PathSegmentStub } from '@dungeonmaster/shared/contracts/path-segment/path-segment.stub';
import type { ContentTextStub } from '@dungeonmaster/shared/contracts/content-text/content-text.stub';
import { transcriptResolveBrokerProxy } from '../resolve/transcript-resolve-broker.proxy';

type SessionId = ReturnType<typeof SessionIdStub>;
type PathSegment = ReturnType<typeof PathSegmentStub>;
type ContentText = ReturnType<typeof ContentTextStub>;

// Mirrors the private constants transcript-resolve-broker.proxy.ts stages the search around — this
// proxy has to predict the exact absolute path the REAL resolve broker will hand back so the fs
// mock can be addressed by it.
const HOME_DIR = '/home/user';
const PROJECTS_ROOT = `${HOME_DIR}/.claude/projects`;
const SUBAGENTS_DIR_NAME = 'subagents';

export const transcriptLoadBrokerProxy = (): {
  setupTranscript: (params: {
    target: SessionId;
    projectDir: PathSegment;
    contents: ContentText;
  }) => void;
  setupSubagentTranscript: (params: {
    target: SessionId;
    projectDir: PathSegment;
    parentSessionId: SessionId;
    contents: ContentText;
  }) => void;
  setupMissing: () => void;
} => {
  const resolveProxy = transcriptResolveBrokerProxy();
  const readFileProxy = readFileSyncProxy();

  return {
    setupTranscript: ({
      target,
      projectDir,
      contents,
    }: {
      target: SessionId;
      projectDir: PathSegment;
      contents: ContentText;
    }): void => {
      resolveProxy.setupSessionAt({ projectDir, sessionId: target });
      const filePath = `${PROJECTS_ROOT}/${projectDir}/${target}.jsonl`;
      readFileProxy.returns({ path: filePath, contents });
    },
    setupSubagentTranscript: ({
      target,
      projectDir,
      parentSessionId,
      contents,
    }: {
      target: SessionId;
      projectDir: PathSegment;
      parentSessionId: SessionId;
      contents: ContentText;
    }): void => {
      resolveProxy.setupSubagentAt({ projectDir, sessionId: parentSessionId, agentId: target });
      const filePath = `${PROJECTS_ROOT}/${projectDir}/${parentSessionId}/${SUBAGENTS_DIR_NAME}/${target}.jsonl`;
      readFileProxy.returns({ path: filePath, contents });
    },
    setupMissing: (): void => {
      resolveProxy.setupNothing();
    },
  };
};
