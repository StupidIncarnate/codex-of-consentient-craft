import { readdirSyncProxy } from '#gateway/node/fs/readdir-sync/readdir-sync.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { readNonEmptyLinesProxy } from '#gateway/node/fs__promises/read-non-empty-lines/read-non-empty-lines.proxy';
import { homedir } from '#gateway/node/os';
import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/brokers/claude-line/normalize/claude-line-normalize-broker.proxy';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
import type { Quest, Session } from '@dungeonmaster/shared/contracts';
import { sessionContract } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import {
  claudeProjectPathEncoderTransformer,
  stripJsonlSuffixTransformer,
} from '@dungeonmaster/shared/transformers';

type FileName = string;
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { questCwdResolveBroker } from '../../quest/cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../../quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questGetServerConfigBrokerProxy } from '../../quest/get-server-config/quest-get-server-config-broker.proxy';
import { chatReplayJsonlReadBrokerProxy } from '../replay-jsonl-read/chat-replay-jsonl-read-broker.proxy';

// The quest-scoped cwd resolution is mocked at the module boundary — questCwdResolveBroker's own
// worktree / repo-root / missing-worktree branching has its own test suite; here it only supplies
// the resolved cwd (or the missing path) for the questId a test stages.
registerModuleMock({ module: '../../quest/cwd-resolve/quest-cwd-resolve-broker' });

type GuildConfig = Parameters<ReturnType<typeof guildGetBrokerProxy>['setupConfig']>[0]['config'];

