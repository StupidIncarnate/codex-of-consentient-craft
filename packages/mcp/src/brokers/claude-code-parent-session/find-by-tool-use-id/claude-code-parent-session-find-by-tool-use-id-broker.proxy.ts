import {
  AbsoluteFilePathStub,
  FileContentsStub,
  PathSegmentStub,
} from '@dungeonmaster/shared/contracts';
import { homedir } from '#gateway/node/os';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsReaddirIfExistsAdapterProxy } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.proxy';
import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';

type PathSegment = ReturnType<typeof PathSegmentStub>;

// Mirrors the broker's own directory-path computation — a real, unmocked transformer plus plain
// string concatenation for the per-session subagents dir — so every readdir/readFile address
// below matches what the broker really calls them with. Answers are argument-addressed, so each
// setup call only needs to name the real directory or file it is answering for, independent of
// the order these setup calls run in.
const sessionsDirFor = ({
  homeDir,
  projectDir,
}: {
  homeDir: string;
  projectDir: string;
}): PathSegment =>
  PathSegmentStub({
    value: String(
      claudePathSlugEncoderTransformer({
        homeDir: AbsoluteFilePathStub({ value: homeDir }),
        projectPath: AbsoluteFilePathStub({ value: projectDir }),
      }),
    ),
  });

const subagentsDirFor = ({
  homeDir,
  projectDir,
  sessionId,
}: {
  homeDir: string;
  projectDir: string;
  sessionId: string;
}): PathSegment =>
  PathSegmentStub({
    value: `${String(sessionsDirFor({ homeDir, projectDir }))}/${sessionId}/subagents`,
  });

export const claudeCodeParentSessionFindByToolUseIdBrokerProxy = (): {
  setupSessionsDir: (params: {
    homedir: string;
    projectDir: string;
    sessionIds: readonly string[];
  }) => void;
  setupSessionsDirMissing: (params: { homedir: string; projectDir: string }) => void;
  setupSubagentsDir: (params: {
    homedir: string;
    projectDir: string;
    sessionId: string;
    agentFilenames: readonly string[];
  }) => void;
  setupSubagentsDirMissing: (params: {
    homedir: string;
    projectDir: string;
    sessionId: string;
  }) => void;
  setupAgentFile: (params: {
    homedir: string;
    projectDir: string;
    sessionId: string;
    agentFilename: string;
    contents: string;
  }) => void;
} => {
  const homedirHandle = registerMock({ fn: homedir });
  const readdirProxy = fsReaddirIfExistsAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupSessionsDir: ({
      homedir: homeDir,
      projectDir,
      sessionIds,
    }: {
      homedir: string;
      projectDir: string;
      sessionIds: readonly string[];
    }): void => {
      homedirHandle.calledWith([]).returns(homeDir);
      readdirProxy.returns({
        filepath: sessionsDirFor({ homeDir, projectDir }),
        entries: sessionIds.map((sessionId) => FolderNameStub({ value: `${sessionId}.jsonl` })),
      });
    },
    setupSessionsDirMissing: ({
      homedir: homeDir,
      projectDir,
    }: {
      homedir: string;
      projectDir: string;
    }): void => {
      homedirHandle.calledWith([]).returns(homeDir);
      readdirProxy.returnsUndefined({ filepath: sessionsDirFor({ homeDir, projectDir }) });
    },
    setupSubagentsDir: ({
      homedir: homeDir,
      projectDir,
      sessionId,
      agentFilenames,
    }: {
      homedir: string;
      projectDir: string;
      sessionId: string;
      agentFilenames: readonly string[];
    }): void => {
      homedirHandle.calledWith([]).returns(homeDir);
      readdirProxy.returns({
        filepath: subagentsDirFor({ homeDir, projectDir, sessionId }),
        entries: agentFilenames.map((name) => FolderNameStub({ value: name })),
      });
    },
    setupSubagentsDirMissing: ({
      homedir: homeDir,
      projectDir,
      sessionId,
    }: {
      homedir: string;
      projectDir: string;
      sessionId: string;
    }): void => {
      homedirHandle.calledWith([]).returns(homeDir);
      readdirProxy.returnsUndefined({
        filepath: subagentsDirFor({ homeDir, projectDir, sessionId }),
      });
    },
    setupAgentFile: ({
      homedir: homeDir,
      projectDir,
      sessionId,
      agentFilename,
      contents,
    }: {
      homedir: string;
      projectDir: string;
      sessionId: string;
      agentFilename: string;
      contents: string;
    }): void => {
      homedirHandle.calledWith([]).returns(homeDir);
      const filepath = PathSegmentStub({
        value: `${String(subagentsDirFor({ homeDir, projectDir, sessionId }))}/${agentFilename}`,
      });
      readFileProxy.returnsFor({ filepath, contents: FileContentsStub({ value: contents }) });
    },
  };
};
