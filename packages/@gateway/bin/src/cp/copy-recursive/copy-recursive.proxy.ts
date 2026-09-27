import { cpRunProxy } from '../cp-run/cp-run.proxy';
import type { ArgMatcher } from '../../arg-matcher/arg-matcher';

export const copyRecursiveProxy = (): {
  setupResult: (params: {
    sources: string[];
    destination: string;
    hardlink?: boolean;
    exitCode: number;
    output: string;
  }) => void;
  returnsMatchingDestination: (params: {
    sources: readonly ArgMatcher[];
    destination: ArgMatcher;
    hardlink?: boolean;
    exitCode: number;
    output: string;
  }) => void;
  getCallsFor: (params: {
    sources: readonly ArgMatcher[];
    destination: ArgMatcher;
    hardlink?: boolean;
  }) => readonly unknown[][];
} => {
  const runProxy = cpRunProxy();

  return {
    setupResult: ({
      sources,
      destination,
      hardlink,
      exitCode,
      output,
    }: {
      sources: string[];
      destination: string;
      hardlink?: boolean;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: [hardlink === true ? '-al' : '-a', ...sources, destination],
        exitCode,
        output,
      });
    },

    returnsMatchingDestination: ({
      sources,
      destination,
      hardlink,
      exitCode,
      output,
    }: {
      sources: readonly ArgMatcher[];
      destination: ArgMatcher;
      hardlink?: boolean;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.returnsMatchingArgs({
        args: [hardlink === true ? '-al' : '-a', ...sources, destination],
        exitCode,
        output,
      });
    },

    getCallsFor: ({
      sources,
      destination,
      hardlink,
    }: {
      sources: readonly ArgMatcher[];
      destination: ArgMatcher;
      hardlink?: boolean;
    }): readonly unknown[][] =>
      runProxy.getCallsFor({ args: [hardlink === true ? '-al' : '-a', ...sources, destination] }),
  };
};
