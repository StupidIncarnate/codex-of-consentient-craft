import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { cwd } from '#gateway/node/process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { claudeCodeSessionFindByToolUseIdBrokerProxy } from '../../../brokers/claude-code-session/find-by-tool-use-id/claude-code-session-find-by-tool-use-id-broker.proxy';
import { claudeCodeSessionResolveBrokerProxy } from '../../../brokers/claude-code-session/resolve/claude-code-session-resolve-broker.proxy';

export const ResolveCallerSessionLayerResponderProxy = (): {
  // Stages BOTH strategies against the same homedir/projectDir the responder's
  // cwd/osUserHomedirAdapter defaults resolve to. `sessions` feeds the deterministic
  // toolUseId scan; `mtimeEntries` feeds the newest-mtime fallback. Staging both in one call is
  // what lets a test prove which one actually answered.
  setupSessions: (params: {
    homedir: string;
    projectDir: string;
    sessions: readonly { name: string; contents: string }[];
    mtimeEntries: readonly { name: string; mtimeMs: number }[];
  }) => void;
  setupSessionsMissing: (params: { homedir: string; projectDir: string }) => void;
} => {
  cwdProxy();
  const cwdHandle = registerMock({ fn: cwd });
  const findByToolUseIdProxy = claudeCodeSessionFindByToolUseIdBrokerProxy();
  const resolveProxy = claudeCodeSessionResolveBrokerProxy();

  return {
    setupSessions: ({
      homedir,
      projectDir,
      sessions,
      mtimeEntries,
    }: {
      homedir: string;
      projectDir: string;
      sessions: readonly { name: string; contents: string }[];
      mtimeEntries: readonly { name: string; mtimeMs: number }[];
    }): void => {
      cwdHandle.calledWith([]).returns(projectDir);
      // Both child proxies read the SAME readdir address, so the later registration wins for the
      // directory listing. Stage the mtime fallback last and give it the full entry list, then
      // stage per-file contents for the scan — those are addressed by path, so they do not collide.
      findByToolUseIdProxy.setupSessions({ homedir, projectDir, sessions });
      resolveProxy.setupSessionsDir({ homedir, projectDir, entries: mtimeEntries });
    },
    setupSessionsMissing: ({
      homedir,
      projectDir,
    }: {
      homedir: string;
      projectDir: string;
    }): void => {
      cwdHandle.calledWith([]).returns(projectDir);
      findByToolUseIdProxy.setupSessionsDirMissing({ homedir, projectDir });
      resolveProxy.setupSessionsDirMissing({ homedir, projectDir });
    },
  };
};
