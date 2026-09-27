import { gitRunProxy } from '../git-run/git-run.proxy';
import type { ArgMatcher } from '../../arg-matcher/arg-matcher';

const LOG_FORMAT = '--format=%x1e%H%x1f%s%x1f%b%x1f';
const RANGE_SUFFIX = '..HEAD';

// `baseRef` gets interpolated into the range element (`${baseRef}..HEAD`) before it reaches argv.
// A literal string interpolates as usual; a predicate cannot, so it is wrapped into a predicate
// over the whole range element instead — one that strips the fixed `..HEAD` suffix before handing
// the rest to the caller's own predicate.
const revisionRangeMatcher = ({ baseRef }: { baseRef: ArgMatcher }): ArgMatcher => {
  if (typeof baseRef === 'function') {
    return (value: unknown): boolean =>
      typeof value === 'string' &&
      value.endsWith(RANGE_SUFFIX) &&
      baseRef(value.slice(0, -RANGE_SUFFIX.length));
  }

  return `${baseRef}${RANGE_SUFFIX}`;
};

export const logNameOnlyProxy = (): {
  setupResult: (params: { baseRef: string; exitCode: number; output: string }) => void;
  returnsMatchingBaseRef: (params: {
    baseRef: ArgMatcher;
    exitCode: number;
    output: string;
  }) => void;
  getCallsFor: (params: { baseRef: ArgMatcher }) => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({
      baseRef,
      exitCode,
      output,
    }: {
      baseRef: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: ['log', '--name-only', LOG_FORMAT, `${baseRef}${RANGE_SUFFIX}`],
        exitCode,
        output,
      });
    },

    returnsMatchingBaseRef: ({
      baseRef,
      exitCode,
      output,
    }: {
      baseRef: ArgMatcher;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.returnsMatchingArgs({
        args: ['log', '--name-only', LOG_FORMAT, revisionRangeMatcher({ baseRef })],
        exitCode,
        output,
      });
    },

    getCallsFor: ({ baseRef }: { baseRef: ArgMatcher }): readonly unknown[][] =>
      runProxy.getCallsFor({
        args: ['log', '--name-only', LOG_FORMAT, revisionRangeMatcher({ baseRef })],
      }),
  };
};
