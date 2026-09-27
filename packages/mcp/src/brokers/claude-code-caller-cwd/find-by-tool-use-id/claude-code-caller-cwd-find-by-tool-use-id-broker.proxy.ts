/**
 * PURPOSE: Test setup helper for claudeCodeCallerCwdFindByToolUseIdBroker — stages the
 * top-level readdir + per-file stat the broker runs for every session it discovers, the file
 * reads themselves via scanFilepathsFromTailLayerBrokerProxy, plus the subagents/agent-*.jsonl
 * fallback.
 *
 * USAGE:
 * const proxy = claudeCodeCallerCwdFindByToolUseIdBrokerProxy();
 * proxy.setupTopLevelSessions({ homedir, projectDir, sessions: [{ sessionId, mtimeMs, contents }] });
 */

import { homedir } from '#gateway/node/os';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { fsReaddirIfExistsAdapterProxy } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';
import { scanFilepathsFromTailLayerBrokerProxy } from './scan-filepaths-from-tail-layer-broker.proxy';

type PathSegment = ReturnType<typeof PathSegmentStub>;

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

export const claudeCodeCallerCwdFindByToolUseIdBrokerProxy = (): {
  setupSessionsDirMissing: (params: { homedir: string; projectDir: string }) => void;
  setupTopLevelSessions: (params: {
    homedir: string;
    projectDir: string;
    sessions: readonly { sessionId: string; mtimeMs: number; contents: string }[];
  }) => void;
  setupSubagentsDirMissing: (params: {
    homedir: string;
    projectDir: string;
    sessionId: string;
  }) => void;
  setupSubagentFiles: (params: {
    homedir: string;
    projectDir: string;
    sessionId: string;
    agents: readonly { agentFilename: string; mtimeMs: number; contents: string }[];
  }) => void;
} => {
  const homedirHandle = registerMock({ fn: homedir });
  const readdirProxy = fsReaddirIfExistsAdapterProxy();
  const statProxy = fsStatAdapterProxy();
  const fileScanProxy = scanFilepathsFromTailLayerBrokerProxy();

  return {
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

    setupTopLevelSessions: ({
      homedir: homeDir,
      projectDir,
      sessions,
    }: {
      homedir: string;
      projectDir: string;
      sessions: readonly { sessionId: string; mtimeMs: number; contents: string }[];
    }): void => {
      homedirHandle.calledWith([]).returns(homeDir);
      const sessionsDir = sessionsDirFor({ homeDir, projectDir });
      readdirProxy.returns({
        filepath: sessionsDir,
        entries: sessions.map((session) => FolderNameStub({ value: `${session.sessionId}.jsonl` })),
      });
      for (const session of sessions) {
        const filepath = `${String(sessionsDir)}/${session.sessionId}.jsonl`;
        statProxy.returns({
          filepath: PathSegmentStub({ value: filepath }),
          stats: { mtimeMs: session.mtimeMs },
        });
        fileScanProxy.setupFile({ filepath, contents: session.contents });
      }
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
      const subagentsDir = PathSegmentStub({
        value: `${String(sessionsDirFor({ homeDir, projectDir }))}/${sessionId}/subagents`,
      });
      readdirProxy.returnsUndefined({ filepath: subagentsDir });
    },

    setupSubagentFiles: ({
      homedir: homeDir,
      projectDir,
      sessionId,
      agents,
    }: {
      homedir: string;
      projectDir: string;
      sessionId: string;
      agents: readonly { agentFilename: string; mtimeMs: number; contents: string }[];
    }): void => {
      homedirHandle.calledWith([]).returns(homeDir);
      const subagentsDir = PathSegmentStub({
        value: `${String(sessionsDirFor({ homeDir, projectDir }))}/${sessionId}/subagents`,
      });
      readdirProxy.returns({
        filepath: subagentsDir,
        entries: agents.map((agent) => FolderNameStub({ value: agent.agentFilename })),
      });
      for (const agent of agents) {
        const filepath = `${String(subagentsDir)}/${agent.agentFilename}`;
        statProxy.returns({
          filepath: PathSegmentStub({ value: filepath }),
          stats: { mtimeMs: agent.mtimeMs },
        });
        fileScanProxy.setupFile({ filepath, contents: agent.contents });
      }
    },
  };
};
