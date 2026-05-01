import { subcommandsSectionRenderLayerBroker } from './subcommands-section-render-layer-broker';
import { subcommandsSectionRenderLayerBrokerProxy } from './subcommands-section-render-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineCliToolStatics } from '../../../statics/project-map-headline-cli-tool/project-map-headline-cli-tool-statics';

const BIN_NAME = ContentTextStub({ value: 'dungeonmaster-ward' });
const BIN_NAME_WITH_PATH = ContentTextStub({ value: './dist/bin/dungeonmaster-ward.js' });

describe('subcommandsSectionRenderLayerBroker', () => {
  describe('no startup source', () => {
    it('EMPTY: {no startup source} => renders single-row table with bin name', () => {
      subcommandsSectionRenderLayerBrokerProxy();

      const result = subcommandsSectionRenderLayerBroker({
        startupSource: undefined,
        binName: BIN_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(projectMapHeadlineCliToolStatics.subcommandsSectionHeader);
      expect(lines.some((l) => l.includes('dungeonmaster-ward'))).toBe(true);
      expect(lines.some((l) => l.includes('(single-command bin)'))).toBe(true);
    });

    it('EMPTY: {no startup source, bin path} => strips path to bare name in table', () => {
      subcommandsSectionRenderLayerBrokerProxy();

      const result = subcommandsSectionRenderLayerBroker({
        startupSource: undefined,
        binName: BIN_NAME_WITH_PATH,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('dungeonmaster-ward.js'))).toBe(true);
    });
  });

  describe('single-command bin (no subcommand patterns in source)', () => {
    it('VALID: {startup with no args dispatch, one Responder import} => renders one row with responder', () => {
      subcommandsSectionRenderLayerBrokerProxy();

      const startupSource = ContentTextStub({
        value: [
          `import { PrimitiveDuplicateDetectionRunResponder } from '../../responders/run/run-responder';`,
          `export const StartTool = async () => PrimitiveDuplicateDetectionRunResponder({ args: process.argv });`,
        ].join('\n'),
      });

      const result = subcommandsSectionRenderLayerBroker({
        startupSource,
        binName: BIN_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('PrimitiveDuplicateDetectionRunResponder'))).toBe(true);
    });
  });

  describe('multi-subcommand startup', () => {
    it("VALID: {args[0] === 'run' and args[0] === 'detail'} => renders two rows", () => {
      subcommandsSectionRenderLayerBrokerProxy();

      const startupSource = ContentTextStub({
        value: [
          `import { WardRunResponder } from '../../responders/ward/run/ward-run-responder';`,
          `import { WardDetailResponder } from '../../responders/ward/detail/ward-detail-responder';`,
          `if (args[0] === 'run') { await WardRunResponder(); }`,
          `if (args[0] === 'detail') { await WardDetailResponder(); }`,
        ].join('\n'),
      });

      const result = subcommandsSectionRenderLayerBroker({
        startupSource,
        binName: BIN_NAME,
      });

      const lines = String(result).split('\n');

      const runLine = `${'run'.padEnd(projectMapHeadlineCliToolStatics.commandNamePadWidth)} → WardRunResponder`;
      const detailLine = `${'detail'.padEnd(projectMapHeadlineCliToolStatics.commandNamePadWidth)} → WardDetailResponder`;

      expect(lines.some((l) => l === runLine)).toBe(true);
      expect(lines.some((l) => l === detailLine)).toBe(true);
    });

    it('VALID: {three subcommands, three responders} => renders three rows', () => {
      subcommandsSectionRenderLayerBrokerProxy();

      const startupSource = ContentTextStub({
        value: [
          `import { WardRunResponder } from '../../responders/ward/run/ward-run-responder';`,
          `import { WardDetailResponder } from '../../responders/ward/detail/ward-detail-responder';`,
          `import { WardRawResponder } from '../../responders/ward/raw/ward-raw-responder';`,
          `if (args[0] === 'run') { await WardRunResponder(); }`,
          `if (args[0] === 'detail') { await WardDetailResponder(); }`,
          `if (args[0] === 'raw') { await WardRawResponder(); }`,
        ].join('\n'),
      });

      const result = subcommandsSectionRenderLayerBroker({
        startupSource,
        binName: BIN_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('run'))).toBe(true);
      expect(lines.some((l) => l.includes('detail'))).toBe(true);
      expect(lines.some((l) => l.includes('raw'))).toBe(true);
    });
  });

  describe('output structure', () => {
    it('VALID: {any source} => output starts with ## Subcommands header', () => {
      subcommandsSectionRenderLayerBrokerProxy();

      const result = subcommandsSectionRenderLayerBroker({
        startupSource: ContentTextStub({ value: '' }),
        binName: BIN_NAME,
      });

      expect(String(result).split('\n')[0]).toBe(
        projectMapHeadlineCliToolStatics.subcommandsSectionHeader,
      );
    });

    it('VALID: {any source} => output contains code fence markers', () => {
      subcommandsSectionRenderLayerBrokerProxy();

      const result = subcommandsSectionRenderLayerBroker({
        startupSource: ContentTextStub({ value: '' }),
        binName: BIN_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '```')).toBe(true);
    });
  });
});