export const chatHistoryReplayBrokerProxy = (): {
  setupGuild: (params: { config: GuildConfig; homeDir: string; sessionId: Session['id'] }) => void;
  setupMainSession: (params: { content: string; sessionId?: Session['id'] }) => void;
  setupMainSessionMissing: (params?: { sessionId?: Session['id'] }) => void;
  setupSubagentDir: (params: { files: FileName[]; sessionId?: Session['id'] }) => void;
  setupSubagentFile: (params: { content: string; sessionId?: Session['id'] }) => void;
  setupSubagentDirMissing: (params?: { sessionId?: Session['id'] }) => void;
  setupCwdResolveSuccess: (params: { cwd: string }) => void;
  setupCwdResolveReject: () => void;
  setupQuestSession: (params: {
    questId: Quest['id'];
    sessionId: Session['id'];
    cwd: string;
  }) => void;
  setupQuestWorktree: (params: { questId: Quest['id']; worktreePath: string }) => void;
  setupQuestRepoRoot: (params: { questId: Quest['id']; repoRoot: string }) => void;
  setupQuestWorktreeMissing: (params: { questId: Quest['id']; worktreePath: string }) => void;
  setPort: (params: { value: string }) => void;
} => {
  claudeLineNormalizeBrokerProxy();
  const cwdProxy = cwdResolveBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  // The broker resolves a port to build the serverBaseUrl it hands the chat-line processor.
  // Staged here, before any test runs, so every existing test in this file — none of which
  // sets DUNGEONMASTER_PORT itself — doesn't fall through portResolveBroker to a real fs walk
  // for `.dungeonmaster.json` (this suite's fs mock throws on unmatched calls). Exposed as
  // `setPort` below so an individual test can pin a different port.
  const serverConfigProxy = questGetServerConfigBrokerProxy();
  serverConfigProxy.setPort({ value: '3737' });
  // `registerMock`'s `calledWith([]).returns(...)` answers every matching call, so a test
  // replaying two sessions (two `homedir()` calls) gets the same value both times with no
  // extra staging.
  const homedirHandle = registerMock({ fn: homedir });
  const readLinesProxy = readNonEmptyLinesProxy();
  const readdirProxy = readdirSyncProxy();
  // Wired to satisfy enforce-proxy-child-creation; the readLinesProxy above already
  // mocks the underlying readFile that the replay broker delegates to.
  chatReplayJsonlReadBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation; the module mock above supplies the actual
  // return values, so this child's own internal fs/broker mocks are never exercised.
  questCwdResolveBrokerProxy();
  const questCwdMock = registerMock({ fn: questCwdResolveBroker });

  // chat-history-replay-broker walks up from the guild path to the repo root via
  // cwdResolveBroker so the encoded JSONL path matches the spawn cwd of the agent that
  // wrote the session. The walk runs for real over the staged filesystem from this test's own
  // guild path, captured by setupGuild below. Default answer mirrors the guild's own path: a
  // `.dungeonmaster.json` staged at the guild path itself.
  const guildStartPathsRef: { value: readonly string[] } = { value: [] };

  // The broker reads the main session file and scans the subagents/ dir at a JSONL path it
  // computes from homeDir + the resolved project path + sessionId via the REAL (unmocked)
  // claudeProjectPathEncoderTransformer — not through a mocked join that returns ''. That
  // makes the address computable rather than unknowable, so we compute it here with the same
  // transformer instead of keying on calledWith([]), which would hide a wrong-path regression
  // exactly like the class of bug this migration exists to catch. Placeholders below are never
  // read for real — setupGuild always runs first in every test.
  const homeDirRef: { value: string } = {
    value: '/unset',
  };
  const sessionIdRef: { value: Session['id'] } = { value: sessionContract.shape.id.parse('unset') };
  // A cwd is a property of the SESSION, so a read is addressed at the directory the session it
  // belongs to resolves to — which is what lets one test stage two sessions of one carved quest at
  // two directories. `setupQuestSession` writes this map; the quest/guild-wide ref below answers a
  // session with no row of its own.
  const sessionPathOverridesRef = new Map<Session['id'], string>();
  const projectPathOverrideRef: { value: string | undefined } = { value: undefined };
  // Keyed per session: two sessions each have their own subagents/ directory, so one shared queue
  // would let one session's `setupSubagentFile` consume the other's filename.
  const subagentFileQueuesRef = new Map<Session['id'], FileName[]>();

  const resolveProjectPath = ({ sessionId }: { sessionId: Session['id'] }): string => {
    const sessionPath = sessionPathOverridesRef.get(sessionId);
    if (sessionPath !== undefined) {
      return sessionPath;
    }
    if (projectPathOverrideRef.value !== undefined) {
      return projectPathOverrideRef.value;
    }
    const guildPath = guildStartPathsRef.value.at(0);
    return guildPath ?? '/unset';
  };

  const resolveJsonlPath = ({ sessionId }: { sessionId: Session['id'] }): string =>
    claudeProjectPathEncoderTransformer({
      homeDir: homeDirRef.value,
      projectPath: resolveProjectPath({ sessionId }),
      sessionId,
    });

  const resolveSubagentsDir = ({ sessionId }: { sessionId: Session['id'] }): string =>
    `${stripJsonlSuffixTransformer({ filePath: resolveJsonlPath({ sessionId }) })}/subagents`;

  return {
    setupGuild: ({
      config,
      homeDir,
      sessionId,
    }: {
      config: GuildConfig;
      homeDir: string;
      sessionId: Session['id'];
    }): void => {
      // homeDir AND homePath forwarded to guildGetBrokerProxy's own composed
      // guildConfigReadBrokerProxy — its exact join()/homedir() addresses must agree with every
      // OTHER proxy this test composes against the SAME homeDir (questResolveQuestsPathBrokerProxy
      // among them), since all of them share the SAME process-wide gateway mocks. Passing homeDir
      // alone would leave guildConfigReadBrokerProxy defaulting its OWN unrelated homePath fixture,
      // which — being staged AFTER a sibling proxy's correct one, on the identical
      // join(homeDir, '.dungeonmaster') address — would silently win and misdirect every other
      // composed broker's own home resolution to a path nothing else staged.
      const homePath = `${homeDir}/${dungeonmasterHomeStatics.paths.configDir}`;
      guildProxy.setupConfig({ config, homeDir, homePath });
      homedirHandle.calledWith([]).returns(homeDir);
      homeDirRef.value = homeDir;
      sessionIdRef.value = sessionId;

      guildStartPathsRef.value = config.guilds.map((guild) => guild.path);
      for (const startPath of guildStartPathsRef.value) {
        cwdProxy.setupRepoRootFoundAtStart({ startPath });
      }
    },
    setupMainSession: ({
      content,
      sessionId,
    }: {
      content: string;
      sessionId?: Session['id'];
    }): void => {
      readLinesProxy.returnsRaw({
        path: resolveJsonlPath({ sessionId: sessionId ?? sessionIdRef.value }),
        rawContents: content,
      });
    },
    // A session whose own top-level JSONL was never written (or has since been removed) —
    // the broker retries briefly, then treats it as no main content rather than throwing.
    setupMainSessionMissing: ({ sessionId }: { sessionId?: Session['id'] } = {}): void => {
      readLinesProxy.missing({
        path: resolveJsonlPath({ sessionId: sessionId ?? sessionIdRef.value }),
      });
    },
    setupSubagentDir: ({
      files,
      sessionId,
    }: {
      files: FileName[];
      sessionId?: Session['id'];
    }): void => {
      const targetSessionId = sessionId ?? sessionIdRef.value;
      readdirProxy.returns({
        path: resolveSubagentsDir({ sessionId: targetSessionId }),
        names: files,
      });
      subagentFileQueuesRef.set(targetSessionId, [...files]);
    },
    setupSubagentFile: ({
      content,
      sessionId,
    }: {
      content: string;
      sessionId?: Session['id'];
    }): void => {
      const targetSessionId = sessionId ?? sessionIdRef.value;
      const fileName = (subagentFileQueuesRef.get(targetSessionId) ?? []).shift();
      const filePath = `${resolveSubagentsDir({ sessionId: targetSessionId })}/${String(fileName)}`;
      readLinesProxy.returnsRaw({ path: filePath, rawContents: content });
    },
    setupSubagentDirMissing: ({ sessionId }: { sessionId?: Session['id'] } = {}): void => {
      const dirPath = resolveSubagentsDir({ sessionId: sessionId ?? sessionIdRef.value });
      readdirProxy.throws({
        path: dirPath,
        error: FsErrorStub({ code: 'ENOENT', path: dirPath }),
      });
    },
    setupCwdResolveSuccess: ({ cwd }: { cwd: string }): void => {
      projectPathOverrideRef.value = cwd;
      for (const startPath of guildStartPathsRef.value) {
        cwdProxy.setupRepoRootFoundInParent({ startPath, repoRoot: cwd });
      }
    },
    setupCwdResolveReject: (): void => {
      for (const startPath of guildStartPathsRef.value) {
        cwdProxy.setupRepoRootNotFound({ startPath });
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
      questId: Quest['id'];
      sessionId: Session['id'];
      cwd: string;
    }): void => {
      questCwdMock.calledWith([{ questId, sessionId }]).resolves(
        QuestCwdResolutionStub({
          kind: 'session',
          cwd,
        }),
      );
      sessionPathOverridesRef.set(sessionId, cwd);
    },
    setupQuestWorktree: ({
      questId,
      worktreePath,
    }: {
      questId: Quest['id'];
      worktreePath: string;
    }): void => {
      questCwdMock.calledWith([{ questId }]).resolves(
        QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: worktreePath,
        }),
      );
      projectPathOverrideRef.value = worktreePath;
    },
    setupQuestRepoRoot: ({
      questId,
      repoRoot,
    }: {
      questId: Quest['id'];
      repoRoot: string;
    }): void => {
      questCwdMock.calledWith([{ questId }]).resolves(
        QuestCwdResolutionStub({
          kind: 'repo-root',
          cwd: repoRoot,
        }),
      );
      projectPathOverrideRef.value = repoRoot;
    },
    // No projectPathOverrideRef update — the broker throws before ever computing a JSONL path
    // for this case, so no session/subagent read needs to be staged against one.
    setupQuestWorktreeMissing: ({
      questId,
      worktreePath,
    }: {
      questId: Quest['id'];
      worktreePath: string;
    }): void => {
      questCwdMock.calledWith([{ questId }]).resolves(
        QuestCwdResolutionStub({
          kind: 'missing-worktree',
          worktreePath,
        }),
      );
    },
    setPort: serverConfigProxy.setPort,
  };
};
