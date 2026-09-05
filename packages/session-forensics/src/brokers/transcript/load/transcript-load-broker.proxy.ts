import { fsReadFileSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type {
  SessionIdStub,
  PathSegmentStub,
  ContentTextStub,
} from '@dungeonmaster/shared/contracts';
import { transcriptResolveBrokerProxy } from '../resolve/transcript-resolve-broker.proxy';

type SessionId = ReturnType<typeof SessionIdStub>;
type PathSegment = ReturnType<typeof PathSegmentStub>;
type ContentText = ReturnType<typeof ContentTextStub>;

// Mirrors the private constants transcript-resolve-broker.proxy.ts stages the search around — this
// proxy has to predict the exact absolute path the REAL resolve broker will hand back so the fs
// mock can be addressed by it.
const HOME_DIR = AbsoluteFilePathStub({ value: '/home/user' });
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
  const readFileProxy = fsReadFileSyncAdapterProxy();

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
      const filePath = AbsoluteFilePathStub({
        value: `${PROJECTS_ROOT}/${projectDir}/${target}.jsonl`,
      });
      readFileProxy.returns({ filePath, content: contents });
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
      const filePath = AbsoluteFilePathStub({
        value: `${PROJECTS_ROOT}/${projectDir}/${parentSessionId}/${SUBAGENTS_DIR_NAME}/${target}.jsonl`,
      });
      readFileProxy.returns({ filePath, content: contents });
    },
    setupMissing: (): void => {
      resolveProxy.setupNothing();
    },
  };
};
