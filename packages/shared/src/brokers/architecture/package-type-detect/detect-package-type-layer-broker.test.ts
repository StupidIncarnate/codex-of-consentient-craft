import { PackageJsonStub } from '../../../contracts/package-json/package-json.stub';
import { PackageTypeStub } from '../../../contracts/package-type/package-type.stub';
import { FileCountStub } from '../../../contracts/file-count/file-count.stub';
import { detectPackageTypeLayerBrokerProxy } from './detect-package-type-layer-broker.proxy';
import { detectPackageTypeLayerBroker } from './detect-package-type-layer-broker';

describe('detectPackageTypeLayerBroker', () => {
  describe('http-backend (priority 1)', () => {
    it('VALID: {adapterDirNames: [hono]} => returns http-backend', () => {
      detectPackageTypeLayerBrokerProxy();

      const result = detectPackageTypeLayerBroker({
        adapterDirNames: ['hono'],
        srcDirNames: [],
        packageJson: PackageJsonStub(),
        startupFileContent: undefined,
        flowFileContent: undefined,
        hasResponderHook: false,
        hasBrokersRule: false,
        hasFlowsDir: false,
        hasRespondersDir: false,
        hasStateDir: false,
        hasResponderCreate: false,
        exportsHasDot: false,
        binEntryCount: FileCountStub({ value: 0 }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'http-backend' }));
    });

    it('VALID: {adapterDirNames: [express]} => returns http-backend', () => {
      detectPackageTypeLayerBrokerProxy();

      const result = detectPackageTypeLayerBroker({
        adapterDirNames: ['express'],
        srcDirNames: [],
        packageJson: PackageJsonStub(),
        startupFileContent: undefined,
        flowFileContent: undefined,
        hasResponderHook: false,
        hasBrokersRule: false,
        hasFlowsDir: false,
        hasRespondersDir: false,
        hasStateDir: false,
        hasResponderCreate: false,
        exportsHasDot: false,
        binEntryCount: FileCountStub({ value: 0 }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'http-backend' }));
    });
  });

  describe('mcp-server (priority 2)', () => {
    it('VALID: {adapterDirNames: [@modelcontextprotocol]} => returns mcp-server', () => {
      detectPackageTypeLayerBrokerProxy();

      const result = detectPackageTypeLayerBroker({
        adapterDirNames: ['@modelcontextprotocol'],
        srcDirNames: [],
        packageJson: PackageJsonStub(),
        startupFileContent: undefined,
        flowFileContent: undefined,
        hasResponderHook: false,
        hasBrokersRule: false,
        hasFlowsDir: false,
        hasRespondersDir: false,
        hasStateDir: false,
        hasResponderCreate: false,
        exportsHasDot: false,
        binEntryCount: FileCountStub({ value: 0 }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'mcp-server' }));
    });

    it('VALID: {flowFileContent with ToolRegistration import} => returns mcp-server', () => {
      detectPackageTypeLayerBrokerProxy();

      const result = detectPackageTypeLayerBroker({
        adapterDirNames: [],
        srcDirNames: [],
        packageJson: PackageJsonStub(),
        startupFileContent: undefined,
        flowFileContent: "import type { ToolRegistration } from '@modelcontextprotocol/sdk';",
        hasResponderHook: false,
        hasBrokersRule: false,
        hasFlowsDir: false,
        hasRespondersDir: false,
        hasStateDir: false,
        hasResponderCreate: false,
        exportsHasDot: false,
        binEntryCount: FileCountStub({ value: 0 }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'mcp-server' }));
    });
  });

  describe('frontend-ink (priority 3)', () => {
    it('VALID: {srcDirNames: [widgets], adapterDirNames: [ink]} => returns frontend-ink', () => {
      detectPackageTypeLayerBrokerProxy();

      const result = detectPackageTypeLayerBroker({
        adapterDirNames: ['ink'],
        srcDirNames: ['widgets'],
        packageJson: PackageJsonStub(),
        startupFileContent: undefined,
        flowFileContent: undefined,
        hasResponderHook: false,
        hasBrokersRule: false,
        hasFlowsDir: false,
        hasRespondersDir: false,
        hasStateDir: false,
        hasResponderCreate: false,
        exportsHasDot: false,
        binEntryCount: FileCountStub({ value: 0 }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'frontend-ink' }));
    });
  });

  describe('frontend-react (priority 4)', () => {
    it('VALID: {srcDirNames: [widgets], packageJson.dependencies.react} => returns frontend-react', () => {
      detectPackageTypeLayerBrokerProxy();

      const result = detectPackageTypeLayerBroker({
        adapterDirNames: [],
        srcDirNames: ['widgets'],
        packageJson: PackageJsonStub({ dependencies: { react: '18.0.0' } }),
        startupFileContent: undefined,
        flowFileContent: undefined,
        hasResponderHook: false,
        hasBrokersRule: false,
        hasFlowsDir: false,
        hasRespondersDir: false,
        hasStateDir: false,
        hasResponderCreate: false,
        exportsHasDot: false,
        binEntryCount: FileCountStub({ value: 0 }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'frontend-react' }));
    });
  });

  describe('hook-handlers (priority 5)', () => {
    it('VALID: {hasResponderHook, binEntryCount >= 2} => returns hook-handlers', () => {
      detectPackageTypeLayerBrokerProxy();

      const result = detectPackageTypeLayerBroker({
        adapterDirNames: [],
        srcDirNames: [],
        packageJson: PackageJsonStub(),
        startupFileContent: undefined,
        flowFileContent: undefined,
        hasResponderHook: true,
        hasBrokersRule: false,
        hasFlowsDir: false,
        hasRespondersDir: false,
        hasStateDir: false,
        hasResponderCreate: false,
        exportsHasDot: false,
        binEntryCount: FileCountStub({ value: 2 }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'hook-handlers' }));
    });
  });

  describe('eslint-plugin (priority 6)', () => {
    it('VALID: {hasBrokersRule, hasResponderCreate, exportsHasDot, binEntryCount=0} => returns eslint-plugin', () => {
      detectPackageTypeLayerBrokerProxy();

      const result = detectPackageTypeLayerBroker({
        adapterDirNames: [],
        srcDirNames: [],
        packageJson: PackageJsonStub(),
        startupFileContent: undefined,
        flowFileContent: undefined,
        hasResponderHook: false,
        hasBrokersRule: true,
        hasFlowsDir: false,
        hasRespondersDir: false,
        hasStateDir: false,
        hasResponderCreate: true,
        exportsHasDot: true,
        binEntryCount: FileCountStub({ value: 0 }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'eslint-plugin' }));
    });
  });

  describe('cli-tool (priority 7)', () => {
    it('VALID: {binEntryCount >= 1, startupFileContent with process.argv} => returns cli-tool', () => {
      detectPackageTypeLayerBrokerProxy();

      const result = detectPackageTypeLayerBroker({
        adapterDirNames: [],
        srcDirNames: [],
        packageJson: PackageJsonStub(),
        startupFileContent: 'const args = process.argv.slice(2);',
        flowFileContent: undefined,
        hasResponderHook: false,
        hasBrokersRule: false,
        hasFlowsDir: false,
        hasRespondersDir: false,
        hasStateDir: false,
        hasResponderCreate: false,
        exportsHasDot: false,
        binEntryCount: FileCountStub({ value: 1 }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'cli-tool' }));
    });
  });

  describe('programmatic-service (priority 8)', () => {
    it('VALID: {hasFlowsDir, hasRespondersDir, hasStateDir, startup exports async namespace} => returns programmatic-service', () => {
      detectPackageTypeLayerBrokerProxy();

      const result = detectPackageTypeLayerBroker({
        adapterDirNames: [],
        srcDirNames: [],
        packageJson: PackageJsonStub(),
        startupFileContent:
          'export const StartOrchestrator = { runQuest: async ({ questId }) => {} };',
        flowFileContent: undefined,
        hasResponderHook: false,
        hasBrokersRule: false,
        hasFlowsDir: true,
        hasRespondersDir: true,
        hasStateDir: true,
        hasResponderCreate: false,
        exportsHasDot: false,
        binEntryCount: FileCountStub({ value: 0 }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'programmatic-service' }));
    });
  });

  describe('library (fallback)', () => {
    it('VALID: {no signals match} => returns library', () => {
      detectPackageTypeLayerBrokerProxy();

      const result = detectPackageTypeLayerBroker({
        adapterDirNames: [],
        srcDirNames: [],
        packageJson: PackageJsonStub(),
        startupFileContent: undefined,
        flowFileContent: undefined,
        hasResponderHook: false,
        hasBrokersRule: false,
        hasFlowsDir: false,
        hasRespondersDir: false,
        hasStateDir: false,
        hasResponderCreate: false,
        exportsHasDot: false,
        binEntryCount: FileCountStub({ value: 0 }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'library' }));
    });
  });

  describe('priority ordering', () => {
    it('VALID: {widgets+hono+react-in-deps} => http-backend wins over frontend-react', () => {
      detectPackageTypeLayerBrokerProxy();

      const result = detectPackageTypeLayerBroker({
        adapterDirNames: ['hono'],
        srcDirNames: ['widgets'],
        packageJson: PackageJsonStub({ dependencies: { react: '18.0.0' } }),
        startupFileContent: undefined,
        flowFileContent: undefined,
        hasResponderHook: false,
        hasBrokersRule: false,
        hasFlowsDir: false,
        hasRespondersDir: false,
        hasStateDir: false,
        hasResponderCreate: false,
        exportsHasDot: false,
        binEntryCount: FileCountStub({ value: 0 }),
      });

      expect(result).toBe(PackageTypeStub({ value: 'http-backend' }));
    });
  });
});
