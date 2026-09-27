import { npmRunProxy } from '../npm-run/npm-run.proxy';
import type { ArgMatcher } from '../../gateway-test-support/arg-matcher';

export const runScriptProxy = (): {
  setupResult: (params: {
    script: string;
    workspace?: string;
    args?: string[];
    exitCode: number;
    output: string;
  }) => void;
  returnsMatchingScript: (params: {
    script: ArgMatcher;
    workspace?: string;
    args?: string[];
    exitCode: number;
    output: string;
  }) => void;
  getCallsFor: (params: {
    script: ArgMatcher;
    workspace?: string;
    args?: string[];
  }) => readonly unknown[][];
} => {
  const runProxy = npmRunProxy();

  return {
    setupResult: ({
      script,
      workspace,
      args,
      exitCode,
      output,
    }: {
      script: string;
      workspace?: string;
      args?: string[];
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: [
          'run',
          script,
          ...(workspace === undefined ? [] : [`--workspace=${workspace}`]),
          ...(args ?? []),
        ],
        exitCode,
        output,
      });
    },

    returnsMatchingScript: ({
      script,
      workspace,
      args,
      exitCode,
      output,
    }: {
      script: ArgMatcher;
      workspace?: string;
      args?: string[];
      exitCode: number;
      output: string;
    }): void => {
      runProxy.returnsMatchingArgs({
        args: [
          'run',
          script,
          ...(workspace === undefined ? [] : [`--workspace=${workspace}`]),
          ...(args ?? []),
        ],
        exitCode,
        output,
      });
    },

    getCallsFor: ({
      script,
      workspace,
      args,
    }: {
      script: ArgMatcher;
      workspace?: string;
      args?: string[];
    }): readonly unknown[][] =>
      runProxy.getCallsFor({
        args: [
          'run',
          script,
          ...(workspace === undefined ? [] : [`--workspace=${workspace}`]),
          ...(args ?? []),
        ],
      }),
  };
};
