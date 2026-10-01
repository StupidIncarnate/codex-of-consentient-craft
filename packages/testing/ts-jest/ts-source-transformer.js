/**
 * The Jest transformer the PUBLISHED `jest-config-base.js` runs on every TypeScript file: ts-jest,
 * with a cache key that also covers the jest.mock() calls the proxy-mock transformer hoists.
 *
 * ts-jest keys its cache on the file's own text, its path, its config, and the transformer
 * `version` strings. A test file's hoisted mocks come from OTHER files: every proxy and barrel its
 * proxy imports reach, and the absolute path each relative mock resolves to. When one of those
 * changes and the test file's own text does not, ts-jest would serve the old transform, which still
 * mocks the old path and fails with "Cannot find module '<old path>'". So this key appends a hash of
 * the merged mock calls, read off disk by the same walk the hoister runs. That walk parses only the
 * proxy chain, never the whole program, and a file that is not a test file adds a constant.
 *
 * Plain CJS, loaded by Jest outside ts-jest like its siblings in this folder.
 */
'use strict';

// See the comment in transformers.js: this hook is what lets the source require below resolve.
require('tsx/cjs');

const crypto = require('crypto');
const ts = require('typescript');

const {
  proxyMockCallsCollectMiddleware,
} = require('../src/middleware/proxy-mock-calls-collect/proxy-mock-calls-collect-middleware');

// The same test-file rule as the proxy-mock transformer's own factory, so the key covers exactly
// the files that transformer rewrites.
const isProxyMockTarget = ({ filePath }) => filePath.includes('.test.ts');

const proxyMockCacheKey = ({ source, filePath }) => {
  if (!isProxyMockTarget({ filePath })) {
    return 'proxy-mocks:none';
  }
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const mockCalls = proxyMockCallsCollectMiddleware({ sourceFile, program: undefined });
  const digest = crypto.createHash('sha256').update(JSON.stringify(mockCalls)).digest('hex');
  return `proxy-mocks:${digest}`;
};

const createTransformer = (tsJestOptions) => {
  const tsJest = require('ts-jest').default.createTransformer(tsJestOptions);

  return {
    getCacheKey: (source, filePath, transformOptions) =>
      `${tsJest.getCacheKey(source, filePath, transformOptions)}:${proxyMockCacheKey({ source, filePath })}`,
    getCacheKeyAsync: async (source, filePath, transformOptions) =>
      `${await tsJest.getCacheKeyAsync(source, filePath, transformOptions)}:${proxyMockCacheKey({ source, filePath })}`,
    process: (source, filePath, transformOptions) =>
      tsJest.process(source, filePath, transformOptions),
    processAsync: async (source, filePath, transformOptions) =>
      tsJest.processAsync(source, filePath, transformOptions),
  };
};

module.exports = {
  createTransformer,
  proxyMockCacheKey,
};
