/**
 * PURPOSE: Lays a tiny two-package npm-workspaces repo onto an install testbed for the scan
 * integration test: a root `eslint.config.js` that registers `no-debugger` OFF, one package whose
 * files hold `debugger` statements (and a `console.log` the scanned rule must not report), one
 * clean package, and a real eslint linked into `node_modules/.bin` the way npm links it.
 *
 * USAGE:
 * const harness = scanFixtureHarness();
 * harness.writeWorkspace({ testbed });
 * // Writes package.json, eslint.config.js, packages/app and packages/lib, and links node_modules/.bin/eslint
 */
import { ensureDirSync, symlinkSync } from '#gateway/node/fs';
import { resolvePackageRoot } from '#gateway/node/module';
import { FileContentStub, RelativePathStub } from '@dungeonmaster/testing';
import type { InstallTestbed } from '@dungeonmaster/testing';

export const scanFixtureHarness = (): {
  writeWorkspace: (params: { testbed: InstallTestbed }) => Promise<void>;
} => ({
  writeWorkspace: async ({ testbed }: { testbed: InstallTestbed }): Promise<void> => {
    await Promise.resolve();
    const files = [
      {
        path: 'package.json',
        body: JSON.stringify({ name: 'fixture-root', workspaces: ['packages/*'] }),
      },
      {
        path: 'eslint.config.js',
        body: [
          'const plugin = { rules: { "no-forbidden": { create(context) { return { Identifier(node) { if (node.name === "forbidden") { context.report({ node, message: "forbidden name" }); } } }; } } } };',
          'module.exports = [',
          "  { files: ['**/*.js'], rules: { 'no-debugger': 'off', 'no-console': 'error' } },",
          "  { files: ['packages/app/**/*.js'], plugins: { fixture: plugin }, rules: { 'fixture/no-forbidden': 'off' } },",
          '];',
          '',
        ].join('\n'),
      },
      { path: 'packages/app/package.json', body: JSON.stringify({ name: '@fixture/app' }) },
      { path: 'packages/app/src/a.js', body: 'debugger;\nconst x = 1;\ndebugger;\n' },
      { path: 'packages/app/src/b.js', body: 'const y = 2;\ndebugger;\n' },
      { path: 'packages/app/src/c.js', body: "console.log('not the scanned rule');\n" },
      { path: 'packages/app/src/d.js', body: 'const forbidden = 1;\nconst other = forbidden;\n' },
      { path: 'packages/lib/package.json', body: JSON.stringify({ name: '@fixture/lib' }) },
      { path: 'packages/lib/src/clean.js', body: 'const forbidden = 3;\n' },
    ];

    files.forEach((file) => {
      testbed.writeFile({
        relativePath: RelativePathStub({ value: file.path }),
        content: FileContentStub({ value: file.body }),
      });
    });

    const eslintRoot = resolvePackageRoot({ specifier: 'eslint' });
    ensureDirSync(`${testbed.guildPath}/node_modules/.bin`);
    symlinkSync({
      target: `${String(eslintRoot)}/bin/eslint.js`,
      path: `${testbed.guildPath}/node_modules/.bin/eslint`,
    });
  },
});
