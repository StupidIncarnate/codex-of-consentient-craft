import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import {
  claudeLineNormalizeBrokerProxy,
  cwdResolveBrokerProxy,
  osUserHomedirAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type {
  FileNameStub,
  FilePath,
  AbsoluteFilePath,
  QuestId,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import {
  absoluteFilePathContract,
  filePathContract,
  repoRootCwdContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';
import {
  claudeProjectPathEncoderTransformer,
  stripJsonlSuffixTransformer,
} from '@dungeonmaster/shared/transformers';

type FileName = ReturnType<typeof FileNameStub>;
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { fsReadJsonlAdapterProxy } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { questCwdResolveBroker } from '../../quest/cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../../quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import { chatReplayJsonlReadBrokerProxy } from '../replay-jsonl-read/chat-replay-jsonl-read-broker.proxy';
import { scopeSubagentFilesToDescendantsLayerBrokerProxy } from './scope-subagent-files-to-descendants-layer-broker.proxy';

// The quest-scoped cwd resolution is mocked at the module boundary — questCwdResolveBroker's own
// worktree / repo-root / missing-worktree branching has its own test suite; here it only supplies
// the resolved cwd (or the missing path) for the questId a test stages.
registerModuleMock({ module: '../../quest/cwd-resolve/quest-cwd-resolve-broker' });

type GuildConfig = Parameters<ReturnType<typeof guildGetBrokerProxy>['setupConfig']>[0]['config'];

export const chatHistoryReplayBrokerProxy = (): {
  setupGuild: (params: { config: GuildConfig; homeDir: string; sessionId: SessionId }) => void;
  setupMainSession: (params: { content: string }) => void;
  setupSubagentDir: (params: { files: FileName[] }) => void;
  setupSubagentFile: (params: { content: string }) => void;
  setupSubagentDirMissing: () => void;
  setupCwdResolveSuccess: (params: { cwd: string }) => void;
  setupCwdResolveReject: (params: { error: Error }) => void;
  setupQuestWorktree: (params: { questId: QuestId; worktreePath: string }) => void;
  setupQuestRepoRoot: (params: { questId: QuestId; repoRoot: string }) => void;
  setupQuestWorktreeMissing: (params: { questId: QuestId; worktreePath: string }) => void;
} => {
  claudeLineNormalizeBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces the broker
  // entirely so cwdResolveBrokerProxy's underlying fs/path mocks aren't actually exercised.
  cwdResolveBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  const homedirProxy = osUserHomedirAdapterProxy();
  const readJsonlProxy = fsReadJsonlAdapterProxy();
  const readdirProxy = fsReaddirAdapterProxy();
  // Wired to satisfy enforce-proxy-child-creation; the readJsonlProxy above already
  // mocks the underlying readFile that the replay broker delegates to.
  chatReplayJsonlReadBrokerProxy();
  // Layer broker that scopes per-work-item replay to a sub-agent's descendant closure. Its
  // own proxy sets up claudeLineNormalizeBroker for the real edge-extraction normalize.
  scopeSubagentFilesToDescendantsLayerBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation; the module mock above supplies the actual
  // return values, so this child's own internal fs/broker mocks are never exercised.
  questCwdResolveBrokerProxy();
  const questCwdMock = registerMock({ fn: questCwdResolveBroker });

  // chat-history-replay-broker walks up from the guild path to the repo root via
  // cwdResolveBroker so the encoded JSONL path matches the spawn cwd of the agent that
  // wrote the session. Keyed on the real { startPath, kind } the broker calls with — startPath
  // is always this test's own guild path, captured by setupGuild below. Default answer mirrors
  // the guild's own path, matching the broker's behavior in standalone projects with no
  // `.dungeonmaster.json` ancestor.
  const cwdResolveMock = registerMock({ fn: cwdResolveBroker });
  const guildStartPathsRef: { value: readonly FilePath[] } = { value: [] };

  // The broker reads the main session file and scans the subagents/ dir at a JSONL path it
  // computes from homeDir + the resolved project path + sessionId via the REAL (unmocked)
  // claudeProjectPathEncoderTransformer — not through a mocked join that returns ''. That
  // makes the address computable rather than unknowable, so we compute it here with the same
  // transformer instead of keying on calledWith([]), which would hide a wrong-path regression
  // exactly like the class of bug this migration exists to catch. Placeholders below are never
  // read for real — setupGuild always runs first in every test.
  const homeDirRef: { value: AbsoluteFilePath } = {
    value: absoluteFilePathContract.parse('/unset'),
  };
  const sessionIdRef: { value: SessionId } = { value: sessionIdContract.parse('unset') };
  const projectPathOverrideRef: { value: AbsoluteFilePath | undefined } = { value: undefined };
  const subagentFileQueueRef: { value: FileName[] } = { value: [] };

  const resolveProjectPath = (): AbsoluteFilePath => {
    if (projectPathOverrideRef.value !== undefined) {
      return projectPathOverrideRef.value;
    }
    const guildPath = guildStartPathsRef.value.at(0);
    return absoluteFilePathContract.parse(String(guildPath ?? '/unset'));
  };

  const resolveJsonlPath = (): AbsoluteFilePath =>
    claudeProjectPathEncoderTransformer({
      homeDir: homeDirRef.value,
      projectPath: resolveProjectPath(),
      sessionId: sessionIdRef.value,
    });

  const resolveSubagentsDir = (): AbsoluteFilePath =>
    absoluteFilePathContract.parse(
      `${stripJsonlSuffixTransformer({ filePath: resolveJsonlPath() })}/subagents`,
    );

  return {
    setupGuild: ({
      config,
      homeDir,
      sessionId,
    }: {
      config: GuildConfig;
      homeDir: string;
      sessionId: SessionId;
    }): void => {
      guildProxy.setupConfig({ config });
      homedirProxy.returns({ path: homeDir });
      homeDirRef.value = absoluteFilePathContract.parse(homeDir);
      sessionIdRef.value = sessionId;

      guildStartPathsRef.value = config.guilds.map((guild) => filePathContract.parse(guild.path));
      for (const startPath of guildStartPathsRef.value) {
        cwdResolveMock
          .calledWith([{ startPath, kind: 'repo-root' }])
          .resolves(repoRootCwdContract.parse(String(startPath)));
      }
    },
    setupMainSession: ({ content }: { content: string }): void => {
      readJsonlProxy.returns({ filePath: resolveJsonlPath(), content });
    },
    setupSubagentDir: ({ files }: { files: FileName[] }): void => {
      readdirProxy.returns({ dirPath: resolveSubagentsDir(), files });
      subagentFileQueueRef.value = [...files];
    },
    setupSubagentFile: ({ content }: { content: string }): void => {
      const fileName = subagentFileQueueRef.value.shift();
      const filePath = absoluteFilePathContract.parse(
        `${resolveSubagentsDir()}/${String(fileName)}`,
      );
      readJsonlProxy.returns({ filePath, content });
    },
    setupSubagentDirMissing: (): void => {
      readdirProxy.throws({
        dirPath: resolveSubagentsDir(),
        error: new Error('ENOENT: no such file or directory'),
      });
    },
    setupCwdResolveSuccess: ({ cwd }: { cwd: string }): void => {
      projectPathOverrideRef.value = absoluteFilePathContract.parse(cwd);
      for (const startPath of guildStartPathsRef.value) {
        cwdResolveMock
          .calledWith([{ startPath, kind: 'repo-root' }])
          .resolves(repoRootCwdContract.parse(cwd));
      }
    },
    setupCwdResolveReject: ({ error }: { error: Error }): void => {
      for (const startPath of guildStartPathsRef.value) {
        cwdResolveMock.calledWith([{ startPath, kind: 'repo-root' }]).throws(error);
      }
    },
    // The three questCwdResolveBroker scenarios below ALSO drive projectPathOverrideRef, the
    // same ref setupCwdResolveSuccess uses — the broker computes its JSONL path from whichever
    // cwd it resolved, regardless of which of the two resolution paths (questId vs guild
    // walk-up) produced it, so resolveJsonlPath() only needs to know the WINNING cwd.
    setupQuestWorktree: ({
      questId,
      worktreePath,
    }: {
      questId: QuestId;
      worktreePath: string;
    }): void => {
      questCwdMock.calledWith([{ questId }]).resolves(
        QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: repoRootCwdContract.parse(worktreePath),
        }),
      );
      projectPathOverrideRef.value = absoluteFilePathContract.parse(worktreePath);
    },
    setupQuestRepoRoot: ({ questId, repoRoot }: { questId: QuestId; repoRoot: string }): void => {
      questCwdMock.calledWith([{ questId }]).resolves(
        QuestCwdResolutionStub({
          kind: 'repo-root',
          cwd: repoRootCwdContract.parse(repoRoot),
        }),
      );
      projectPathOverrideRef.value = absoluteFilePathContract.parse(repoRoot);
    },
    // No projectPathOverrideRef update — the broker throws before ever computing a JSONL path
    // for this case, so no session/subagent read needs to be staged against one.
    setupQuestWorktreeMissing: ({
      questId,
      worktreePath,
    }: {
      questId: QuestId;
      worktreePath: string;
    }): void => {
      questCwdMock.calledWith([{ questId }]).resolves(
        QuestCwdResolutionStub({
          kind: 'missing-worktree',
          worktreePath: absoluteFilePathContract.parse(worktreePath),
        }),
      );
    },
  };
};
