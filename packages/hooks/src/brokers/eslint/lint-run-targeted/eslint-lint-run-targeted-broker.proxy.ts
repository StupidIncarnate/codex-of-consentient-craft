/**
 * PURPOSE: Proxy for eslint-lint-run-targeted-broker that delegates to adapter proxies
 *
 * USAGE:
 * const proxy = eslintLintRunTargetedBrokerProxy();
 * proxy.returnsLintResults({ content: 'const x = 1;', results: [...] });
 * const results = await eslintLintRunTargetedBroker({ content: 'const x = 1;', filePath, config });
 */

import * as eslintGateway from '#gateway/npm/eslint';
import { ESLint } from '#gateway/npm/eslint';
import { resolve } from '#gateway/node/path';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { cwd } from '#gateway/node/process';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
} from '@dungeonmaster/testing/register-mock';

registerModuleMock({ module: '#gateway/npm/eslint' });

export const eslintLintRunTargetedBrokerProxy = (): {
  setupLintResults: (params: {
    oldContent: string;
    oldResults: unknown[];
    newResults: unknown[];
  }) => void;
  returnsLintResults: (params: { content: string; results: unknown[] }) => void;
  returnsLintResultsForDefaultCwd: (params: {
    content: string;
    filePath: string;
    results: unknown[];
  }) => void;
  throwsOnConstruction: (params: { error: Error }) => void;
} => {
  cwdProxy();
  // cwdProxy() itself stages nothing (the gateway wrapper offers no staging surface), so the
  // no-cwd branch is staged directly on the gateway function it calls — a fixed address, not
  // the real process.cwd(), so a test built on it never depends on where jest runs.
  const cwdHandle = registerMock({ fn: cwd });
  cwdHandle.calledWith([]).returns('/default/cwd');
  const resolveHandle = registerMock({ fn: resolve });

  // The resolved absolute path only reaches the already-mocked lintText call, which
  // this proxy addresses by content, not by filePath — so any non-throwing placeholder is fine.
  resolveHandle.calledWith([]).returns('/resolved/path');

  const lintTextHandle = registerSpyOn({
    object: ESLint.prototype,
    method: 'lintText',
  });

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

    // Addressed by the staged '/default/cwd' (via the resolved absolute path) rather than by
    // content alone — this is what a caller that omits `cwd` actually resolves and lints against,
    // so a broker that stops calling cwd() on that branch fails whatever test stages this.
    returnsLintResultsForDefaultCwd: ({ content, filePath, results }): void => {
      const absolutePath = `/default/cwd/resolved/${filePath}`;
      resolveHandle.calledWith(['/default/cwd', filePath]).returns(absolutePath);
      lintTextHandle.calledWith([content, { filePath: absolutePath }]).resolves(results);
    },

    // Overrides the constructor with a real throw, so the broker's
    // try/catch is the thing under test — not a coincidence where the lintText empty-array
    // default happens to match the error path's return value.
    throwsOnConstruction: ({ error }): void => {
      const constructorHandle = registerSpyOn({
        object: eslintGateway,
        method: 'ESLint',
      });
      constructorHandle
        .calledWith([(options: unknown) => typeof options === 'object' && options !== null])
        .throws(error);
    },
  };
};
