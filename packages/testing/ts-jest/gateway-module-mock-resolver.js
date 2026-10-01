/**
 * The Jest `resolver` both Jest base configs set — the repo-root `jest.config.base.js` and the
 * published `jest-config-base.js`. A request for an npm gateway module mock resolves to that mock;
 * every other request goes to Jest's own default resolver.
 *
 * A mock lives beside its wrapper as `packages/@gateway/npm/src/<folder>/<folder>.jest-mock.cjs` and
 * answers both `#gateway/npm/<folder>` and the raw package name its barrel re-exports. Mocks are
 * found by scanning from Jest's `rootDir` for the project being run, once per `rootDir`, so a new
 * mock needs no config edit and the npm gateway's own run gets none.
 *
 * Jest applies `moduleNameMapper` before it calls a resolver, so a package's own mapping wins over a
 * mock. A request answered here never reaches the default resolver, so a mock resolves even where
 * the real package is not installed.
 */
'use strict';

// Jest loads a resolver with plain Node `require`, so the tsx CJS hook is what lets the broker's
// TypeScript source load here — the same reason transformers.js registers it.
require('tsx/cjs');

const {
  gatewayModuleMockMapBroker,
} = require('../src/brokers/gateway-module-mock/map/gateway-module-mock-map-broker');

const mockMapsByRootDir = new Map();

const mockMapFor = (rootDir) => {
  const cached = mockMapsByRootDir.get(rootDir);
  if (cached !== undefined) {
    return cached;
  }
  const mockMap = gatewayModuleMockMapBroker({ rootDir });
  mockMapsByRootDir.set(rootDir, mockMap);
  return mockMap;
};

module.exports = (request, options) => {
  // Config normalization resolves `transform`, `setupFiles` and the like through this resolver with
  // no `rootDir`; those are never mocks.
  if (typeof options.rootDir !== 'string') {
    return options.defaultResolver(request, options);
  }

  const mockMap = mockMapFor(options.rootDir);

  // `hasOwn`, not a bare lookup: a request named `constructor` must not read Object.prototype.
  if (Object.hasOwn(mockMap, request)) {
    return mockMap[request];
  }

  return options.defaultResolver(request, options);
};
