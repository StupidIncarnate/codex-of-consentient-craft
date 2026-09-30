import { architecturePackageTypeDetectBrokerProxy } from './architecture-package-type-detect-broker.proxy';
import { architecturePackageTypeDetectBroker } from './architecture-package-type-detect-broker';

const PACKAGE_ROOT = '/repo/packages/pkg';

describe('architecturePackageTypeDetectBroker', () => {
  describe('http-backend detection', () => {
    it('VALID: {hono in dependencies + flows/} => returns http-backend', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['flows', 'responders'],
        packageJsonContent: JSON.stringify({ dependencies: { hono: '^4.0.0' } }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['http-backend']);
    });

    it('VALID: {express in dependencies + flows/} => returns http-backend', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['flows'],
        packageJsonContent: JSON.stringify({ dependencies: { express: '^4.0.0' } }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['http-backend']);
    });
  });

  describe('mcp-server detection', () => {
    it('VALID: {MCP SDK in dependencies + flows/} => returns mcp-server', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['flows'],
        packageJsonContent: JSON.stringify({
          dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
        }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['mcp-server']);
    });

    it('VALID: {flow file imports ToolRegistration} => returns mcp-server', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['flows'],
        flowFilePath: `${PACKAGE_ROOT}/src/flows/arch-flow.ts`,
        flowFileContent: "import type { ToolRegistration } from '@modelcontextprotocol/sdk';",
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['mcp-server']);
    });
  });

  describe('mcp-server detection on the create-package seed', () => {
    it('VALID: {the seeded mcp-server shape: SDK dependency, statics + flows folders, flow returning the tool table} => returns mcp-server', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['statics', 'flows'],
        packageJsonContent: JSON.stringify({
          dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
        }),
        flowFilePath: `${PACKAGE_ROOT}/src/flows/tools/tools-flow.ts`,
        flowFileContent:
          "import { toolStatics } from '../../statics/tool/tool-statics';\n\nexport const ToolsFlow = (): typeof toolStatics.tools => toolStatics.tools;\n",
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['mcp-server']);
    });

    it('VALID: {the SDK dependency with no flows folder, as in @gateway/npm} => returns library', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['contracts'],
        packageJsonContent: JSON.stringify({
          dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
        }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['library']);
    });
  });

  describe('detection on the create-package seeds that import nothing outside their package', () => {
    it('VALID: {the seeded programmatic-service shape: no dependencies, flows + responders + state + startup, startup exporting an async namespace} => returns programmatic-service', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['flows', 'responders', 'startup', 'state'],
        packageJsonContent: JSON.stringify({ exports: { './package.json': './package.json' } }),
        startupFileName: 'start-jobs.ts',
        startupFileContent:
          "import { JobsFlow } from '../flows/jobs/jobs-flow';\n\nexport const StartJobs = {\n  run: async ({ input }: { input: string }): Promise<{ handled: boolean }> => {\n    const result = await JobsFlow({ input });\n    return result;\n  },\n};\n",
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['programmatic-service']);
    });

    it('VALID: {the seeded eslint-plugin shape: no dependencies, brokers/rule, responders/config/create, a . export, no bin} => returns eslint-plugin', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['brokers', 'responders'],
        brokerDirNames: ['rule'],
        responderDirNames: ['config'],
        responderDomainSubDirs: { config: ['create'] },
        packageJsonContent: JSON.stringify({
          exports: {
            '.': { source: './src/index.ts', require: './dist/index.js' },
            './package.json': './package.json',
          },
        }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['eslint-plugin']);
    });

    it('VALID: {the seeded hook-handlers shape: the node gateway dependency, responders/hook, two bin entries} => returns hook-handlers', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['responders'],
        responderDirNames: ['hook'],
        responderHookSubDirs: ['pre-tool-use'],
        packageJsonContent: JSON.stringify({
          dependencies: { '@acme/node': '*' },
          bin: {
            'hooks-pre-tool-use': './dist/bin/hooks-pre-tool-use.js',
            'hooks-session-start': './dist/bin/hooks-session-start.js',
          },
        }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['hook-handlers']);
    });

    it('VALID: {the seeded cli-tool shape: a bin entry whose bin source reads argv from the node gateway, a . export} => returns cli-tool', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['startup'],
        packageJsonContent: JSON.stringify({
          dependencies: { '@acme/node': '*' },
          exports: { '.': { source: './src/startup/start-runner.ts' } },
          bin: { runner: './dist/bin/runner-entry.js' },
        }),
        startupFileName: 'start-runner.ts',
        startupFileContent:
          'export const StartRunner = ({ command }: { command: string | undefined }): Promise<{ handled: boolean }> => Promise.resolve({ handled: command !== undefined });\n',
        binFileName: 'runner-entry.ts',
        binFileContent:
          "import { argv, exit, stderr } from '#gateway/node/process';\nimport { StartRunner } from '../src/startup/start-runner';\n",
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['cli-tool']);
    });
  });

  describe('frontend-ink detection', () => {
    it('VALID: {widgets/ + ink in dependencies} => returns frontend-ink', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['widgets'],
        packageJsonContent: JSON.stringify({ dependencies: { ink: '^5.0.0' } }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['frontend-ink']);
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
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['frontend-react']);
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
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['hook-handlers']);
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
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['eslint-plugin']);
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
        startupFileContent: 'const args = process.argv.slice(2);',
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['cli-tool']);
    });
  });

  describe('programmatic-service detection', () => {
    it('VALID: {flows + responders + state + startup exports async namespace} => returns programmatic-service', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['flows', 'responders', 'state', 'startup'],
        startupFileName: 'start-orchestrator.ts',
        startupFileContent:
          'export const StartOrchestrator = { runQuest: async ({ questId }) => {} };',
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['programmatic-service']);
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
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['library']);
    });
  });

  describe('priority ordering', () => {
    it('VALID: {widgets + flows + react + hono in dependencies} => http-backend wins the label, and frontend-react is still reported behind it', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['widgets', 'flows'],
        packageJsonContent: JSON.stringify({ dependencies: { hono: '^4.0.0', react: '18.2.0' } }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['http-backend', 'frontend-react']);
    });

    it('VALID: {widgets + flows + ink + hono in dependencies} => http-backend wins the label, and frontend-ink is still reported behind it', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['widgets', 'flows'],
        packageJsonContent: JSON.stringify({ dependencies: { hono: '^4.0.0', ink: '^5.0.0' } }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['http-backend', 'frontend-ink']);
    });

    it('VALID: {widgets + react, no shadowing http-backend signal} => frontend-react is reported ONCE, never repeated behind itself', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['widgets', 'bindings'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['frontend-react']);
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
        startupFileContent: 'process.argv.slice(2)',
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['cli-tool']);
    });

    it('VALID: {config package shape} => returns library', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['brokers', 'contracts'],
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['library']);
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
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['eslint-plugin']);
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
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['hook-handlers']);
    });

    it('VALID: {mcp package shape} => returns mcp-server', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['flows', 'responders'],
        packageJsonContent: JSON.stringify({
          dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
        }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['mcp-server']);
    });

    it('VALID: {orchestrator package shape} => returns programmatic-service', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['brokers', 'flows', 'responders', 'state', 'startup'],
        startupFileName: 'start-orchestrator.ts',
        startupFileContent:
          'export const StartOrchestrator = { runQuest: async ({ questId }) => {} };',
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['programmatic-service']);
    });

    it('VALID: {server package shape} => returns http-backend', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['flows', 'responders', 'startup'],
        packageJsonContent: JSON.stringify({ dependencies: { hono: '^4.0.0' } }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['http-backend']);
    });

    it('VALID: {shared package shape} => returns library', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['brokers', 'contracts', 'guards', 'statics', 'transformers'],
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['library']);
    });

    it('VALID: {tooling package shape} => returns cli-tool', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['startup', 'brokers'],
        packageJsonContent: JSON.stringify({ bin: { 'dm-tooling': './dist/bin.js' } }),
        startupFileName: 'start-primitive-duplicate-detection.ts',
        startupFileContent: 'const args = process.argv.slice(2);',
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['cli-tool']);
    });

    it('VALID: {ward package shape} => returns cli-tool', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['startup', 'brokers'],
        packageJsonContent: JSON.stringify({ bin: { ward: './dist/bin.js' } }),
        startupFileName: 'start-ward.ts',
        startupFileContent: 'const argv = process.argv.slice(2);',
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['cli-tool']);
    });

    it('VALID: {web package shape} => returns frontend-react', async () => {
      const proxy = architecturePackageTypeDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: PACKAGE_ROOT,
        srcDirNames: ['widgets', 'bindings'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const result = await architecturePackageTypeDetectBroker({
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(['frontend-react']);
    });
  });
});
