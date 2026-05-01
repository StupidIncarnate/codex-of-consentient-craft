import { exemplarSectionRenderLayerBroker } from './exemplar-section-render-layer-broker';
import { exemplarSectionRenderLayerBrokerProxy } from './exemplar-section-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineProgrammaticServiceStatics } from '../../../statics/project-map-headline-programmatic-service/project-map-headline-programmatic-service-statics';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });
const STARTUP_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/orchestrator/src/startup/start-orchestrator.ts',
});

const STARTUP_SOURCE = ContentTextStub({
  value: `export const StartOrchestrator = {
  startQuest: async ({ questId }: { questId: QuestId }): Promise<ProcessId> =>
    OrchestrationFlow.start({ questId }),
};`,
});

describe('exemplarSectionRenderLayerBroker', () => {
  describe('startup file not readable', () => {
    it('ERROR: {startup file missing} => minimal output with not-readable note', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        methodName: ContentTextStub({ value: 'startQuest' }),
        startupFilePath: STARTUP_PATH,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('startup source not readable'))).toBe(true);
    });
  });

  describe('startup file readable', () => {
    it('VALID: {startQuest method} => exemplar section header present', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupFiles({ files: [{ path: STARTUP_PATH, source: STARTUP_SOURCE }] });

      const result = exemplarSectionRenderLayerBroker({
        methodName: ContentTextStub({ value: 'startQuest' }),
        startupFilePath: STARTUP_PATH,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some(
          (l) =>
            l ===
            `${projectMapHeadlineProgrammaticServiceStatics.exemplarSectionPrefix}startQuest${projectMapHeadlineProgrammaticServiceStatics.exemplarSectionSuffix}`,
        ),
      ).toBe(true);
    });

    it('VALID: {startQuest method} => method name appears in call trace', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupFiles({ files: [{ path: STARTUP_PATH, source: STARTUP_SOURCE }] });

      const result = exemplarSectionRenderLayerBroker({
        methodName: ContentTextStub({ value: 'startQuest' }),
        startupFilePath: STARTUP_PATH,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.startsWith('startQuest'))).toBe(true);
    });

    it('VALID: {startQuest calls OrchestrationFlow.start} => flow delegation shown in trace', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupFiles({ files: [{ path: STARTUP_PATH, source: STARTUP_SOURCE }] });

      const result = exemplarSectionRenderLayerBroker({
        methodName: ContentTextStub({ value: 'startQuest' }),
        startupFilePath: STARTUP_PATH,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('OrchestrationFlow.start'))).toBe(true);
    });

    it('VALID: {any method with source} => output has call trace header', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupFiles({ files: [{ path: STARTUP_PATH, source: STARTUP_SOURCE }] });

      const result = exemplarSectionRenderLayerBroker({
        methodName: ContentTextStub({ value: 'startQuest' }),
        startupFilePath: STARTUP_PATH,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some(
          (l) => l === projectMapHeadlineProgrammaticServiceStatics.exemplarRequestChainHeader,
        ),
      ).toBe(true);
    });

    it('VALID: {any method with source} => output wrapped in fenced code block', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupFiles({ files: [{ path: STARTUP_PATH, source: STARTUP_SOURCE }] });

      const result = exemplarSectionRenderLayerBroker({
        methodName: ContentTextStub({ value: 'startQuest' }),
        startupFilePath: STARTUP_PATH,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '```')).toBe(true);
    });
  });

  describe('BOUNDARY box', () => {
    it('VALID: {startup has adapter import wrapping cross-package namespace} => BOUNDARY box top-left corner present', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      const adapterPath = AbsoluteFilePathStub({
        value:
          '/repo/packages/orchestrator/src/adapters/shared/discover/shared-discover-adapter.ts',
      });
      const adapterSource = ContentTextStub({
        value: `import { StartShared } from '@dungeonmaster/shared';
export const sharedDiscoverAdapter = ({ tool, args }) => StartShared.discover({ tool, args });`,
      });

      const startupWithAdapter = ContentTextStub({
        value: `import { sharedDiscoverAdapter } from '../adapters/shared/discover/shared-discover-adapter';
export const StartOrchestrator = {
  startQuest: async () => sharedDiscoverAdapter({ tool: 'discover', args: {} }),
};`,
      });

      proxy.setupFiles({
        files: [
          { path: STARTUP_PATH, source: startupWithAdapter },
          { path: adapterPath, source: adapterSource },
        ],
      });

      const result = exemplarSectionRenderLayerBroker({
        methodName: ContentTextStub({ value: 'startQuest' }),
        startupFilePath: STARTUP_PATH,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) =>
          l.includes(projectMapHeadlineProgrammaticServiceStatics.genericBoundaryBoxCornerTL),
        ),
      ).toBe(true);
    });
  });
});
