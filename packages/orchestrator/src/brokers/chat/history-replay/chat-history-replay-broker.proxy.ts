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
import { questGetServerConfigBrokerProxy } from '../../quest/get-server-config/quest-get-server-config-broker.proxy';
import { chatReplayJsonlReadBrokerProxy } from '../replay-jsonl-read/chat-replay-jsonl-read-broker.proxy';
import { scopeSubagentFilesToDescendantsLayerBrokerProxy } from './scope-subagent-files-to-descendants-layer-broker.proxy';

// The quest-scoped cwd resolution is mocked at the module boundary — questCwdResolveBroker's own
// worktree / repo-root / missing-worktree branching has its own test suite; here it only supplies
// the resolved cwd (or the missing path) for the questId a test stages.
registerModuleMock({ module: '../../quest/cwd-resolve/quest-cwd-resolve-broker' });

type GuildConfig = Parameters<ReturnType<typeof guildGetBrokerProxy>['setupConfig']>[0]['config'];

export const chatHistoryReplayBrokerProxy = (): {
  setupGuild: (params: { config: GuildConfig; homeDir: string; sessionId: SessionId }) => void;
  setupMainSession: (params: { content: string; sessionId?: SessionId }) => void;
  setupSubagentDir: (params: { files: FileName[]; sessionId?: SessionId }) => void;
  setupSubagentFile: (params: { content: string; sessionId?: SessionId }) => void;
  setupSubagentDirMissing: (params?: { sessionId?: SessionId }) => void;
  setupCwdResolveSuccess: (params: { cwd: string }) => void;
  setupCwdResolveReject: (params: { error: Error }) => void;
  setupQuestSession: (params: { questId: QuestId; sessionId: SessionId; cwd: string }) => void;
  setupQuestWorktree: (params: { questId: QuestId; worktreePath: string }) => void;
  setupQuestRepoRoot: (params: { questId: QuestId; repoRoot: string }) => void;
  setupQuestWorktreeMissing: (params: { questId: QuestId; worktreePath: string }) => void;
  setPort: (params: { value: string }) => void;
} => {
  claudeLineNormalizeBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces the broker
  // entirely so cwdResolveBrokerProxy's underlying fs/path mocks aren't actually exercised.
  cwdResolveBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  // The broker resolves a port to build the serverBaseUrl it hands the chat-line processor.
  // Staged here, before any test runs, so every existing test in this file — none of which
  // sets DUNGEONMASTER_PORT itself — doesn't fall through portResolveBroker to a real fs walk
  // for `.dungeonmaster.json` (this suite's fs mock throws on unmatched calls). Exposed as
  // `setPort` below so an individual test can pin a different port.
  const serverConfigProxy = questGetServerConfigBrokerProxy();
  serverConfigProxy.setPort({ value: '3737' });
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
  // A cwd is a property of the SESSION, so a read is addressed at the directory the session it
  // belongs to resolves to — which is what lets one test stage two sessions of one carved quest at
  // two directories. `setupQuestSession` writes this map; the quest/guild-wide ref below answers a
  // session with no row of its own.
  const sessionPathOverridesRef = new Map<SessionId, AbsoluteFilePath>();
  const projectPathOverrideRef: { value: AbsoluteFilePath | undefined } = { value: undefined };
  // Keyed per session: two sessions each have their own subagents/ directory, so one shared queue
  // would let one session's `setupSubagentFile` consume the other's filename.
  const subagentFileQueuesRef = new Map<SessionId, FileName[]>();

  const resolveProjectPath = ({ sessionId }: { sessionId: SessionId }): AbsoluteFilePath => {
    const sessionPath = sessionPathOverridesRef.get(sessionId);
    if (sessionPath !== undefined) {
      return sessionPath;
    }
    if (projectPathOverrideRef.value !== undefined) {
      return projectPathOverrideRef.value;
    }
    const guildPath = guildStartPathsRef.value.at(0);
    return absoluteFilePathContract.parse(String(guildPath ?? '/unset'));
  };

  const resolveJsonlPath = ({ sessionId }: { sessionId: SessionId }): AbsoluteFilePath =>
    claudeProjectPathEncoderTransformer({
      homeDir: homeDirRef.value,
      projectPath: resolveProjectPath({ sessionId }),
      sessionId,
    });

  const resolveSubagentsDir = ({ sessionId }: { sessionId: SessionId }): AbsoluteFilePath =>
    absoluteFilePathContract.parse(
      `${stripJsonlSuffixTransformer({ filePath: resolveJsonlPath({ sessionId }) })}/subagents`,
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
    setupMainSession: ({
      content,
      sessionId,
    }: {
      content: string;
      sessionId?: SessionId;
    }): void => {
      readJsonlProxy.returns({
        filePath: resolveJsonlPath({ sessionId: sessionId ?? sessionIdRef.value }),
        content,
      });
    },
    setupSubagentDir: ({
      files,
      sessionId,
    }: {
      files: FileName[];
      sessionId?: SessionId;
    }): void => {
      const targetSessionId = sessionId ?? sessionIdRef.value;
      readdirProxy.returns({ dirPath: resolveSubagentsDir({ sessionId: targetSessionId }), files });
      subagentFileQueuesRef.set(targetSessionId, [...files]);
    },
    setupSubagentFile: ({
      content,
      sessionId,
    }: {
      content: string;
      sessionId?: SessionId;
    }): void => {
      const targetSessionId = sessionId ?? sessionIdRef.value;
      const fileName = (subagentFileQueuesRef.get(targetSessionId) ?? []).shift();
      const filePath = absoluteFilePathContract.parse(
        `${resolveSubagentsDir({ sessionId: targetSessionId })}/${String(fileName)}`,
      );
      readJsonlProxy.returns({ filePath, content });
    },
    setupSubagentDirMissing: ({ sessionId }: { sessionId?: SessionId } = {}): void => {
      readdirProxy.throws({
        dirPath: resolveSubagentsDir({ sessionId: sessionId ?? sessionIdRef.value }),
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
    // Each questCwdResolveBroker scenario below records the cwd it resolves, so a read staged
    // afterwards is addressed at the directory that scenario produces.
    //
    // The two levels mirror the broker's own precedence. `setupQuestSession` records PER SESSION
    // and stages the more specific `[{ questId, sessionId }]` address — registerMock matches an
    // object argument by SUBSET, so it outranks a `[{ questId }]` staging for that one session's
    // call while every other session on the quest still gets the quest-wide answer, which
    // `setupQuestWorktree` / `setupQuestRepoRoot` write to projectPathOverrideRef (the same ref
    // setupCwdResolveSuccess uses, since the broker computes its JSONL path from whichever cwd
    // won, whatever resolved it).
    setupQuestSession: ({
      questId,
      sessionId,
      cwd,
    }: {
      questId: QuestId;
      sessionId: SessionId;
      cwd: string;
    }): void => {
      questCwdMock.calledWith([{ questId, sessionId }]).resolves(
        QuestCwdResolutionStub({
          kind: 'session',
          cwd: repoRootCwdContract.parse(cwd),
        }),
      );
      sessionPathOverridesRef.set(sessionId, absoluteFilePathContract.parse(cwd));
    },
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
    setPort: serverConfigProxy.setPort,
  };
};
