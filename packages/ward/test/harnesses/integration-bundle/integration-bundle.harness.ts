/**
 * PURPOSE: Seeds a real package whose integration tests read its build, runs real ward processes
 * against it from ward's own TypeScript source, and reads back what those tests saw. The unit tests
 * of the integration check mock the filesystem and the build, so none of them can show that two
 * ward runs at once never hand a test a half-written build. This harness puts real processes on a
 * real disk so the integration test can.
 *
 * The package sits inside this ward package (under `.test-tmp/`, which git ignores) rather than in
 * the system temp directory, because ward finds jest by walking up from the package to the nearest
 * `node_modules/.bin`. Ward runs through `tsx` with the `source` condition, so it grades the source
 * on disk and needs no build of ward first.
 *
 * Its build writes the first half of its output, waits, then writes the second half. A test handed
 * the directory while the build is still writing sees only the first half.
 *
 * USAGE:
 * const harness = integrationBundleHarness();
 * await harness.seedOptedInPackage({ packageRoot });
 * const [first, second] = await Promise.all([harness.runWard({ packageRoot }), harness.runWard({ packageRoot })]);
 * harness.seenByTests({ packageRoot });
 * // Returns what each run's test found in the bundle directory it was handed
 */
import { run } from '#gateway/node/child_process';
import { readdirSync, readFileSync } from '#gateway/node/fs';
import { ensureDir, writeFile } from '#gateway/node/fs__promises';
import { join, resolve } from '#gateway/node/path';
import { execPath } from '#gateway/node/process';

const WARD_PACKAGE_ROOT = resolve(__dirname, '../../..');
const WARD_ENTRY_SOURCE = join(WARD_PACKAGE_ROOT, 'bin/ward-entry.ts');
const SEEN_DIR = 'seen';
// Long enough that two ward processes started together are both past their cache check before
// either build is published, so the race the cache must survive really happens.
const BUILD_HALF_WRITTEN_MS = 1500;

const FIXTURE_FILES = {
  'package.json': JSON.stringify({
    name: 'integration-bundle-fixture',
    version: '1.0.0',
    scripts: { build: 'node build.js' },
    ward: { integrationBuild: true },
  }),
  'jest.config.js': "module.exports = { testEnvironment: 'node', transform: {} };\n",
  'build.js': [
    "const fs = require('fs');",
    "const path = require('path');",
    "const outDir = process.argv[process.argv.indexOf('--outDir') + 1];",
    'fs.mkdirSync(outDir, { recursive: true });',
    "fs.writeFileSync(path.join(outDir, 'part-1.txt'), 'first half');",
    `setTimeout(() => fs.writeFileSync(path.join(outDir, 'part-2.txt'), 'second half'), ${String(BUILD_HALF_WRITTEN_MS)});`,
    '',
  ].join('\n'),
  'src/bundle.integration.test.js': [
    "const fs = require('fs');",
    "const path = require('path');",
    '',
    "test('reads a complete build', () => {",
    '  const bundleDir = process.env.DUNGEONMASTER_BUNDLE_DIR;',
    '  const files = fs.readdirSync(bundleDir).sort();',
    `  const seenDir = path.join(__dirname, '..', '${SEEN_DIR}');`,
    '  fs.mkdirSync(seenDir, { recursive: true });',
    "  fs.writeFileSync(path.join(seenDir, String(process.pid) + '.json'), JSON.stringify({ bundleDir, files }));",
    "  expect(files).toEqual(['part-1.txt', 'part-2.txt']);",
    '});',
    '',
  ].join('\n'),
} as const;

export const integrationBundleHarness = (): {
  baseDir: string;
  seedOptedInPackage: (params: { packageRoot: string }) => Promise<void>;
  runWard: (params: { packageRoot: string }) => Promise<{ exitCode: number; output: string }>;
  bundleEntries: (params: { packageRoot: string }) => string[];
  seenByTests: (params: { packageRoot: string }) => unknown[];
} => ({
  baseDir: join(WARD_PACKAGE_ROOT, '.test-tmp'),

  seedOptedInPackage: async ({ packageRoot }: { packageRoot: string }): Promise<void> => {
    await ensureDir(join(packageRoot, 'src'));
    await Promise.all(
      Object.entries(FIXTURE_FILES).map(async ([relativePath, content]) =>
        writeFile(join(packageRoot, relativePath), content),
      ),
    );
  },

  runWard: async ({
    packageRoot,
  }: {
    packageRoot: string;
  }): Promise<{ exitCode: number; output: string }> => {
    const { exitCode, output } = await run({
      command: execPath,
      args: [
        '--conditions=source',
        '--import',
        'tsx',
        WARD_ENTRY_SOURCE,
        'run',
        '--only',
        'integration',
      ],
      cwd: packageRoot,
      stdin: 'ignore',
    });
    return { exitCode, output };
  },

  bundleEntries: ({ packageRoot }: { packageRoot: string }): string[] =>
    readdirSync(join(packageRoot, '.ward/bundle')).sort(),

  seenByTests: ({ packageRoot }: { packageRoot: string }): unknown[] =>
    readdirSync(join(packageRoot, SEEN_DIR))
      .sort()
      .map((name): unknown => JSON.parse(readFileSync(join(packageRoot, SEEN_DIR, name)))),
});
