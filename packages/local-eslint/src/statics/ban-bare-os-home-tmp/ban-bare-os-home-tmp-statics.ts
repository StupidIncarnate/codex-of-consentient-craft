/**
 * PURPOSE: Configuration for the ban-bare-os-home-tmp rule — the module specifiers and function
 * names it tracks, and the path allowlist that keeps the OS adapter layer (src/adapters/os/) able
 * to call homedir()/tmpdir() directly, plus — for tmpdir() only — harnesses and each package's own
 * playwright.config.ts, which legitimately need the real OS tmp dir. homedir() gets no such
 * exception: every home read goes through an adapter, with no bare-call escape hatch anywhere.
 *
 * USAGE:
 * banBareOsHomeTmpStatics.osModule.specifiers
 * // Returns ['os', 'node:os']
 */
export const banBareOsHomeTmpStatics = {
  osModule: {
    specifiers: ['os', 'node:os'],
    requireIdentifierName: 'require',
  },
  functionNames: ['homedir', 'tmpdir'],
  allowlist: {
    // Both homedir() and tmpdir() may be called bare here — this IS the OS adapter layer.
    adaptersPathSubstring: '/src/adapters/os/',
    // tmpdir() only. Harnesses (jest.setup-home.js-style seeding, mkdtempSync harnesses) and
    // Playwright's own config legitimately need the real OS tmp dir.
    tmpdirOnlyPathSubstrings: ['/test/harnesses/'],
    tmpdirOnlyPathRegexSources: ['\\.harness\\.ts$', '/packages/[^/]+/playwright\\.config\\.ts$'],
  },
} as const;
