/**
 * PURPOSE: Proxy for eslint-lint-run-targeted-broker that delegates to adapter proxies
 *
 * USAGE:
 * const proxy = eslintLintRunTargetedBrokerProxy();
 * proxy.returnsLintResults({ content: 'const x = 1;', results: [...] });
 * const results = await eslintLintRunTargetedBroker({ content: 'const x = 1;', filePath, config });
 */

import { eslintEslintAdapterProxy } from '../../../adapters/eslint/eslint/eslint-eslint-adapter.proxy';
import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

export const eslintLintRunTargetedBrokerProxy = (): {
  setupLintResults: (params: {
    oldContent: string;
    oldResults: unknown[];
    newResults: unknown[];
  }) => void;
  returnsLintResults: (params: { content: string; results: unknown[] }) => void;
  throwsOnConstruction: (params: { error: Error }) => void;
} => {
  processCwdAdapterProxy();
  const eslintProxy = eslintEslintAdapterProxy();
  const resolveProxy = pathResolveAdapterProxy();

  // pathResolveAdapterProxy no longer has a global default (converted to argument-addressed
  // staging). The resolved absolute path only reaches the already-mocked lintText call, which
  // this proxy addresses by content, not by filePath — so any non-throwing placeholder is fine.
  resolveProxy.getHandle().calledWith([]).returns('/resolved/path');

  const lintTextHandle = eslintProxy.getLintTextHandle();

  return {
    // Old and new lint runs share a filePath but differ in content — that's the real signal
    // production code uses to tell them apart (violations-check-new-broker.ts lints the same
    // file's before/after content in parallel). oldContent is a known literal at setup time; the
    // new content comes from whatever edit the caller's test applies, which this proxy cannot
    // predict, so it is addressed as "anything that isn't the known old content."
    setupLintResults: ({ oldContent, oldResults, newResults }): void => {
      lintTextHandle.calledWith([oldContent]).resolves(oldResults);
      lintTextHandle
        .calledWith([(content: unknown) => content !== oldContent])
        .resolves(newResults);
    },

    returnsLintResults: ({ content, results }): void => {
      lintTextHandle.calledWith([content]).resolves(results);
    },

    // Overrides the constructor's success catch-all with a real throw, so the broker's
    // try/catch is the thing under test — not a coincidence where the lintText empty-array
    // default happens to match the error path's return value.
    throwsOnConstruction: ({ error }): void => {
      eslintProxy.getConstructorHandle().calledWith([]).throws(error);
    },
  };
};
