import { npmRunProxy } from '../npm-run/npm-run.proxy';
import type { ArgMatcher } from '../../gateway-test-support/arg-matcher';

const WORKSPACE_PREFIX = '--workspace=';

// `workspace` reaches argv only after being embedded in `--workspace=${workspace}`, so a tolerant
// address is a predicate over the assembled element — stripping the fixed prefix before handing
// the rest to the caller's own predicate.
const workspaceArg = (workspace: ArgMatcher): ArgMatcher => {
  if (typeof workspace === 'function') {
    return (value: unknown): boolean =>
      typeof value === 'string' &&
      value.startsWith(WORKSPACE_PREFIX) &&
      workspace(value.slice(WORKSPACE_PREFIX.length));
  }

  return `${WORKSPACE_PREFIX}${workspace}`;
};

export const runBuildProxy = (): {
  setupResult: (params: { workspace: string; exitCode: number; output: string }) => void;
  returnsMatchingWorkspace: (params: {
    workspace: ArgMatcher;
    exitCode: number;
    output: string;
  }) => void;
  getCallsFor: (params: { workspace: ArgMatcher }) => readonly unknown[][];
} => {
  const runProxy = npmRunProxy();

  return {
    setupResult: ({
      workspace,
      exitCode,
      output,
    }: {
      workspace: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: ['run', 'build', `${WORKSPACE_PREFIX}${workspace}`],
        exitCode,
        output,
      });
    },

    returnsMatchingWorkspace: ({
      workspace,
      exitCode,
      output,
    }: {
      workspace: ArgMatcher;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.returnsMatchingArgs({
        args: ['run', 'build', workspaceArg(workspace)],
        exitCode,
        output,
      });
    },

    getCallsFor: ({ workspace }: { workspace: ArgMatcher }): readonly unknown[][] =>
      runProxy.getCallsFor({ args: ['run', 'build', workspaceArg(workspace)] }),
  };
};
