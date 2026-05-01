import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { PackageTypeStub } from '../../../contracts/package-type/package-type.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { architecturePackageTypeDetectBrokerProxy } from './architecture-package-type-detect-broker.proxy';
import { architecturePackageTypeDetectBroker } from './architecture-package-type-detect-broker';

const PACKAGE_ROOT = '/repo/packages/pkg';

describe('architecturePackageTypeDetectBroker', () => {
  describe('http-backend detection', () => {
    it('VALID: {adapters/hono} => returns http-backend', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        adapterDirNames: ['hono', 'fs'],
        srcDirNames: ['adapters', 'flows', 'responders'],
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'http-backend' }));
    });

    it('VALID: {adapters/express} => returns http-backend', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        adapterDirNames: ['express'],
        srcDirNames: ['adapters'],
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'http-backend' }));
    });
  });

  describe('mcp-server detection', () => {
    it('VALID: {adapters/@modelcontextprotocol} => returns mcp-server', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        adapterDirNames: ['@modelcontextprotocol'],
        srcDirNames: ['adapters'],
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'mcp-server' }));
    });

    it('VALID: {flow file imports ToolRegistration} => returns mcp-server', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['flows'],
        flowFilePath: `${PACKAGE_ROOT}/src/flows/arch-flow.ts`,
        flowFileContent: ContentTextStub({
          value: "import type { ToolRegistration } from '@modelcontextprotocol/sdk';",
        }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'mcp-server' }));
    });
  });

  describe('frontend-ink detection', () => {
    it('VALID: {widgets/ + adapters/ink} => returns frontend-ink', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['ink', 'fs'],
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'frontend-ink' }));
    });
  });

  describe('frontend-react detection', () => {
    it('VALID: {widgets/ + react in dependencies} => returns frontend-react', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['widgets', 'bindings'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'frontend-react' }));
    });
  });

  describe('hook-handlers detection', () => {
    it('VALID: {responders/hook + 2 bin entries} => returns hook-handlers', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['responders', 'startup'],
        responderDirNames: ['hook'],
        responderHookSubDirs: ['pre-tool-use'],
        packageJsonContent: JSON.stringify({
          bin: { 'dm-pre': './dist/pre.js', 'dm-post': './dist/post.js' },
        }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'hook-handlers' }));
    });
  });

  describe('eslint-plugin detection', () => {
    it('VALID: {brokers/rule + responders/*/create + exports[.] + no bin} => returns eslint-plugin', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['brokers', 'responders'],
        brokerDirNames: ['rule'],
        responderDirNames: ['rule'],
        responderDomainSubDirs: { rule: ['create', 'list'] },
        packageJsonContent: JSON.stringify({ exports: { '.': './dist/index.js' } }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'eslint-plugin' }));
    });
  });

  describe('cli-tool detection', () => {
    it('VALID: {bin entry + startup references process.argv} => returns cli-tool', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['startup'],
        packageJsonContent: JSON.stringify({ bin: { mycli: './dist/bin.js' } }),
        startupFileName: 'start-cli.ts',
        startupFileContent: ContentTextStub({
          value: 'const args = process.argv.slice(2);',
        }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'cli-tool' }));
    });
  });

  describe('programmatic-service detection', () => {
    it('VALID: {flows + responders + state + startup exports async namespace} => returns programmatic-service', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['flows', 'responders', 'state', 'startup'],
        startupFileName: 'start-orchestrator.ts',
        startupFileContent: ContentTextStub({
          value: 'export const StartOrchestrator = { runQuest: async ({ questId }) => {} };',
        }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'programmatic-service' }));
    });
  });

  describe('library detection (fallback)', () => {
    it('VALID: {no matching signals} => returns library', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['contracts', 'guards', 'transformers'],
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'library' }));
    });
  });

  describe('priority ordering', () => {
    it('VALID: {widgets + hono adapter} => http-backend wins over frontend-react', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['hono'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'http-backend' }));
    });
  });

  describe('real monorepo package shapes', () => {
    it('VALID: {cli package shape} => returns cli-tool', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['brokers', 'startup'],
        packageJsonContent: JSON.stringify({ bin: { dungeonmaster: './dist/bin.js' } }),
        startupFileName: 'start-install.ts',
        startupFileContent: ContentTextStub({ value: 'process.argv.slice(2)' }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'cli-tool' }));
    });

    it('VALID: {config package shape} => returns library', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['brokers', 'contracts'],
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'library' }));
    });

    it('VALID: {eslint-plugin package shape} => returns eslint-plugin', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['brokers', 'responders'],
        brokerDirNames: ['rule'],
        responderDirNames: ['rule'],
        responderDomainSubDirs: { rule: ['create'] },
        packageJsonContent: JSON.stringify({ exports: { '.': './dist/index.js' } }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'eslint-plugin' }));
    });

    it('VALID: {hooks package shape} => returns hook-handlers', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['responders', 'startup'],
        responderDirNames: ['hook'],
        responderHookSubDirs: ['pre-tool-use'],
        packageJsonContent: JSON.stringify({
          bin: { 'dm-pre-tool-use': './dist/pre.js', 'dm-session-start': './dist/session.js' },
        }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'hook-handlers' }));
    });

    it('VALID: {mcp package shape} => returns mcp-server', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['adapters', 'flows', 'responders'],
        adapterDirNames: ['@modelcontextprotocol'],
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'mcp-server' }));
    });

    it('VALID: {orchestrator package shape} => returns programmatic-service', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['brokers', 'flows', 'responders', 'state', 'startup'],
        startupFileName: 'start-orchestrator.ts',
        startupFileContent: ContentTextStub({
          value: 'export const StartOrchestrator = { runQuest: async ({ questId }) => {} };',
        }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'programmatic-service' }));
    });

    it('VALID: {server package shape} => returns http-backend', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['adapters', 'flows', 'responders', 'startup'],
        adapterDirNames: ['hono', 'ws', 'orchestrator'],
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'http-backend' }));
    });

    it('VALID: {shared package shape} => returns library', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['adapters', 'brokers', 'contracts', 'guards', 'statics', 'transformers'],
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'library' }));
    });

    it('VALID: {tooling package shape} => returns cli-tool', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['startup', 'brokers'],
        packageJsonContent: JSON.stringify({ bin: { 'dm-tooling': './dist/bin.js' } }),
        startupFileName: 'start-primitive-duplicate-detection.ts',
        startupFileContent: ContentTextStub({
          value: 'const args = process.argv.slice(2);',
        }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'cli-tool' }));
    });

    it('VALID: {ward package shape} => returns cli-tool', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['startup', 'brokers'],
        packageJsonContent: JSON.stringify({ bin: { ward: './dist/bin.js' } }),
        startupFileName: 'start-ward.ts',
        startupFileContent: ContentTextStub({
          value: 'const argv = process.argv.slice(2);',
        }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'cli-tool' }));
    });

    it('VALID: {web package shape} => returns frontend-react', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['widgets', 'bindings', 'adapters'],
        adapterDirNames: ['fetch'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'frontend-react' }));
    });
  });
});
