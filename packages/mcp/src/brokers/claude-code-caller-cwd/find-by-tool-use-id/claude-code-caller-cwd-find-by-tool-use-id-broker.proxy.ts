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

import { AbsoluteFilePathStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapterProxy } from '@dungeonmaster/shared/testing';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { fsReaddirIfExistsAdapterProxy } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';
import { scanFilepathsFromTailLayerBrokerProxy } from './scan-filepaths-from-tail-layer-broker.proxy';

type PathSegment = ReturnType<typeof PathSegmentStub>;

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
  const homedirProxy = osUserHomedirAdapterProxy();
  const readdirProxy = fsReaddirIfExistsAdapterProxy();
  const statProxy = fsStatAdapterProxy();
  const fileScanProxy = scanFilepathsFromTailLayerBrokerProxy();

  return {
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

    setupTopLevelSessions: ({
      homedir,
      projectDir,
      sessions,
    }: {
      homedir: string;
      projectDir: string;
      sessions: readonly { sessionId: string; mtimeMs: number; contents: string }[];
    }): void => {
      homedirProxy.returns({ path: homedir });
      const sessionsDir = sessionsDirFor({ homedir, projectDir });
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
      homedir,
      projectDir,
      sessionId,
    }: {
      homedir: string;
      projectDir: string;
      sessionId: string;
    }): void => {
      const subagentsDir = PathSegmentStub({
        value: `${String(sessionsDirFor({ homedir, projectDir }))}/${sessionId}/subagents`,
      });
      readdirProxy.returnsUndefined({ filepath: subagentsDir });
    },

    setupSubagentFiles: ({
      homedir,
      projectDir,
      sessionId,
      agents,
    }: {
      homedir: string;
      projectDir: string;
      sessionId: string;
      agents: readonly { agentFilename: string; mtimeMs: number; contents: string }[];
    }): void => {
      const subagentsDir = PathSegmentStub({
        value: `${String(sessionsDirFor({ homedir, projectDir }))}/${sessionId}/subagents`,
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
