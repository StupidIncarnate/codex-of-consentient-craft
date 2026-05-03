import { architectureProjectMapHeadlineCliToolBroker } from './architecture-project-map-headline-cli-tool-broker';
import { architectureProjectMapHeadlineCliToolBrokerProxy } from './architecture-project-map-headline-cli-tool-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineCliToolStatics } from '../../../statics/project-map-headline-cli-tool/project-map-headline-cli-tool-statics';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/ward' });

const MULTI_SUBCOMMAND_SOURCE = ContentTextStub({
  value: [
    `import { WardRunResponder } from '../../responders/ward/run/ward-run-responder';`,
    `import { WardDetailResponder } from '../../responders/ward/detail/ward-detail-responder';`,
    `import { WardRawResponder } from '../../responders/ward/raw/ward-raw-responder';`,
    `if (args[0] === 'run') { await WardRunResponder({ args, rootPath }); }`,
    `if (args[0] === 'detail') { await WardDetailResponder({ args, rootPath }); }`,
    `if (args[0] === 'raw') { await WardRawResponder({ args, rootPath }); }`,
  ].join('\n'),
});

const SINGLE_BIN_SOURCE = ContentTextStub({
  value: [
    `import { PrimitiveDuplicateDetectionRunResponder } from '../../responders/run/run-responder';`,
    `export const StartTool = async () => PrimitiveDuplicateDetectionRunResponder({ args: process.argv });`,
  ].join('\n'),
});

describe('architectureProjectMapHeadlineCliToolBroker', () => {
  describe('empty package (no package.json, no startup)', () => {
    it('EMPTY: {no package.json, no startup} => subcommands section header present', () => {
      const proxy = architectureProjectMapHeadlineCliToolBrokerProxy();
      proxy.setupEmpty();

      const result = architectureProjectMapHeadlineCliToolBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(projectMapHeadlineCliToolStatics.subcommandsSectionHeader);
    });

    it('EMPTY: {no startup} => no exemplar section in output', () => {
      const proxy = architectureProjectMapHeadlineCliToolBrokerProxy();
      proxy.setupEmpty();

      const result = architectureProjectMapHeadlineCliToolBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.startsWith('## Detailed exemplar'))).toBe(false);
    });
  });

  describe('single-bin package (no subcommand patterns in startup)', () => {
    it('VALID: {single-bin, no subcommand dispatch} => renders one-row table with bin name', () => {
      const proxy = architectureProjectMapHeadlineCliToolBrokerProxy();
      proxy.setupSingleBin({
        binName: 'detect-duplicate-primitives',
        startupFileName: 'start-primitive-duplicate-detection.ts',
        startupSource: SINGLE_BIN_SOURCE,
      });

      const result = architectureProjectMapHeadlineCliToolBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('detect-duplicate-primitives'))).toBe(true);
    });

    it('VALID: {single-bin with Responder import} => table shows responder name', () => {
      const proxy = architectureProjectMapHeadlineCliToolBrokerProxy();
      proxy.setupSingleBin({
        binName: 'detect-duplicate-primitives',
        startupFileName: 'start-primitive-duplicate-detection.ts',
        startupSource: SINGLE_BIN_SOURCE,
      });

      const result = architectureProjectMapHeadlineCliToolBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('PrimitiveDuplicateDetectionRunResponder'))).toBe(true);
    });

    it('VALID: {single-bin, no subcommands} => no exemplar section', () => {
      const proxy = architectureProjectMapHeadlineCliToolBrokerProxy();
      proxy.setupSingleBin({
        binName: 'detect-duplicate-primitives',
        startupFileName: 'start-primitive-duplicate-detection.ts',
        startupSource: SINGLE_BIN_SOURCE,
      });

      const result = architectureProjectMapHeadlineCliToolBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.startsWith('## Detailed exemplar'))).toBe(false);
    });
  });

  describe('multi-subcommand package', () => {
    it("VALID: {run/detail/raw subcommands} => 'run' appears in subcommands table", () => {
      const proxy = architectureProjectMapHeadlineCliToolBrokerProxy();
      proxy.setup({
        binName: 'dungeonmaster-ward',
        startupFileName: 'start-ward.ts',
        startupSource: MULTI_SUBCOMMAND_SOURCE,
      });

      const result = architectureProjectMapHeadlineCliToolBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      const runLine = `${'run'.padEnd(projectMapHeadlineCliToolStatics.commandNamePadWidth)} → WardRunResponder`;

      expect(lines.some((l) => l === runLine)).toBe(true);
    });

    it("VALID: {run/detail/raw subcommands} => 'detail' appears in subcommands table", () => {
      const proxy = architectureProjectMapHeadlineCliToolBrokerProxy();
      proxy.setup({
        binName: 'dungeonmaster-ward',
        startupFileName: 'start-ward.ts',
        startupSource: MULTI_SUBCOMMAND_SOURCE,
      });

      const result = architectureProjectMapHeadlineCliToolBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      const detailLine = `${'detail'.padEnd(projectMapHeadlineCliToolStatics.commandNamePadWidth)} → WardDetailResponder`;

      expect(lines.some((l) => l === detailLine)).toBe(true);
    });
  });

  describe('section separators', () => {
    it('VALID: {any startup} => sections separated by horizontal rule', () => {
      const proxy = architectureProjectMapHeadlineCliToolBrokerProxy();
      proxy.setup({
        binName: 'dungeonmaster-ward',
        startupFileName: 'start-ward.ts',
        startupSource: MULTI_SUBCOMMAND_SOURCE,
      });

      const result = architectureProjectMapHeadlineCliToolBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '---')).toBe(true);
    });
  });
});
