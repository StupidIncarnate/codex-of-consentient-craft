import { apiSectionRenderLayerBroker } from './api-section-render-layer-broker';
import { apiSectionRenderLayerBrokerProxy } from './api-section-render-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineProgrammaticServiceStatics } from '../../../statics/project-map-headline-programmatic-service/project-map-headline-programmatic-service-statics';

describe('apiSectionRenderLayerBroker', () => {
  describe('empty package', () => {
    it('EMPTY: {no methods} => header present and empty notice shown', () => {
      apiSectionRenderLayerBrokerProxy();

      const result = apiSectionRenderLayerBroker({
        methodNames: [],
        namespaceName: ContentTextStub({ value: 'StartOrchestrator' }),
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe('## Public API (StartOrchestrator.*)');
      expect(
        lines.some((l) => l === projectMapHeadlineProgrammaticServiceStatics.apiSectionEmpty),
      ).toBe(true);
    });
  });

  describe('known domain methods', () => {
    it('VALID: {listGuilds method} => Guilds domain header with method present in code block', () => {
      apiSectionRenderLayerBrokerProxy();

      const result = apiSectionRenderLayerBroker({
        methodNames: [ContentTextStub({ value: 'listGuilds' })],
        namespaceName: ContentTextStub({ value: 'StartOrchestrator' }),
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.startsWith('Guilds:'))).toBe(true);
    });

    it('VALID: {listGuilds method} => method name present in output', () => {
      apiSectionRenderLayerBrokerProxy();

      const result = apiSectionRenderLayerBroker({
        methodNames: [ContentTextStub({ value: 'listGuilds' })],
        namespaceName: ContentTextStub({ value: 'StartOrchestrator' }),
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('listGuilds'))).toBe(true);
    });

    it('VALID: {startQuest method} => Orchestration domain label present', () => {
      apiSectionRenderLayerBrokerProxy();

      const result = apiSectionRenderLayerBroker({
        methodNames: [ContentTextStub({ value: 'startQuest' })],
        namespaceName: ContentTextStub({ value: 'StartOrchestrator' }),
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.startsWith('Orchestration:'))).toBe(true);
    });
  });

  describe('unknown methods', () => {
    it('VALID: {unrecognised method} => placed under Other domain', () => {
      apiSectionRenderLayerBrokerProxy();

      const result = apiSectionRenderLayerBroker({
        methodNames: [ContentTextStub({ value: 'doObscureThing' })],
        namespaceName: ContentTextStub({ value: 'StartOrchestrator' }),
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.startsWith('Other:'))).toBe(true);
    });
  });

  describe('code block structure', () => {
    it('VALID: {methods present} => output wrapped in fenced code block', () => {
      apiSectionRenderLayerBrokerProxy();

      const result = apiSectionRenderLayerBroker({
        methodNames: [ContentTextStub({ value: 'listGuilds' })],
        namespaceName: ContentTextStub({ value: 'StartOrchestrator' }),
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '```')).toBe(true);
    });
  });
});
