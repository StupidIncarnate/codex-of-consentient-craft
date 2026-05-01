import { exemplarSectionRenderLayerBroker } from './exemplar-section-render-layer-broker';
import { exemplarSectionRenderLayerBrokerProxy } from './exemplar-section-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineCliToolStatics } from '../../../statics/project-map-headline-cli-tool/project-map-headline-cli-tool-statics';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/ward' });

const STARTUP_SOURCE = ContentTextStub({
  value: [
    `import { WardRunResponder } from '../responders/ward/run/ward-run-responder';`,
    `import { WardDetailResponder } from '../responders/ward/detail/ward-detail-responder';`,
    `if (args[0] === 'run') { await WardRunResponder({ args }); }`,
    `if (args[0] === 'detail') { await WardDetailResponder({ args }); }`,
  ].join('\n'),
});

describe('exemplarSectionRenderLayerBroker', () => {
  describe('exemplar header', () => {
    it("VALID: {subcommand 'run'} => header line contains subcommand name", () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({ fn: () => ContentTextStub({ value: '' }) });

      const result = exemplarSectionRenderLayerBroker({
        subcommand: ContentTextStub({ value: 'run' }),
        startupSource: STARTUP_SOURCE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(
        `${projectMapHeadlineCliToolStatics.exemplarSectionPrefix}run${projectMapHeadlineCliToolStatics.exemplarSectionSuffix}`,
      );
    });
  });

  describe('call trace', () => {
    it("VALID: {subcommand 'run'} => trace starts with process.argv[2] entry", () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({ fn: () => ContentTextStub({ value: '' }) });

      const result = exemplarSectionRenderLayerBroker({
        subcommand: ContentTextStub({ value: 'run' }),
        startupSource: STARTUP_SOURCE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === `process.argv[2] === 'run'`)).toBe(true);
    });

    it('VALID: {startup with responder import} => responder name appears in trace', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({ fn: () => ContentTextStub({ value: '' }) });

      const result = exemplarSectionRenderLayerBroker({
        subcommand: ContentTextStub({ value: 'run' }),
        startupSource: STARTUP_SOURCE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('ward-run-responder'))).toBe(true);
    });
  });

  describe('output structure', () => {
    it('VALID: {any input} => output contains request chain header', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({ fn: () => ContentTextStub({ value: '' }) });

      const result = exemplarSectionRenderLayerBroker({
        subcommand: ContentTextStub({ value: 'run' }),
        startupSource: STARTUP_SOURCE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineCliToolStatics.exemplarRequestChainHeader),
      ).toBe(true);
    });

    it('VALID: {any input} => output contains code fence markers', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({ fn: () => ContentTextStub({ value: '' }) });

      const result = exemplarSectionRenderLayerBroker({
        subcommand: ContentTextStub({ value: 'run' }),
        startupSource: STARTUP_SOURCE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '```')).toBe(true);
    });
  });
});
