/**
 * PURPOSE: Where a gateway module mock lives and what it is named. A mock for an npm package sits in
 * that package's own npm gateway folder, beside the wrapper, as `<folder>/<folder>.jest-mock.cjs`;
 * the resolver finds every one by these names, so a new mock file needs no config edit.
 *
 * USAGE:
 * gatewayModuleMockStatics.files.mockSuffix;
 * // Returns '.jest-mock.cjs'
 */

export const gatewayModuleMockStatics = {
  locations: {
    npmGatewayDir: 'packages/@gateway/npm',
    srcDir: 'src',
  },
  files: {
    mockSuffix: '.jest-mock.cjs',
    barrelExtension: '.ts',
  },
  specifiers: {
    npmGatewayPrefix: '#gateway/npm/',
  },
} as const;
