import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { platformCrossingCheckBroker } from './platform-crossing-check-broker';
import { platformCrossingFixtureHarness } from '../../../../test/harnesses/platform-crossing-fixture/platform-crossing-fixture.harness';

// This is the design doc's own worked example, driven end to end against a real fixture repo
// rather than asserted layer by layer: a browser package reaches a node gateway import three hops
// away, through a second workspace package's root barrel.
describe('platformCrossingCheckBroker (integration)', () => {
  const harness = platformCrossingFixtureHarness();

  describe('a browser package reaches the node gateway through a second package', () => {
    it('VALID: {web imports a named broker whose file imports @dungeonmaster/node/fs} => reports the full chain', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'platform-crossing-multi-hop' }),
      });
      await harness.writeWorkspacesRoot({ testbed });
      await harness.writeWebPackage({ testbed });
      await harness.writeNodeGatewayPackage({ testbed });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/shared2/package.json',
        content: JSON.stringify({ name: '@dungeonmaster/shared2' }),
      });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/shared2/brokers.ts',
        content: "export * from './src/brokers/cwd-resolve/cwd-resolve-broker';",
      });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/shared2/src/brokers/cwd-resolve/cwd-resolve-broker.ts',
        content:
          "import { readFile } from '@dungeonmaster/node/fs';\nexport const cwdResolveBroker = () => readFile();",
      });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/web/src/widgets/chat/chat-widget.tsx',
        content:
          "import { cwdResolveBroker } from '@dungeonmaster/shared2/brokers';\nexport const ChatWidget = () => cwdResolveBroker();",
      });

      const result = await platformCrossingCheckBroker({
        rootPath: FilePathStub({ value: testbed.guildPath }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual([
        {
          packageName: 'web',
          platform: 'browser',
          chain: [
            '@dungeonmaster/shared2/brokers',
            './src/brokers/cwd-resolve/cwd-resolve-broker',
            '@dungeonmaster/node/fs',
          ],
          crossedGatewayPackage: '@dungeonmaster/node',
        },
      ]);
    });
  });

  describe('barrel case', () => {
    it('VALID: {web imports only the barrel export that never touches node} => reports nothing for the sibling export that does', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'platform-crossing-barrel' }),
      });
      await harness.writeWorkspacesRoot({ testbed });
      await harness.writeWebPackage({ testbed });
      await harness.writeNodeGatewayPackage({ testbed });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/shared2/package.json',
        content: JSON.stringify({ name: '@dungeonmaster/shared2' }),
      });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/shared2/brokers.ts',
        content:
          "export * from './src/brokers/cwd-resolve/cwd-resolve-broker';\nexport * from './src/brokers/fs-read/fs-read-broker';",
      });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/shared2/src/brokers/cwd-resolve/cwd-resolve-broker.ts',
        content: 'export const cwdResolveBroker = () => process.cwd();',
      });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/shared2/src/brokers/fs-read/fs-read-broker.ts',
        content:
          "import { readFile } from '@dungeonmaster/node/fs';\nexport const fsReadBroker = () => readFile();",
      });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/web/src/widgets/chat/chat-widget.tsx',
        content:
          "import { cwdResolveBroker } from '@dungeonmaster/shared2/brokers';\nexport const ChatWidget = () => cwdResolveBroker();",
      });

      const result = await platformCrossingCheckBroker({
        rootPath: FilePathStub({ value: testbed.guildPath }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual([]);
    });
  });

  describe('clean case', () => {
    it('VALID: {web only imports react, no gateway anywhere in reach} => reports nothing', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'platform-crossing-clean' }),
      });
      await harness.writeWorkspacesRoot({ testbed });
      await harness.writeWebPackage({ testbed });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/web/src/widgets/clean/clean-widget.tsx',
        content: "import { useState } from 'react';\nexport const CleanWidget = () => useState(0);",
      });

      const result = await platformCrossingCheckBroker({
        rootPath: FilePathStub({ value: testbed.guildPath }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual([]);
    });
  });

  describe('a browser package reaches the node gateway via the #gateway import prefix', () => {
    it('VALID: {web imports "#gateway/node/fs" directly} => reports it naming the real gateway package', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'platform-crossing-gateway-prefix-direct' }),
      });
      await harness.writeWorkspacesRoot({ testbed });
      await harness.writeWebPackage({ testbed });
      await harness.writeNodeGatewayPackage({ testbed });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/web/src/widgets/chat/chat-widget.tsx',
        content:
          "import { readFile } from '#gateway/node/fs';\nexport const ChatWidget = () => readFile();",
      });

      const result = await platformCrossingCheckBroker({
        rootPath: FilePathStub({ value: testbed.guildPath }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual([
        {
          packageName: 'web',
          platform: 'browser',
          chain: ['@dungeonmaster/node/fs'],
          crossedGatewayPackage: '@dungeonmaster/node',
        },
      ]);
    });

    it('VALID: {web imports a named broker whose file imports "#gateway/node/fs"} => reports the full chain naming the real gateway package', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'platform-crossing-gateway-prefix-multi-hop' }),
      });
      await harness.writeWorkspacesRoot({ testbed });
      await harness.writeWebPackage({ testbed });
      await harness.writeNodeGatewayPackage({ testbed });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/shared2/package.json',
        content: JSON.stringify({ name: '@dungeonmaster/shared2' }),
      });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/shared2/brokers.ts',
        content: "export * from './src/brokers/cwd-resolve/cwd-resolve-broker';",
      });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/shared2/src/brokers/cwd-resolve/cwd-resolve-broker.ts',
        content:
          "import { readFile } from '#gateway/node/fs';\nexport const cwdResolveBroker = () => readFile();",
      });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/web/src/widgets/chat/chat-widget.tsx',
        content:
          "import { cwdResolveBroker } from '@dungeonmaster/shared2/brokers';\nexport const ChatWidget = () => cwdResolveBroker();",
      });

      const result = await platformCrossingCheckBroker({
        rootPath: FilePathStub({ value: testbed.guildPath }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual([
        {
          packageName: 'web',
          platform: 'browser',
          chain: [
            '@dungeonmaster/shared2/brokers',
            './src/brokers/cwd-resolve/cwd-resolve-broker',
            '@dungeonmaster/node/fs',
          ],
          crossedGatewayPackage: '@dungeonmaster/node',
        },
      ]);
    });
  });

  describe('a browser package uses its own gateway folder via #gateway', () => {
    it('VALID: {web imports "#gateway/browser/localStorage"} => reports nothing, browser is not forbidden for a browser package', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'platform-crossing-gateway-prefix-allowed' }),
      });
      await harness.writeWorkspacesRoot({ testbed });
      await harness.writeWebPackage({ testbed });
      // The node package must also exist so `forbiddenPackageNames` is non-empty for `web` — an
      // empty forbidden list short-circuits the whole folder before it scans any file, which would
      // make this assert nothing about the browser-to-browser import it means to cover.
      await harness.writeNodeGatewayPackage({ testbed });
      await harness.writeBrowserGatewayPackage({ testbed });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/web/src/widgets/chat/chat-widget.tsx',
        content:
          "import { getItem } from '#gateway/browser/localStorage';\nexport const ChatWidget = () => getItem();",
      });

      const result = await platformCrossingCheckBroker({
        rootPath: FilePathStub({ value: testbed.guildPath }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual([]);
    });
  });

  describe('library package skip', () => {
    it('VALID: {a library package with no browser or node signals} => returns no violations even though it imports the gateway', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'platform-crossing-library' }),
      });
      await harness.writeWorkspacesRoot({ testbed });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/tools/package.json',
        content: JSON.stringify({ name: 'tools' }),
      });
      await harness.writeFile({
        testbed,
        relativePath: 'packages/tools/src/transformers/add/add-transformer.ts',
        content:
          "import { readFile } from '@dungeonmaster/node/fs';\nexport const addTransformer = () => readFile();",
      });

      const result = await platformCrossingCheckBroker({
        rootPath: FilePathStub({ value: testbed.guildPath }),
      });

      testbed.cleanup();

      // No package-type signal makes `tools` browser or node here (no widgets/, no responders/,
      // no flows/), so it detects as `library` and is skipped in both directions — Defaults item 6.
      expect(result).toStrictEqual([]);
    });
  });
});
