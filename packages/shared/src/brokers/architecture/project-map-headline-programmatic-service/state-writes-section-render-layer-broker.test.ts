import { stateWritesSectionRenderLayerBroker } from './state-writes-section-render-layer-broker';
import { stateWritesSectionRenderLayerBrokerProxy } from './state-writes-section-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineProgrammaticServiceStatics } from '../../../statics/project-map-headline-programmatic-service/project-map-headline-programmatic-service-statics';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });
const SRC_FILE_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/orchestrator/src/brokers/quest/persist/quest-persist-broker.ts',
});

describe('stateWritesSectionRenderLayerBroker', () => {
  describe('empty package', () => {
    it('EMPTY: {no state writes} => header present and empty notice shown', () => {
      const proxy = stateWritesSectionRenderLayerBrokerProxy();
      proxy.setupEmpty();

      const result = stateWritesSectionRenderLayerBroker({ packageRoot: PACKAGE_ROOT });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(projectMapHeadlineProgrammaticServiceStatics.stateWritesSectionHeader);
      expect(
        lines.some(
          (l) => l === projectMapHeadlineProgrammaticServiceStatics.stateWritesSectionEmpty,
        ),
      ).toBe(true);
    });
  });

  describe('in-memory stores', () => {
    it('VALID: {one in-memory store} => in-memory label present', () => {
      const proxy = stateWritesSectionRenderLayerBrokerProxy();

      proxy.setupSourceFiles({
        filePaths: [SRC_FILE_PATH],
        contents: [
          ContentTextStub({
            value:
              "import { orchestrationProcessesState } from '../state/orchestration-processes/orchestration-processes-state';",
          }),
        ],
        stateDirNames: ['orchestration-processes'],
      });

      const result = stateWritesSectionRenderLayerBroker({ packageRoot: PACKAGE_ROOT });

      const lines = String(result).split('\n');
      const inMemoryLine = lines.find((l) =>
        l.includes(projectMapHeadlineProgrammaticServiceStatics.inMemoryLabel),
      );

      expect(inMemoryLine).toBe(
        `  ${projectMapHeadlineProgrammaticServiceStatics.inMemoryLabel} orchestration-processes`,
      );
    });
  });

  describe('file writes', () => {
    it('VALID: {one file write} => files label present in output', () => {
      const proxy = stateWritesSectionRenderLayerBrokerProxy();

      proxy.setupSourceFiles({
        filePaths: [SRC_FILE_PATH],
        contents: [
          ContentTextStub({
            value: "fsWriteFileAdapter({ filePath: '/home/.dungeonmaster/quest.json', content });",
          }),
        ],
        stateDirNames: [],
      });

      const result = stateWritesSectionRenderLayerBroker({ packageRoot: PACKAGE_ROOT });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) =>
          l.trimStart().startsWith(projectMapHeadlineProgrammaticServiceStatics.filesLabel.trim()),
        ),
      ).toBe(true);
    });
  });

  describe('section header', () => {
    it('VALID: {any state writes} => section header is first line', () => {
      const proxy = stateWritesSectionRenderLayerBrokerProxy();

      proxy.setupSourceFiles({
        filePaths: [SRC_FILE_PATH],
        contents: [
          ContentTextStub({
            value:
              "import { orchestrationProcessesState } from '../state/orchestration-processes/orchestration-processes-state';",
          }),
        ],
        stateDirNames: ['orchestration-processes'],
      });

      const result = stateWritesSectionRenderLayerBroker({ packageRoot: PACKAGE_ROOT });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(projectMapHeadlineProgrammaticServiceStatics.stateWritesSectionHeader);
    });
  });
});
