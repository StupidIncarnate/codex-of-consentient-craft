import {
  AbsoluteFilePathStub,
  FileContentsStub,
  PathSegmentStub,
} from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapterProxy } from '@dungeonmaster/shared/testing';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsReaddirIfExistsAdapterProxy } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.proxy';
import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';

type PathSegment = ReturnType<typeof PathSegmentStub>;

// Mirrors the broker's own directory-path computation — a real, unmocked transformer plus plain
// string concatenation for the per-session subagents dir — so every readdir/readFile address
// below matches what the broker really calls them with. Because answers are argument-addressed
// (not FIFO), setup calls no longer need to happen in the broker's call order; each just needs
// to name the real directory or file it is answering for.
const sessionsDirFor = ({
  homedir,
  projectDir,
}: {
  homedir: string;
  projectDir: string;
}): PathSegment =>
  PathSegmentStub({
    value: String(
      claudePathSlugEncoderTransformer({
        homeDir: AbsoluteFilePathStub({ value: homedir }),
        projectPath: AbsoluteFilePathStub({ value: projectDir }),
      }),
    ),
  });

const subagentsDirFor = ({
  homedir,
  projectDir,
  sessionId,
}: {
  homedir: string;
  projectDir: string;
  sessionId: string;
}): PathSegment =>
  PathSegmentStub({
    value: `${String(sessionsDirFor({ homedir, projectDir }))}/${sessionId}/subagents`,
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
  const homedirProxy = osUserHomedirAdapterProxy();
  const readdirProxy = fsReaddirIfExistsAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupSessionsDir: ({
      homedir,
      projectDir,
      sessionIds,
    }: {
      homedir: string;
      projectDir: string;
      sessionIds: readonly string[];
    }): void => {
      homedirProxy.returns({ path: homedir });
      readdirProxy.returns({
        filepath: sessionsDirFor({ homedir, projectDir }),
        entries: sessionIds.map((sessionId) => FolderNameStub({ value: `${sessionId}.jsonl` })),
      });
    },
    setupSessionsDirMissing: ({
      homedir,
      projectDir,
    }: {
      homedir: string;
      projectDir: string;
    }): void => {
      homedirProxy.returns({ path: homedir });
      readdirProxy.returnsUndefined({ filepath: sessionsDirFor({ homedir, projectDir }) });
    },
    setupSubagentsDir: ({
      homedir,
      projectDir,
      sessionId,
      agentFilenames,
    }: {
      homedir: string;
      projectDir: string;
      sessionId: string;
      agentFilenames: readonly string[];
    }): void => {
      readdirProxy.returns({
        filepath: subagentsDirFor({ homedir, projectDir, sessionId }),
        entries: agentFilenames.map((name) => FolderNameStub({ value: name })),
      });
    },
    setupSubagentsDirMissing: ({
      homedir,
      projectDir,
      sessionId,
    }: {
      homedir: string;
      projectDir: string;
      sessionId: string;
    }): void => {
      readdirProxy.returnsUndefined({
        filepath: subagentsDirFor({ homedir, projectDir, sessionId }),
      });
    },
    setupAgentFile: ({
      homedir,
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
      const filepath = PathSegmentStub({
        value: `${String(subagentsDirFor({ homedir, projectDir, sessionId }))}/${agentFilename}`,
      });
      readFileProxy.returnsFor({ filepath, contents: FileContentsStub({ value: contents }) });
    },
  };
};
