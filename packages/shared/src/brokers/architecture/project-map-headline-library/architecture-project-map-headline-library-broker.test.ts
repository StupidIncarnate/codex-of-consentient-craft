import { architectureProjectMapHeadlineLibraryBroker } from './architecture-project-map-headline-library-broker';
import { architectureProjectMapHeadlineLibraryBrokerProxy } from './architecture-project-map-headline-library-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineLibraryStatics } from '../../../statics/project-map-headline-library/project-map-headline-library-statics';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/shared' });
const PACKAGE_NAME = ContentTextStub({ value: 'shared' });

const CONTRACTS_DIR = AbsoluteFilePathStub({ value: '/repo/packages/shared/src/contracts' });
const GUARDS_DIR = AbsoluteFilePathStub({ value: '/repo/packages/shared/src/guards' });
const STATICS_DIR = AbsoluteFilePathStub({ value: '/repo/packages/shared/src/statics' });

const TWO_BARREL_PKG_JSON = ContentTextStub({
  value:
    '{"exports":{"./contracts":{"import":"./dist/contracts.js"},"./guards":{"import":"./dist/guards.js"}}}',
});
const STATICS_BARREL_PKG_JSON = ContentTextStub({
  value: '{"exports":{"./statics":{"import":"./dist/statics.js"}}}',
});
const CONTRACTS_BARREL_PKG_JSON = ContentTextStub({
  value: '{"exports":{"./contracts":{"import":"./dist/contracts.js"}}}',
});

describe('architectureProjectMapHeadlineLibraryBroker', () => {
  describe('multi-barrel package', () => {
    it('VALID: {contracts + guards barrels} => contracts row appears in output', () => {
      const proxy = architectureProjectMapHeadlineLibraryBrokerProxy();
      proxy.setup({
        packageJsonContent: TWO_BARREL_PKG_JSON,
        barrelFileCounts: [
          { dirPath: CONTRACTS_DIR, fileNames: ['foo-contract.ts', 'bar-contract.ts'] },
          { dirPath: GUARDS_DIR, fileNames: ['is-foo-guard.ts'] },
        ],
        staticsFolderNames: [],
        projectRoot: PROJECT_ROOT,
        packages: [],
        sourceFiles: [],
      });

      const result = architectureProjectMapHeadlineLibraryBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) =>
          l.startsWith(
            `@dungeonmaster/shared/contracts    (2 ${projectMapHeadlineLibraryStatics.fileCountSuffix})`,
          ),
        ),
      ).toBe(true);
    });

    it('VALID: {contracts + guards barrels} => guards row appears in output', () => {
      const proxy = architectureProjectMapHeadlineLibraryBrokerProxy();
      proxy.setup({
        packageJsonContent: TWO_BARREL_PKG_JSON,
        barrelFileCounts: [
          { dirPath: CONTRACTS_DIR, fileNames: ['foo-contract.ts', 'bar-contract.ts'] },
          { dirPath: GUARDS_DIR, fileNames: ['is-foo-guard.ts'] },
        ],
        staticsFolderNames: [],
        projectRoot: PROJECT_ROOT,
        packages: [],
        sourceFiles: [],
      });

      const result = architectureProjectMapHeadlineLibraryBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) =>
          l.startsWith(
            `@dungeonmaster/shared/guards    (1 ${projectMapHeadlineLibraryStatics.fileCountSuffix})`,
          ),
        ),
      ).toBe(true);
    });
  });

  describe('statics inline special case', () => {
    it(`VALID: {statics barrel below threshold} => folder names listed inline`, () => {
      const proxy = architectureProjectMapHeadlineLibraryBrokerProxy();

      const staticFileNames = Array.from(
        { length: projectMapStatics.staticsInlineThreshold - 1 },
        (_, i) => `s${String(i)}-statics.ts`,
      );

      proxy.setup({
        packageJsonContent: STATICS_BARREL_PKG_JSON,
        barrelFileCounts: [{ dirPath: STATICS_DIR, fileNames: staticFileNames }],
        staticsFolderNames: ['project-map', 'mcp-tools'],
        projectRoot: PROJECT_ROOT,
        packages: [],
        sourceFiles: [],
      });

      const result = architectureProjectMapHeadlineLibraryBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.endsWith('— project-map, mcp-tools'))).toBe(true);
    });

    it(`VALID: {statics barrel at threshold} => inline NOT triggered`, () => {
      const proxy = architectureProjectMapHeadlineLibraryBrokerProxy();

      const staticFileNames = Array.from(
        { length: projectMapStatics.staticsInlineThreshold },
        (_, i) => `s${String(i)}-statics.ts`,
      );

      proxy.setup({
        packageJsonContent: STATICS_BARREL_PKG_JSON,
        barrelFileCounts: [{ dirPath: STATICS_DIR, fileNames: staticFileNames }],
        staticsFolderNames: ['project-map', 'mcp-tools'],
        projectRoot: PROJECT_ROOT,
        packages: [],
        sourceFiles: [],
      });

      const result = architectureProjectMapHeadlineLibraryBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.endsWith('— project-map, mcp-tools'))).toBe(false);
      expect(
        lines.some((l) =>
          l.startsWith(
            `@dungeonmaster/shared/statics    (${String(projectMapStatics.staticsInlineThreshold)} ${projectMapHeadlineLibraryStatics.fileCountSuffix})`,
          ),
        ),
      ).toBe(true);
    });
  });

  describe('consumers section', () => {
    it('EMPTY: {no packages import shared} => consumers section shows 0 consumer packages', () => {
      const proxy = architectureProjectMapHeadlineLibraryBrokerProxy();
      proxy.setup({
        packageJsonContent: CONTRACTS_BARREL_PKG_JSON,
        barrelFileCounts: [{ dirPath: CONTRACTS_DIR, fileNames: ['foo-contract.ts'] }],
        staticsFolderNames: [],
        projectRoot: PROJECT_ROOT,
        packages: [],
        sourceFiles: [],
      });

      const result = architectureProjectMapHeadlineLibraryBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === projectMapHeadlineLibraryStatics.noConsumersLine)).toBe(true);
    });

    it('VALID: {web imports shared} => consumers section shows count line', () => {
      const proxy = architectureProjectMapHeadlineLibraryBrokerProxy();
      proxy.setup({
        packageJsonContent: CONTRACTS_BARREL_PKG_JSON,
        barrelFileCounts: [{ dirPath: CONTRACTS_DIR, fileNames: ['foo-contract.ts'] }],
        staticsFolderNames: [],
        projectRoot: PROJECT_ROOT,
        packages: [ContentTextStub({ value: 'web' }), PACKAGE_NAME],
        sourceFiles: [
          {
            path: AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/app-widget.ts' }),
            source: ContentTextStub({
              value: "import { x } from '@dungeonmaster/shared/contracts';",
            }),
          },
        ],
      });

      const result = architectureProjectMapHeadlineLibraryBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '(1 consumer package)')).toBe(true);
    });
  });

  describe('library exports section header', () => {
    it('VALID: {any barrel} => first line is library exports header', () => {
      const proxy = architectureProjectMapHeadlineLibraryBrokerProxy();
      proxy.setup({
        packageJsonContent: CONTRACTS_BARREL_PKG_JSON,
        barrelFileCounts: [{ dirPath: CONTRACTS_DIR, fileNames: ['foo-contract.ts'] }],
        staticsFolderNames: [],
        projectRoot: PROJECT_ROOT,
        packages: [],
        sourceFiles: [],
      });

      const result = architectureProjectMapHeadlineLibraryBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(projectMapHeadlineLibraryStatics.libraryExportsSectionHeader);
    });
  });
});
